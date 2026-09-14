import { expect, test } from '@playwright/test';
import { resolveAllEvents } from './helpers';

/**
 * init.md Phase 6 / Gate 6 — live-Gemini latency handling.
 *
 * Proves that while a live `/api/generate-event` call is in flight the UI shows
 * an explicit thinking state (spinner + "ভাবছে…", `aria-busy`) instead of a
 * frozen UI, and that a slow/hung request gracefully falls back: the route is
 * stalled for 1.5s then fails, the client must surface an event from the
 * fallback bank and return the Age Up control to normal.
 */
test('live call shows a thinking state, then times out into the fallback bank', async ({ page }) => {
  test.setTimeout(120_000);

  // Stall the proxy route so the client has time to render the thinking state,
  // then fail it — this is the "slow/hung request" the gate mandates surviving.
  let stalled = 0;
  await page.route('**/api/generate-event', async (route) => {
    stalled += 1;
    await new Promise((r) => setTimeout(r, 1_500));
    await route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ success: false, errorType: 'SERVER_ERROR', message: 'stalled' }),
    });
  });

  await page.goto('/');
  await page.getByTestId('new-game').click();
  await expect(page.getByTestId('character-summary')).toBeVisible();
  await expect(page.getByTestId('age-up')).toBeVisible();

  // Age up until a year actually tries a live Gemini call (milestone years
  // always do; non-milestones may on the seeded wildcard). canAgeUp is blocked
  // while events are pending, so drain them first.
  let thinkingSeen = false;
  while (stalled < 3) {
    await resolveAllEvents(page);
    if (await page.getByTestId('life-summary').isVisible().catch(() => false)) break;

    // Click Age Up and race: does a visible thinking state appear?
    const button = page.getByTestId('age-up');
    await button.click();
    try {
      await expect(button).toHaveAttribute('aria-busy', 'true', { timeout: 4_000 });
      await expect(button.getByText(/ভাবছে/)).toBeVisible({ timeout: 4_000 });
      thinkingSeen = true;
      break;
    } catch {
      await page.waitForFunction(() => {
        const store = (window as unknown as {
          __JNK_GAME_STORE__?: { getState: () => { isGeneratingEvent?: boolean } };
        }).__JNK_GAME_STORE__;
        return !store?.getState()?.isGeneratingEvent;
      }, { timeout: 10_000 }).catch(() => {});
    }
  }

  expect(thinkingSeen, 'the thinking/loading state must be visible during a live Gemini call').toBe(true);

  // The stalled request falls back: no player-visible failure, event surfaces,
  // generation flag clears, and the control returns to normal.
  await expect(page.getByTestId('event-card').first()).toBeVisible({ timeout: 15_000 });
  await page.waitForFunction(() => {
    const store = (window as unknown as {
      __JNK_GAME_STORE__?: { getState: () => { isGeneratingEvent?: boolean } };
    }).__JNK_GAME_STORE__;
    return !store?.getState()?.isGeneratingEvent;
  }, { timeout: 10_000 });

  await resolveAllEvents(page);
  const button = page.getByTestId('age-up');
  await expect(button).toHaveAttribute('aria-busy', 'false');
  await expect(button.getByText(/বয়স/)).toBeVisible();
});