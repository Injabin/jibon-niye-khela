import { expect, test } from '@playwright/test';
import { readDisplayedState, resolveAllEvents, startNewLife } from './helpers';

test.describe('full loop smoke test (Gate 2)', () => {
  test('create a character, age up, resolve event choices, and reach the life summary', async ({ page }) => {
    await page.goto('/');
    await startNewLife(page);

    let eventSeen = false;

    for (let i = 0; i < 400; i++) {
      if (await page.getByTestId('life-summary').isVisible().catch(() => false)) break;

      await page.getByTestId('age-up').click();
      if (await page.getByTestId('event-card').isVisible().catch(() => false)) {
        eventSeen = true;
        await resolveAllEvents(page);
      }
    }

    // The loop terminates only because the character died and the summary rendered.
    await expect(page.getByTestId('life-summary')).toBeVisible();
    await expect(page.getByTestId('life-summary')).toContainText('Cause of death');
    expect(eventSeen).toBe(true);
  });

  test('choosing an option on an event changes the displayed stats', async ({ page }) => {
    await page.goto('/');
    await startNewLife(page);

    // Age up until an event with choices appears.
    for (let i = 0; i < 60; i++) {
      await page.getByTestId('age-up').click();
      if (await page.getByTestId('event-card').isVisible().catch(() => false)) break;
      await resolveAllEvents(page);
    }

    await expect(page.getByTestId('event-card')).toBeVisible();
    const before = await readDisplayedState(page);

    await page.getByTestId('choice-0').first().click();
    await expect(page.getByTestId('event-card')).toHaveCount(0);

    const after = await readDisplayedState(page);
    const statChanged =
      before.stats.health !== after.stats.health ||
      before.stats.happiness !== after.stats.happiness ||
      before.stats.smarts !== after.stats.smarts ||
      before.stats.looks !== after.stats.looks;
    const moneyChanged = before.money !== after.money;

    expect(statChanged || moneyChanged, 'no displayed stat or coins changed after a choice').toBe(true);
  });
});