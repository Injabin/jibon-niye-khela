/**
 * ============================================================================
 * Gemini API Client (Server-Side Only)
 * ============================================================================
 * Active Model: gemini-2.5-flash (AI Studio Free Tier, September 2026)
 * Fallback Model: gemini-2.0-flash
 *
 * Current Free-Tier Quota & Limits (verified in AI Studio):
 *  - Requests Per Minute (RPM): 15 RPM
 *  - Requests Per Day (RPD):    1,500 RPD (Shared project-level quota)
 *  - Tokens Per Minute (TPM):   1,000,000 TPM
 *
 * SECURITY NON-NEGOTIABLE:
 * This client runs strictly inside Node.js on the server (/app/api/generate-event).
 * The GEMINI_API_KEY environment variable MUST NEVER be exposed to the client.
 * ============================================================================
 */

if (typeof window !== 'undefined') {
  throw new Error('geminiClient is server-only and must never be imported or executed in the browser.');
}

export type GeminiErrorType =
  | 'KEY_MISSING'
  | 'TIMEOUT'
  | 'RPM_THROTTLED'
  | 'RPD_EXHAUSTED'
  | 'SAFETY_BLOCKED'
  | 'MALFORMED_OUTPUT'
  | 'SERVER_ERROR';

export interface GeminiClientResult {
  success: boolean;
  rawJson?: string;
  errorType?: GeminiErrorType;
  message?: string;
  retryAt?: number; // Epoch timestamp (seconds) for RPD reset
  retryAfterMs?: number; // Milliseconds for RPM backoff
}

export const ACTIVE_GEMINI_MODEL = 'gemini-2.5-flash';
export const FALLBACK_GEMINI_MODEL = 'gemini-2.0-flash';
const REQUEST_TIMEOUT_MS = 4_000; // 4 seconds max before client falls back

const SAFETY_SETTINGS = [
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
];

/** Computes next midnight UTC epoch in seconds */
export function computeNextUtcMidnightEpoch(): number {
  const next = new Date();
  next.setUTCHours(24, 0, 0, 0);
  return Math.floor(next.getTime() / 1000);
}

export async function callGeminiRaw(
  prompt: string,
  model = ACTIVE_GEMINI_MODEL,
): Promise<GeminiClientResult> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return {
      success: false,
      errorType: 'KEY_MISSING',
      message: 'GEMINI_API_KEY is not configured in environment variables.',
    };
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const payload = {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ],
    safetySettings: SAFETY_SETTINGS,
    generationConfig: {
      temperature: 0.85,
      topP: 0.95,
      responseMimeType: 'application/json',
    },
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (res.status === 429) {
      const errorText = await res.text().catch(() => '');
      const isDailyExhausted =
        /RESOURCE_EXHAUSTED/i.test(errorText) ||
        /quota/i.test(errorText) ||
        /daily/i.test(errorText);

      if (isDailyExhausted) {
        return {
          success: false,
          errorType: 'RPD_EXHAUSTED',
          message: 'Daily Gemini API quota has been exhausted.',
          retryAt: computeNextUtcMidnightEpoch(),
        };
      }

      return {
        success: false,
        errorType: 'RPM_THROTTLED',
        message: 'Rate limit hit (RPM throttle).',
        retryAfterMs: 60_000,
      };
    }

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      return {
        success: false,
        errorType: 'SERVER_ERROR',
        message: `Gemini API returned status ${res.status}: ${errBody.slice(0, 150)}`,
      };
    }

    const data = await res.json();

    // Check safety finishReason
    const candidate = data?.candidates?.[0];
    if (candidate?.finishReason === 'SAFETY' || data?.promptFeedback?.blockReason === 'SAFETY') {
      return {
        success: false,
        errorType: 'SAFETY_BLOCKED',
        message: 'Generation blocked by Gemini safetySettings.',
      };
    }

    const rawText = candidate?.content?.parts?.[0]?.text;
    if (!rawText || typeof rawText !== 'string') {
      return {
        success: false,
        errorType: 'MALFORMED_OUTPUT',
        message: 'Gemini returned empty or missing text in parts.',
      };
    }

    return {
      success: true,
      rawJson: rawText,
    };
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === 'AbortError') {
      return {
        success: false,
        errorType: 'TIMEOUT',
        message: `Gemini API request timed out after ${REQUEST_TIMEOUT_MS}ms.`,
      };
    }
    return {
      success: false,
      errorType: 'SERVER_ERROR',
      message: err instanceof Error ? err.message : 'Unknown network failure',
    };
  }
}
