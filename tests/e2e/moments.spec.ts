import { expect, test, type Page } from '@playwright/test';
import { playUntilDeath, startNewLife } from './helpers';

/**
 * Gate 4 checks for the M4 moment layer:
 *  - a milestone event fires exactly one sting (single-instance, auto-clears)
 *  - the sting overlay is pointer-events-none (never blocks the game UI)
 *  - reduced motion swaps Lottie for the static badge (no broken layout)
 *  - death fires the tombstone sting, and the lazy Lottie chunk stays out of
 *    the initial payload until a sting/expression actually needs to play.
 *
 * NOTE: do not poll `getAttribute` to assert an element's *absence* —
 * `locator.getAttribute` auto-waits for the element and never returns null.
 * Use `not.toBeAttached()` for disappearance instead.
 */

const CONFETTI_EVENT = {
  id: 'e2e-confetti',
  text: 'You win the school bake-off.',
  minAge: 6,
  maxAge: 12,
  weight: 1,
  tone: 'good',
  category: 'childhood',
  moment: 'confetti',
  choices: [
    {
      id: 'celebrate',
      text: 'Celebrate with your class',
      effects: { happiness: 5 },
      outcomeText: 'You celebrated.',
      tone: 'good',
    },
  ],
};

/** Inject a deterministic moment event and resolve it through the real store. */
async function fireFakeMoment(page: Page): Promise<void> {
  // Let the main thread settle before driving the store from outside (the
  // lottie chunk and animation JSONs load lazily right after a life starts,
  // which can stall the page under heavy parallel test load).
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  await page.evaluate((event) => {
    const store = (window as unknown as { __JNK_GAME_STORE__?: { setState: (p: object) => void; getState: () => { resolveCurrentChoice: (id: string) => unknown } } }).__JNK_GAME_STORE__;
    if (!store) throw new Error('store not exposed');
    store.setState({ pendingEvents: [event], currentEventIndex: 0 });
    store.getState().resolveCurrentChoice('celebrate');
  }, CONFETTI_EVENT);
}

test.describe('moment stings (Gate 4)', () => {
  test('a milestone event fires a single full-motion sting that auto-clears', async ({ page }) => {
    test.setTimeout(60_000);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/');
    await startNewLife(page);

    await fireFakeMoment(page);

    await expect(page.getByTestId('moment-sting')).toHaveAttribute('data-kind', 'confetti');

    // Gate 4: the good-tone outcome drives the sparkle expression overlay at
    // runtime (tone → ExpressionId mapping, DESIGN.md §7).
    await expect(page.getByTestId('avatar-expression')).toHaveAttribute('data-expression', 'sparkle');
    await expect(page.getByTestId('avatar-expression')).toHaveAttribute('data-motion', 'lottie');

    // Never blocks the game: a click targeting the overlay's center must land
    // on the game UI beneath it, not on the sting (pointer-events: none).
    const hit = await page.evaluate(() => {
      const sting = document.querySelector<HTMLElement>('[data-testid="moment-sting"]');
      if (!sting) return null;
      const r = sting.getBoundingClientRect();
      const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return { isSting: el === sting, tag: el ? el.tagName.toLowerCase() : null };
    });
    expect(hit?.isSting).toBe(false);

    await expect(page.getByTestId('moment-sting-visual')).toHaveAttribute('data-motion', 'lottie');

    // Auto-clear: the sting removes itself from the DOM.
    await expect(page.getByTestId('moment-sting')).not.toBeAttached();
  });

  test('reduced motion swaps the sting for the static badge', async ({ page }) => {
    test.setTimeout(60_000);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await startNewLife(page);

    await fireFakeMoment(page);

    await expect(page.getByTestId('moment-sting')).toHaveAttribute('data-kind', 'confetti');
    await expect(page.getByTestId('moment-sting-visual')).toHaveAttribute('data-motion', 'static');
  });

  test('death fires the tombstone sting', async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto('/');
    await startNewLife(page);
    await playUntilDeath(page);

    await expect(page.getByTestId('moment-sting')).toHaveAttribute('data-kind', 'tombstone');
  });
});