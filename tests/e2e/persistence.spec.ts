import { test, expect } from '@playwright/test';
import { readDisplayedState, resolveAllEvents, startNewLife } from './helpers';

test.describe('save persistence across reload (Gate 2)', () => {
  test('a hard refresh mid-life does not reset progress', async ({ page }) => {
    await page.goto('/');
    await startNewLife(page);

    // Age up a few times, resolving any events so no choice is left pending.
    for (let i = 0; i < 3; i++) {
      await page.getByTestId('age-up').click();
      await resolveAllEvents(page);
    }

    const before = await readDisplayedState(page);
    expect(before.age).not.toBeNull();
    expect(before.age).toBeGreaterThan(0);

    // Hard refresh (full navigation, fresh JS + storage reload).
    await page.reload();
    await expect(page.getByTestId('character-summary')).toBeVisible();

    const after = await readDisplayedState(page);
    expect(after.age).toBe(before.age);
    expect(after.money).toBe(before.money);
    expect(after.name).toBe(before.name);
    expect(after.stats).toEqual(before.stats);
  });

  test('the game still loads from storage after a full browser restart', async ({ context, page }) => {
    await page.goto('/');
    await startNewLife(page);
    await page.getByTestId('age-up').click();
    await resolveAllEvents(page);
    const before = await readDisplayedState(page);

    // Close the page entirely and open a fresh tab in a fresh context sharing storage.
    await page.close();
    const freshPage = await context.newPage();
    await freshPage.goto('/');

    await expect(freshPage.getByTestId('character-summary')).toBeVisible();
    const after = await readDisplayedState(freshPage);
    expect(after.age).toBe(before.age);
    expect(after.name).toBe(before.name);
    await freshPage.close();
  });
});