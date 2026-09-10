import { expect, test } from '@playwright/test';

/**
 * TESTING.md Gate 6 — full keyboard-only walkthrough of one complete life.
 *
 * This is the automated realization of the "full keyboard-only walkthrough"
 * item: the ONLY inputs used are Tab / Enter / Escape via `page.keyboard`.
 * No `.click()`, `.fill()`, `.focus()` or store injection anywhere in the
 * test body — every action is a real key press against the live UI, so the
 * run documents the exact key sequence (tab-to-control, Enter to activate)
 * and proves birth → death is completable without a pointer.
 *
 * The run prints a narrative block (character, age at death, cause, worth,
 * year/event/key counts) that is recorded in TESTING.md.
 */
test('one full life, keyboard-only, birth to death', async ({ page, browserName }) => {
  test.setTimeout(600_000);
  test.skip(browserName !== 'chromium', 'keyboard walkthrough runs on chromium');

  const counts = { tabs: 0, enters: 0, escapes: 0, years: 0, events: 0 };

  async function activeTestId(): Promise<string | null> {
    return page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      return el?.dataset?.testid ?? null;
    });
  }

  async function tabTo(match: (testId: string) => boolean): Promise<boolean> {
    for (let i = 0; i < 120; i++) {
      const testId = await activeTestId();
      if (testId && match(testId)) return true;
      await page.keyboard.press('Tab');
      counts.tabs += 1;
    }
    return false;
  }

  async function activate(): Promise<void> {
    await page.keyboard.press('Enter');
    counts.enters += 1;
  }

  let summary = '';

  await test.step('start a life (keys only)', async () => {
    await page.goto('/');
    const started = await tabTo((id) => id === 'new-game');
    expect(started, 'Start life button must be reachable by Tab').toBe(true);
    await activate();
    await expect(page.getByTestId('character-summary')).toBeVisible();
  });

  await test.step('age up to death, resolving every event with the keyboard', async () => {
    while (counts.years < 220) {
      if (await page.getByTestId('life-summary').isVisible().catch(() => false)) break;

      // A mandatory dialog would swallow the keyboard; close it with Escape.
      if (await page.getByRole('dialog').isVisible().catch(() => false)) {
        await page.keyboard.press('Escape');
        counts.escapes += 1;
        await page.waitForTimeout(250);
        continue;
      }

      const hasPendingEvent = await page.evaluate(() => {
        const store = (window as unknown as {
          __JNK_GAME_STORE__?: {
            getState: () => { pendingEvents?: unknown[] };
          };
        }).__JNK_GAME_STORE__;
        return (store?.getState()?.pendingEvents?.length ?? 0) > 0;
      });

      if (hasPendingEvent || (await page.getByTestId('event-card').first().isVisible().catch(() => false))) {
        await expect(page.getByTestId('event-card').first()).toBeVisible({ timeout: 4000 });
        const found = await tabTo((id) => id.startsWith('choice-'));
        expect(found, 'an event choice must be reachable by Tab').toBe(true);
        await activate();
        counts.events += 1;
        await page.waitForTimeout(350);
        continue;
      }

      const found = await tabTo((id) => id === 'age-up');
      expect(found, 'age-up must be reachable by Tab').toBe(true);
      await activate();
      counts.years += 1;
    }
  });

  await test.step('a life was lived to death, keys only', async () => {
    await expect(page.getByTestId('life-summary')).toBeVisible({ timeout: 30_000 });
    summary = (await page.getByTestId('life-summary').textContent()) ?? '';
    expect(summary).toContain('lived for');
  });

  // Narrative block — copied into TESTING.md as Gate 6 evidence.
  console.log('KEYBOARD-LIFE NARRATIVE ' + JSON.stringify({ counts, summary }));
});