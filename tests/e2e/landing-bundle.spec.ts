import { test, expect } from '@playwright/test';

test.describe('Gate 11 — Initial JS Bundle Inspection', () => {
  test('landing page does not eagerly load game engine, Howler, or Lottie in initial JS payload', async ({ page }) => {
    const initialScripts: string[] = [];
    const scriptResponses: Array<{ url: string; body: string }> = [];

    page.on('response', async (res) => {
      const url = res.url();
      if (url.includes('.js') && res.request().resourceType() === 'script') {
        initialScripts.push(url);
        try {
          const body = await res.text();
          scriptResponses.push({ url, body });
        } catch {
          // Ignore failed text decoding for aborts
        }
      }
    });

    // 1. Visit root landing page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 2. Inspect initial downloaded scripts
    const combinedScriptBodies = scriptResponses.map((s) => s.body).join('\n');

    // Howler signature check: howler defines HowlerGlobal or "howler.js"
    const hasHowler = combinedScriptBodies.includes('HowlerGlobal') || combinedScriptBodies.includes('howler.core');
    expect(hasHowler, 'Howler should not be bundled into the root landing page initial JS').toBe(false);

    // Lottie signature check: lottie-react defines AnimationItem or "lottie_canvas"
    const hasLottie = combinedScriptBodies.includes('AnimationItem') || combinedScriptBodies.includes('lottie_canvas');
    expect(hasLottie, 'Lottie should not be bundled into the root landing page initial JS').toBe(false);

    // Full 365 events content registry check: signature keywords from events registry
    const hasEventRegistry = combinedScriptBodies.includes('allEventsDef') || combinedScriptBodies.includes('EVENT_REGISTRY_365');
    expect(hasEventRegistry, 'Full event registry should not be bundled into the root landing page').toBe(false);

    // 3. Now click the Play CTA and verify navigation into /play
    const playCta = page.getByTestId('new-game');
    await playCta.click();
    await page.waitForURL('**/play**');

    // Once inside /play, game engine and audio assets load properly
    await expect(page.getByTestId('character-summary')).toBeVisible({ timeout: 15_000 });
  });
});
