import { expect, type Page } from '@playwright/test';

/** Read the character's displayed state used to compare across reloads. */
export async function readDisplayedState(page: Page) {
  const summary = await page.getByTestId('character-summary').locator('h2').textContent();
  const ageText = await page.getByTestId('character-summary').textContent();
  const moneyText = await page.getByTestId('money').textContent();

  const ageMatch = ageText?.match(/(\d+) years old/);
  const health = await page.getByRole('progressbar', { name: 'Health' }).getAttribute('aria-valuenow');
  const happiness = await page
    .getByRole('progressbar', { name: 'Happiness' })
    .getAttribute('aria-valuenow');
  const smarts = await page.getByRole('progressbar', { name: 'Smarts' }).getAttribute('aria-valuenow');
  const looks = await page.getByRole('progressbar', { name: 'Looks' }).getAttribute('aria-valuenow');

  return {
    name: summary?.trim() ?? '',
    age: ageMatch ? Number(ageMatch[1]) : null,
    money: moneyText?.trim() ?? '',
    stats: { health, happiness, smarts, looks },
  };
}

/** Start a fresh life (automatically waits for hydration + new-game button). */
export async function startNewLife(page: Page): Promise<void> {
  await page.getByTestId('new-game').click();
  await page.waitForFunction(() => typeof (window as unknown as { __JNK_GAME_STORE__?: unknown }).__JNK_GAME_STORE__ !== 'undefined');
  await expect(page.getByTestId('character-summary')).toBeVisible({ timeout: 10_000 });
}

/**
 * Resolve all pending event choices.
 *
 * Drives the store directly (the global is exposed by gameStore as a
 * diagnostic/test hook) instead of clicking DOM buttons: card enter/exit
 * animations set `pointer-events: none` mid-transition and swap the DOM
 * mid-click, so a Playwright `click()` or even a native `button.click()` races
 * the swap and can fire an old card's handler with a new card's choice id.
 * Real pointer interaction is asserted separately in the event tests.
 */
export async function resolveAllEvents(page: Page): Promise<void> {
  await page.evaluate(() =>
    new Promise<void>((resolvePromise) => {
      const store = (window as unknown as {
        __JNK_GAME_STORE__?: {
          getState: () => {
            pendingEvents?: Array<{ choices?: Array<{ id?: string }> }>;
            currentEventIndex?: number;
            resolveCurrentChoice?: (choiceId: string) => unknown;
            isGeneratingEvent?: boolean;
          };
        };
      }).__JNK_GAME_STORE__;
      let guard = 60;
      const tick = () => {
        const s = store?.getState();
        if (s?.isGeneratingEvent) {
          requestAnimationFrame(tick);
          return;
        }
        if (guard-- <= 0 || !s || !s.pendingEvents || s.pendingEvents.length === 0) {
          return resolvePromise();
        }
        const event = s.pendingEvents[s.currentEventIndex ?? 0] ?? s.pendingEvents[0];
        const choice = event?.choices?.[0];
        if (!choice?.id) return resolvePromise();
        s.resolveCurrentChoice?.(choice.id);
        requestAnimationFrame(tick);
      };
      tick();
    }),
  );
}

/** Age up repeatedly, resolving any events, until the life summary appears. */
export async function playUntilDeath(page: Page, maxYears = 400): Promise<void> {
  for (let i = 0; i < maxYears; i++) {
    if (await page.getByTestId('life-summary').isVisible().catch(() => false)) return;
    // Drain any pending events *before* clicking age-up: the store refuses to
    // age up while a choice is pending, so clicking first can stall forever
    // whenever a year starts with leftover events (G5 content makes 0–3/year
    // the norm). resolveAllEvents is idempotent, so this is safe to always call.
    await resolveAllEvents(page);
    // A resolved choice can be fatal — the summary may have just rendered, in
    // which case age-up is gone and we must stop rather than wait on it.
    if (await page.getByTestId('life-summary').isVisible().catch(() => false)) return;
    await page.getByTestId('age-up').click();
    await resolveAllEvents(page);
  }
  await expect(page.getByTestId('life-summary')).toBeVisible();
}