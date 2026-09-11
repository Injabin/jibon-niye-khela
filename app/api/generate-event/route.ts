import { NextRequest, NextResponse } from 'next/server';
import { callGeminiRaw } from '@/lib/ai/geminiClient';
import { buildDhakaiyaPrompt, type PromptInput } from '@/lib/ai/promptBuilder';
import { validateGeminiEvent } from '@/lib/ai/responseValidator';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, errorType: 'MALFORMED_REQUEST', message: 'Invalid JSON request body' },
        { status: 400 },
      );
    }

    const input = body as PromptInput;
    if (typeof input.age !== 'number' || !input.stage || !input.stats) {
      return NextResponse.json(
        { success: false, errorType: 'MALFORMED_REQUEST', message: 'Missing required character fields (age, stage, stats)' },
        { status: 400 },
      );
    }

    // Build the constrained Dhakaiya prompt
    const prompt = buildDhakaiyaPrompt(input);

    // Call the serverless Gemini client
    const geminiResult = await callGeminiRaw(prompt);

    if (!geminiResult.success || !geminiResult.rawJson) {
      const statusMap: Record<string, number> = {
        KEY_MISSING: 503,
        RPD_EXHAUSTED: 429,
        RPM_THROTTLED: 429,
        TIMEOUT: 504,
        SAFETY_BLOCKED: 422,
        MALFORMED_OUTPUT: 422,
        SERVER_ERROR: 500,
      };
      const status = statusMap[geminiResult.errorType ?? 'SERVER_ERROR'] ?? 500;

      return NextResponse.json(
        {
          success: false,
          errorType: geminiResult.errorType,
          message: geminiResult.message,
          retryAt: geminiResult.retryAt,
          retryAfterMs: geminiResult.retryAfterMs,
        },
        { status },
      );
    }

    // Run secondary safety, schema, bounds, and age validation
    const categoryMap: Record<string, 'childhood' | 'teen' | 'young-adult' | 'adult' | 'senior' | 'universal'> = {
      infant: 'childhood',
      child: 'childhood',
      teen: 'teen',
      'young-adult': 'young-adult',
      adult: 'adult',
      senior: 'senior',
    };

    const targetCategory = categoryMap[input.stage] ?? 'universal';
    const validation = validateGeminiEvent(geminiResult.rawJson, input.age, targetCategory);

    if (!validation.valid || !validation.event) {
      return NextResponse.json(
        {
          success: false,
          errorType: 'VALIDATION_FAILED',
          message: validation.reason ?? 'Gemini event failed schema or safety validation',
        },
        { status: 422 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        event: validation.event,
        source: 'gemini',
      },
      { status: 200 },
    );
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        errorType: 'SERVER_ERROR',
        message: err instanceof Error ? err.message : 'Internal server error',
      },
      { status: 500 },
    );
  }
}
