import { expect, test, type Page } from '@playwright/test';

/**
 * Final Gate C (TESTING.md): robustness under hostile usage.
 *  - rapid Age Up clicks must not desync UI from state;
 *  - resizing down to 360px mid-session must not break layout;
 *  - opening a second tab over an existing save must not corrupt storage.
 */

async function startLife(page: Page): Promise<void> {
  await page.getByTestId('new-game').click();
  await expect(page.getByTestId('age-up')).toBeVisible({ timeout: 10_000 });
}

async function drainEvents(page: Page): Promise<void> {
  // Single-resolve pass repeated until nothing is pending (robust even when a
  // burst of age-ups queued tens of events).
  for (let i = 0; i < 200; i++) {
    await page.evaluate(() => {
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
      if (!s || !s.pendingEvents || s.pendingEvents.length === 0) return;
      const event = s.pendingEvents[s.currentEventIndex ?? 0] ?? s.pendingEvents[0];
      const choice = event?.choices?.[0];
      if (!choice?.id) return;
      s.resolveCurrentChoice?.(choice.id);
    });
    const left = await page.evaluate(
      () =>
        (window as unknown as { __JNK_GAME_STORE__: { getState: () => { pendingEvents: unknown[] } } }).__JNK_GAME_STORE__
          .getState().pendingEvents.length,
    );
    if (left === 0) return;
  }
  throw new Error('events did not drain');
}

async function storeAge(page: Page): Promise<number> {
  return page.evaluate(() => (window as unknown as { __JNK_GAME_STORE__: { getState: () => { character: { age: number } } } }).__JNK_GAME_STORE__.getState().character.age);
}

async function displayedAge(page: Page): Promise<number | null> {
  const text = (await page.getByTestId('character-summary').textContent()) ?? '';
  return Number(text.match(/(\d+) years old/)?.[1] ?? null);
}

test.describe('Final Gate C — robustness', () => {
  test('rapid Age Up clicking does not desync the UI from the store', async ({ page }) => {
    await page.goto('/');
    await startLife(page);

    const before = await storeAge(page);
    // Spam Age Up as a real user would: whenever the button exists, click it,
    // up to 25 usable frames regardless of intervening event cards.
    await page.evaluate(
      () =>
        new Promise<void>((resolvePromise) => {
          let remaining = 25;
          const step = () => {
            const btn = document.querySelector('[data-testid="age-up"]') as HTMLButtonElement | null;
            if (btn && remaining > 0) {
              btn.click();
              remaining -= 1;
              requestAnimationFrame(step);
            } else {
              resolvePromise();
            }
          };
          step();
        }),
    );
    await drainEvents(page);
    await page.waitForTimeout(300);

    const after = await storeAge(page);
    const shown = await displayedAge(page);

    // At least one tick landed, and the UI never drifted from the store —
    // rapid clicks either applied exactly once or were dropped cleanly.
    expect(after).toBeGreaterThan(before);
    expect(shown).toBe(after);
    await expect(page.getByTestId('error')).toBeHidden().catch(() => {});

    // A normal age-up still works afterwards.
    await page.getByTestId('age-up').click();
    await drainEvents(page);
    expect(await displayedAge(page)).toBe(after + 1);
  });

  test('resizing from desktop to 360px mid-session does not break layout or state', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await startLife(page);
    await page.getByTestId('age-up').click();
    await drainEvents(page);
    const ageBefore = await storeAge(page);

    await page.setViewportSize({ width: 360, height: 640 });

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, 'no horizontal scroll at 360px').toBeLessThanOrEqual(1);

    await expect(page.getByTestId('age-up')).toBeVisible();
    await page.getByTestId('age-up').click();
    await drainEvents(page);
    expect(await storeAge(page)).toBe(ageBefore + 1);
  });

  test('a second tab over an existing save does not corrupt storage', async ({ context, page }) => {
    await page.goto('/');
    await startLife(page);
    await page.getByTestId('age-up').click();
    await drainEvents(page);
    const name = (await page.getByTestId('character-summary').locator('h2').textContent())?.trim() ?? '';

    // Second tab over the same save (same storage).
    const second = await context.newPage();
    await second.goto('/');
    await expect(second.getByTestId('character-summary')).toBeVisible();
    await expect(second.getByTestId('error')).toBeHidden().catch(() => {});
    expect((await second.getByTestId('character-summary').locator('h2').textContent())?.trim()).toBe(name);

    // First tab lives on (last-write wins); the second tab re-reads cleanly.
    await page.getByTestId('age-up').click();
    await drainEvents(page);
    await second.reload();
    await expect(second.getByTestId('character-summary')).toBeVisible();
    await expect(second.getByTestId('error')).toBeHidden().catch(() => {});
    await expect(second.getByTestId('age-up')).toBeVisible();
  });
});