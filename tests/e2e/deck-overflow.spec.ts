import { expect, test } from '@playwright/test';
import { resolveAllEvents, startNewLife } from './helpers';

/**
 * Part G — Mobile ControlDeck ⋯ overflow menu.
 *
 * The secondary utilities (shortcuts, save/load, reset) collapse behind a ⋯
 * trigger on the mobile deck so small phones stay uncluttered. Desktop is
 * untouched: the deck itself is never mounted there, and the sidebar buttons
 * remain direct.
 */
test.describe('Part G — ControlDeck overflow menu', () => {
  test('mobile deck keeps main tabs visible and hides utilities behind ⋯', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await startNewLife(page);

    // Deck is mounted with primary controls
    await expect(page.getByTestId('age-up')).toBeVisible();
    await expect(page.getByTestId('deck-tab-profile')).toBeVisible();
    await expect(page.getByTestId('open-actions')).toBeVisible();
    await expect(page.getByTestId('deck-tab-assets')).toBeVisible();
    await expect(page.getByTestId('open-settings')).toBeVisible();

    // Utilities are collapsed behind the ⋯ trigger
    await expect(page.getByTestId('deck-more')).toBeVisible();
    await expect(page.getByTestId('deck-more-menu')).toBeHidden();
    await expect(page.getByTestId('deck-open-shortcuts')).toBeHidden();
    await expect(page.getByTestId('export-save')).toBeHidden();
    await expect(page.getByTestId('reset')).toBeHidden();

    // Open the overflow menu
    await page.getByTestId('deck-more').click();
    await expect(page.getByTestId('deck-more-menu')).toBeVisible();
    await expect(page.getByTestId('deck-open-shortcuts')).toBeVisible();
    await expect(page.getByTestId('export-save')).toBeVisible();
    await expect(page.getByTestId('deck-import-save')).toBeVisible();
    await expect(page.getByTestId('reset')).toBeVisible();

    // The main Age Up control stays reachable while the menu is open
    await expect(page.getByTestId('age-up')).toBeVisible();
  });

  test('closing the overflow menu via backdrop keeps the game intact', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await startNewLife(page);
    await resolveAllEvents(page);

    await page.getByTestId('deck-more').click();
    await expect(page.getByTestId('deck-more-menu')).toBeVisible();

    // Tap the inert backdrop outside the menu
    await page.mouse.click(20, 20);
    await expect(page.getByTestId('deck-more-menu')).toBeHidden();

    // Everything still works after closing
    await expect(page.getByTestId('character-summary')).toBeVisible();
    await expect(page.getByTestId('age-up')).toBeVisible();
  });

  test('overflow actions still function: shortcuts open, reset returns to landing', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await startNewLife(page);

    // Shortcuts modal opens from the overflow menu
    await page.getByTestId('deck-more').click();
    await expect(page.getByTestId('deck-more-menu')).toBeVisible();
    await page.getByTestId('deck-open-shortcuts').click();
    await expect(page.getByTestId('shortcuts-modal')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('shortcuts-modal')).toBeHidden();

    // Reset lives behind the ⋯ trigger too
    await page.getByTestId('deck-more').click();
    await expect(page.getByTestId('deck-more-menu')).toBeVisible();
    await page.getByTestId('reset').click();
    await expect(page.getByTestId('new-game')).toBeVisible();
  });

  test('desktop is untouched: no deck, no ⋯ trigger (sidebar remains)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await startNewLife(page);

    await expect(page.getByTestId('character-summary')).toBeVisible();
    await expect(page.getByTestId('deck-more')).toBeHidden();
    await expect(page.locator('footer')).toHaveCount(0);

    // Sidebar utility buttons remain directly reachable
    await expect(page.getByTestId('export-save')).toBeVisible();
    await expect(page.getByTestId('reset')).toBeVisible();
    await expect(page.getByTestId('open-settings')).toBeVisible();
  });
});