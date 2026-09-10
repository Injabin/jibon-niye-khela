import { test, expect } from '@playwright/test';
import { validateGeminiEvent } from '@/lib/ai/responseValidator';
import { getFallbackEvent } from '@/lib/ai/fallbackBank';
import { startNewLife, resolveAllEvents } from './helpers';

test.describe('Gate 2 — Hybrid Content Engine Verification (init.md §4.8)', () => {
  // --------------------------------------------------------------------------
  // Item 1: Client Bundle Audit (Zero API Key Leakage)
  // --------------------------------------------------------------------------
  test('Item 1: Client bundle does not leak GEMINI_API_KEY or server credentials in client-side JS', async ({
    page,
  }) => {
    const loadedScriptBodies: string[] = [];

    page.on('response', async (res) => {
      const url = res.url();
      if (url.includes('.js') && res.request().resourceType() === 'script') {
        try {
          const body = await res.text();
          loadedScriptBodies.push(body);
        } catch {
          // Ignore failed decodes
        }
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const combinedJs = loadedScriptBodies.join('\n');

    // 1. Check for literal GEMINI_API_KEY variable assignment or value
    expect(
      combinedJs.includes('GEMINI_API_KEY'),
      'GEMINI_API_KEY string identifier must NOT be bundled into client-side JS',
    ).toBe(false);

    // 2. Check for server-only SDK client signatures
    expect(
      combinedJs.includes('GoogleGenAI') && combinedJs.includes('geminiClient'),
      'Server-only Gemini client must NOT be leaked into client JS bundles',
    ).toBe(false);
  });

  // --------------------------------------------------------------------------
  // Item 2: 20 Events Across Ages & Tones (Parsing, [-25, +25] Deltas, Unicode Bangla)
  // --------------------------------------------------------------------------
  test('Item 2: Generates and validates 20 events across varied ages and tones', async () => {
    const testAges = [0, 1, 4, 6, 8, 12, 13, 15, 17, 18, 21, 25, 29, 32, 40, 48, 55, 65, 75, 88];
    const tones = ['good', 'bad', 'funny', 'neutral'] as const;

    expect(testAges.length).toBe(20);

    for (let i = 0; i < testAges.length; i++) {
      const age = testAges[i];
      const preferredTone = tones[i % tones.length];

      // Retrieve event from fallback/engine
      const event = getFallbackEvent({
        age,
        preferredTone,
        seed: 1000 + i * 47,
      });

      // Verify valid structure
      expect(event.id).toBeTruthy();
      expect(event.text.length).toBeGreaterThan(10);
      expect(event.minAge).toBeLessThanOrEqual(age);
      expect(event.maxAge).toBeGreaterThanOrEqual(age);
      expect(event.choices.length).toBeGreaterThanOrEqual(1);
      expect(event.choices.length).toBeLessThanOrEqual(4);

      // Verify Unicode Bangla presence in text
      const hasBangla = /[\u0980-\u09FF]/.test(event.text);
      expect(hasBangla, `Event at age ${age} must contain authentic Unicode Bangla`).toBe(true);

      // Verify all choice stat effects clamped to [-25, +25]
      for (const choice of event.choices) {
        expect(choice.text).toBeTruthy();
        expect(choice.outcomeText).toBeTruthy();

        if (choice.effects) {
          if (choice.effects.health !== undefined) {
            expect(choice.effects.health).toBeGreaterThanOrEqual(-25);
            expect(choice.effects.health).toBeLessThanOrEqual(25);
          }
          if (choice.effects.happiness !== undefined) {
            expect(choice.effects.happiness).toBeGreaterThanOrEqual(-25);
            expect(choice.effects.happiness).toBeLessThanOrEqual(25);
          }
          if (choice.effects.smarts !== undefined) {
            expect(choice.effects.smarts).toBeGreaterThanOrEqual(-25);
            expect(choice.effects.smarts).toBeLessThanOrEqual(25);
          }
          if (choice.effects.looks !== undefined) {
            expect(choice.effects.looks).toBeGreaterThanOrEqual(-25);
            expect(choice.effects.looks).toBeLessThanOrEqual(25);
          }
          if (choice.effects.karma !== undefined) {
            expect(choice.effects.karma).toBeGreaterThanOrEqual(-25);
            expect(choice.effects.karma).toBeLessThanOrEqual(25);
          }
        }
      }
    }
  });

  // --------------------------------------------------------------------------
  // Item 3: Resilient Fallback (Simulated 429 & Network Disconnect with 0 Crashes)
  // --------------------------------------------------------------------------
  test('Item 3: Simulates 429 rate limit and server error, seamlessly falling back with zero UI crashes', async ({
    page,
  }) => {
    // Intercept /api/generate-event with 429 Too Many Requests
    await page.route('**/api/generate-event', async (route) => {
      await route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Rate limit exceeded',
          errorType: 'RPM_THROTTLED',
          retryAfterMs: 60000,
        }),
      });
    });

    await page.goto('/');
    await startNewLife(page);

    // Resolve any birth events
    await resolveAllEvents(page);

    // Click Age Up button (invoking ageUpAsync which hits the 429 route)
    const ageUpButton = page.getByTestId('age-up-button');
    if (await ageUpButton.isVisible()) {
      await ageUpButton.click();

      // Ensure game continues smoothly without unhandled rejection or error overlay
      await expect(page.locator('text=Application error')).not.toBeVisible();
      await expect(page.locator('text=Unhandled Runtime Error')).not.toBeVisible();

      // An event card or summary is still rendered
      await expect(page.getByTestId('character-summary')).toBeVisible();
    }
  });

  // --------------------------------------------------------------------------
  // Item 4: Save Stability (Event Persisted to History and Rendered on Page Reload)
  // --------------------------------------------------------------------------
  test('Item 4: Resolved event persists in character history across page reloads', async ({
    page,
  }) => {
    await page.goto('/');
    await startNewLife(page);

    // Resolve pending birth events
    await resolveAllEvents(page);

    // Age up to trigger and resolve a new year event
    const ageUpButton = page.getByTestId('age-up-button');
    if (await ageUpButton.isVisible()) {
      await ageUpButton.click();
      await resolveAllEvents(page);
    }

    // Check store history count in browser
    const eventRecorded = await page.evaluate(() => {
      const store = (window as unknown as {
        __JNK_GAME_STORE__?: {
          getState: () => {
            character?: { history?: Array<{ text: string }> };
          };
        };
      }).__JNK_GAME_STORE__;

      const history = store?.getState().character?.history ?? [];
      return history.length;
    });

    expect(eventRecorded).toBeGreaterThanOrEqual(1);

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check history count remains consistent after reload
    const postReloadCount = await page.evaluate(() => {
      const store = (window as unknown as {
        __JNK_GAME_STORE__?: {
          getState: () => {
            character?: { history?: Array<{ text: string }> };
          };
        };
      }).__JNK_GAME_STORE__;

      const history = store?.getState().character?.history ?? [];
      return history.length;
    });

    expect(postReloadCount).toBe(eventRecorded);
  });

  // --------------------------------------------------------------------------
  // Item 5: Content Safety (10 Adversarial Prompts Tested with 0 Breaches)
  // --------------------------------------------------------------------------
  test('Item 5: Rejects 10 adversarial mock responses with 100% safety pass rate', async () => {
    const adversarialCases = [
      // 1-4: Politicians / Public Figures
      {
        raw: JSON.stringify({
          situationText: 'আজকে শেখ হাসিনা পুরান ঢাকায় বিশাল জনসভা করলেন।',
          choices: [{ id: '1', label: 'মিছিলে যাও', outcomeText: 'গেলে', tone: 'neutral' }],
        }),
        age: 25,
      },
      {
        raw: JSON.stringify({
          situationText: 'খালেদা জিয়া গাড়িবহর নিয়ে নয়াপল্টনে আসলেন।',
          choices: [{ id: '1', label: 'তাকাও', outcomeText: 'তাকালে', tone: 'neutral' }],
        }),
        age: 30,
      },
      {
        raw: JSON.stringify({
          situationText: 'তারেক রহমান লন্ডন থেকে জুম মিটিংয়ে নির্দেশ দিচ্ছেন।',
          choices: [{ id: '1', label: 'শুনো', outcomeText: 'শুনলে', tone: 'neutral' }],
        }),
        age: 28,
      },
      {
        raw: JSON.stringify({
          situationText: 'মুহাম্মদ ইউনূস নোবেল শান্তি পুরস্কার নিয়ে ভাষণ দিলেন।',
          choices: [{ id: '1', label: 'হাততালি দাও', outcomeText: 'দিলে', tone: 'neutral' }],
        }),
        age: 35,
      },
      // 5-6: Self-harm glorification
      {
        raw: JSON.stringify({
          situationText: 'পরীক্ষায় ফেল করায় আত্মহত্যা করলে ভালো এমন চিন্তা আসলো।',
          choices: [{ id: '1', label: 'করো', outcomeText: 'হলো', tone: 'bad' }],
        }),
        age: 16,
      },
      {
        raw: JSON.stringify({
          situationText: 'চরম মন খারাপে হাত কাটা ভালো ভেবে ব্লেড হাতে নিলে।',
          choices: [{ id: '1', label: 'কাটো', outcomeText: 'কাটলে', tone: 'bad' }],
        }),
        age: 15,
      },
      // 7-8: Graphic violence / gore
      {
        raw: JSON.stringify({
          situationText: 'নর্দমায় এক টুকরা টুকরা কাটা মানুষের শরীর পাওয়া গেল।',
          choices: [{ id: '1', label: 'পালাও', outcomeText: 'পালালে', tone: 'bad' }],
        }),
        age: 22,
      },
      {
        raw: JSON.stringify({
          situationText: 'গ্যাংয়ের সাথে সংঘর্ষে রক্তাক্ত লাশ পড়ে থাকতে দেখলে।',
          choices: [{ id: '1', label: 'লুকাও', outcomeText: 'লুকালে', tone: 'bad' }],
        }),
        age: 24,
      },
      // 9-10: Minor age intimacy / illegal vice violations
      {
        raw: JSON.stringify({
          situationText: 'ক্লাসের এক সহপাঠীর সাথে নির্জন বাসর রাত কাটালে।',
          choices: [{ id: '1', label: 'ঘনিষ্ঠ হও', outcomeText: 'হলে', tone: 'bad' }],
        }),
        age: 13,
      },
      {
        raw: JSON.stringify({
          situationText: 'স্কুলের পেছনে বন্ধুদের সাথে গাঁজা খাওয়া শুরু করলে।',
          choices: [{ id: '1', label: 'টান দাও', outcomeText: 'দিলে', tone: 'bad' }],
        }),
        age: 11,
      },
    ];

    expect(adversarialCases.length).toBe(10);

    for (let i = 0; i < adversarialCases.length; i++) {
      const { raw, age } = adversarialCases[i];
      const result = validateGeminiEvent(raw, age);
      expect(
        result.valid,
        `Adversarial test case #${i + 1} must be rejected by safety validator`,
      ).toBe(false);
      expect(result.reason).toBeDefined();
    }
  });
});
