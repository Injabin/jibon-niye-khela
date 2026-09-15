import { expect, test } from '@playwright/test';
import { resolveAllEvents, startNewLife } from './helpers';

/**
 * Part G — Mobile ControlDeck bottom navigation.
 *
 * The deck is exactly four tabs — প্রোফাইল / কাজকর্ম / আত্মীয়স্বজন / ⋯ — and
 * nothing sits below them. The ⋯ tab holds the remaining actions: নতুন জীবন,
 * নিজের মতো, সেটিংস, শর্টকাট, সেভ, লোড. Desktop is untouched: the deck itself is
 * never mounted there, and the sidebar buttons remain direct.
 */
test.describe('Part G — ControlDeck bottom navigation', () => {
  test('mobile deck shows exactly the four tabs; everything else hides behind ⋯', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await startNewLife(page);

    // The task says "তাদের নিচে কিছুই থাকবে না": the Age-Up button sits above
    // the tabs, and the tab row is the last thing in the footer.
    await expect(page.getByTestId('age-up')).toBeVisible();
    await expect(page.getByTestId('deck-tab-profile')).toBeVisible();
    await expect(page.getByTestId('open-actions')).toBeVisible();
    await expect(page.getByTestId('deck-tab-relatives')).toBeVisible();
    await expect(page.getByTestId('deck-more')).toBeVisible();

    // Nothing under the tabs: the ⋯ menu is closed, and there is no separate
    // settings/utility row in the deck anymore.
    await expect(page.getByTestId('deck-more-menu')).toBeHidden();

    // Open it to reveal all six actions and nothing else of the nav.
    await page.getByTestId('deck-more').click();
    await expect(page.getByTestId('deck-more-menu')).toBeVisible();
    await expect(page.getByTestId('deck-new-life')).toBeVisible();
    await expect(page.getByTestId('deck-custom-life')).toBeVisible();
    await expect(page.getByTestId('deck-open-settings')).toBeVisible();
    await expect(page.getByTestId('deck-open-shortcuts')).toBeVisible();
    await expect(page.getByTestId('export-save')).toBeVisible();
    await expect(page.getByTestId('deck-import-save')).toBeVisible();

    // The main Age Up control stays reachable while the menu is open.
    await expect(page.getByTestId('age-up')).toBeVisible();
  });

  test('closing the ⋯ menu via backdrop keeps the game intact', async ({ page }) => {
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

    // And the relatives tab opens its sheet from the same deck.
    await page.getByTestId('deck-tab-relatives').click();
    await expect(page.getByTestId('relations-sheet')).toBeVisible();
    await page.getByTestId('close-relations').click();
    await expect(page.getByTestId('relations-sheet')).toBeHidden();
  });

  test('⋯ actions function: shortcuts, settings, and save/load all fire', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await startNewLife(page);

    // Shortcuts modal opens from the ⋯ menu
    await page.getByTestId('deck-more').click();
    await expect(page.getByTestId('deck-more-menu')).toBeVisible();
    await page.getByTestId('deck-open-shortcuts').click();
    await expect(page.getByTestId('shortcuts-modal')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('shortcuts-modal')).toBeHidden();

    // Settings opens from the ⋯ menu and closes again
    await page.getByTestId('deck-more').click();
    await expect(page.getByTestId('deck-more-menu')).toBeVisible();
    await page.getByTestId('deck-open-settings').click();
    await expect(page.getByTestId('settings-panel')).toBeVisible();
    await page.getByTestId('close-settings').click();
    await expect(page.getByTestId('settings-panel')).toBeHidden();

    // সেভ (export) fires a save download from the ⋯ menu
    await page.getByTestId('deck-more').click();
    await expect(page.getByTestId('deck-more-menu')).toBeVisible();
    const downloadPromise = page.waitForEvent('download');
    await page.getByTestId('export-save').click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.json$/);

    // লোড (import) fires the real file picker from the ⋯ menu item
    await page.getByTestId('deck-more').click();
    await expect(page.getByTestId('deck-more-menu')).toBeVisible();
    const chooserPromise = page.waitForEvent('filechooser');
    await page.getByTestId('deck-import-save').click();
    await chooserPromise;
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