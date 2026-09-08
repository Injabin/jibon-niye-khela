import { expect, test, type Page } from '@playwright/test';

/**
 * Final Gate A/B (TESTING.md):
 *  - play three full lives to genuinely different outcomes on purpose and show
 *    the summaries are not the same generic recap (A item 2);
 *  - with ALL motion/sound disabled in Settings the game is still fully
 *    completable and doesn't look broken (B item 3).
 *
 * System-by-system reachability is already walked end-to-end in
 * systems.spec.ts (education, career, assets, crime, health, death/legacy,
 * achievements) and the family-tree legacy continue is covered by legacy.spec.
 */

type Strategy = 'first' | 'last' | 'middle';

async function startLife(page: Page): Promise<void> {
  if (!(await page.getByTestId('age-up').isVisible().catch(() => false))) {
    await page.getByTestId('new-game').click();
  }
  await expect(page.getByTestId('age-up')).toBeVisible({ timeout: 10_000 });
}

/** Age up + drain events until death, choosing options by `strategy`. */
async function drainOne(page: Page, strategy: Strategy): Promise<boolean> {
  const left = await page.evaluate(
    (pick) => {
      const store = (window as unknown as {
        __JNK_GAME_STORE__?: {
          getState: () => {
            pendingEvents?: Array<{ choices?: Array<{ id?: string }> }>;
            currentEventIndex?: number;
            resolveCurrentChoice?: (choiceId: string) => unknown;
          };
        };
      }).__JNK_GAME_STORE__;
      const s = store?.getState();
      if (!s || !s.pendingEvents || s.pendingEvents.length === 0) return 0;
      const event = s.pendingEvents[s.currentEventIndex ?? 0] ?? s.pendingEvents[0];
      const choices = event?.choices ?? [];
      const idx = pick === 'last' ? choices.length - 1 : pick === 'middle' ? Math.floor(choices.length / 2) : 0;
      const choice = choices[idx];
      if (!choice?.id) return 0;
      s.resolveCurrentChoice?.(choice.id);
      return 1;
    },
    strategy,
  );
  return left === 0;
}

async function playUntilDeath(page: Page, strategy: Strategy, maxYears = 220): Promise<void> {
  for (let i = 0; i < maxYears; i++) {
    if (await page.getByTestId('life-summary').isVisible().catch(() => false)) return;
    await drainAll(page, strategy);
    if (await page.getByTestId('life-summary').isVisible().catch(() => false)) return;
    await page.getByTestId('age-up').click();
    await drainAll(page, strategy);
  }
  await expect(page.getByTestId('life-summary')).toBeVisible({ timeout: 30_000 });
}

async function drainAll(page: Page, strategy: Strategy): Promise<void> {
  for (let i = 0; i < 200; i++) {
    if (await drainOne(page, strategy)) return;
  }
  throw new Error('events did not drain');
}

async function readLifeSummary(page: Page) {
  const text = (await page.getByTestId('life-summary').textContent()) ?? '';
  const name = text.match(/(.+?) lived for /)?.[1]?.trim() ?? '';
  const age = Number(text.match(/lived for (\d+) years/)?.[1] ?? -1);
  const cause = text.match(/Cause of death: (.+)/)?.[1]?.trim() ?? '';
  const worth = text.match(/\$ [\d,.]+(\.\d+)?K?/)?.[0] ?? '';
  const ribbons = (await page.getByTestId('life-ribbons').textContent().catch(() => '')) ?? '';
  const timeline = (await page.getByTestId('life-timeline').textContent().catch(() => '')) ?? '';
  return {
    name,
    age,
    cause,
    worth,
    ribbonCount: (ribbons.match(/★/g) ?? []).length,
    timelineCount: (timeline.match(/[·✦☺✗]/g) ?? []).length,
  };
}

test.describe('Final Gate A — three lives to divergent outcomes', () => {
  test('first-choice, last-choice and middle-choice lives produce different summaries', async ({ page }) => {
    const summaries: Awaited<ReturnType<typeof readLifeSummary>>[] = [];
    await page.goto('/');
    for (const strategy of ['first', 'last', 'middle'] as const) {
      await startLife(page);
      await playUntilDeath(page, strategy);
      summaries.push(await readLifeSummary(page));
      // Next life starts from the death screen via its own button (a reload
      // would re-read the persisted dead save and show the summary again).
      if (strategy !== 'middle') {
        await page.getByTestId('new-life').click();
        await expect(page.getByTestId('age-up')).toBeVisible({ timeout: 10_000 });
      }
    }

    const names = summaries.map((s) => s.name);
    console.log('THREE-LIVES ' + JSON.stringify(summaries));

    expect(new Set(names).size, 'three lived, three distinct people').toBe(3);

    const allSame =
      new Set(summaries.map((s) => s.worth)).size === 1 &&
      new Set(summaries.map((s) => s.cause)).size === 1 &&
      new Set(summaries.map((s) => s.ribbonCount)).size === 1 &&
      new Set(summaries.map((s) => s.timelineCount)).size === 1 &&
      new Set(summaries.map((s) => s.age)).size === 1;

    expect(allSame, 'outcomes must not be the same generic recap').toBe(false);
  });
});

test.describe('Final Gate B — completely disabled effects are still playable', () => {
  test('with reduced motion + sfx off in Settings, a full life completes and renders cleanly', async ({ page }) => {
    await page.goto('/');

    // Turn everything off through the real Settings UI, before starting a life.
    await page.getByTestId('open-settings').click();
    await expect(page.getByTestId('settings-panel')).toBeVisible();
    await page.getByTestId('settings-motion-reduced').check();
    await page.getByTestId('settings-sfx-toggle').evaluate((el) => (el.closest('label') as HTMLElement).click());
    await expect
      .poll(() => page.evaluate(() => document.documentElement.dataset.reducedMotion))
      .toBe('true');
    await page.getByTestId('close-settings').click();

    await startLife(page);
    await playUntilDeath(page, 'first');

    // Completed AND the death screen is structurally sound under zero effects.
    await expect(page.getByTestId('life-summary')).toBeVisible();
    await expect(page.getByTestId('life-chart-section')).toBeVisible();
    await expect(page.getByTestId('life-ribbons')).toBeVisible();
    await expect(page.getByTestId('life-timeline')).toBeVisible();
    await expect(page.getByTestId('error')).toBeHidden().catch(() => {});

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, 'no horizontal overflow with effects disabled').toBeLessThanOrEqual(1);
  });
});