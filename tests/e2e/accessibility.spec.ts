import { expect, test, type Page } from '@playwright/test';

async function startNewLife(page: Page): Promise<void> {
  await expect(page.getByTestId('new-game')).toBeVisible();
  await page.getByTestId('new-game').click();
  await expect(page.getByTestId('age-up')).toBeVisible();
}

/**
 * init.md M6 #1 — full keyboard-navigation and screen-reader labeling pass:
 * the modal overlays trap focus and close on Escape, focus returns to its
 * trigger, the family-tree graph is keyboard-operable, and interactive
 * elements carry accessible labels.
 */
test.describe('accessibility (M6 #1)', () => {
  test('page declares a single document heading', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  });

  test('settings opens with focus inside, Escape closes and restores it', async ({ page }) => {
    await page.goto('/');
    await startNewLife(page);
    const trigger = page.getByTestId('open-settings');
    await trigger.click();
    await expect(page.getByTestId('settings-panel')).toBeVisible();

    await expect
      .poll(() => page.evaluate(() => (document.activeElement as HTMLElement)?.dataset?.testid))
      .toBe('close-settings');

    await page.keyboard.press('Escape');
    await expect(page.getByTestId('settings-panel')).toBeHidden();
    await expect
      .poll(() => page.evaluate(() => (document.activeElement as HTMLElement)?.dataset?.testid))
      .toBe('open-settings');
  });

  test('actions sheet traps Tab and closes on Escape', async ({ page }) => {
    await page.goto('/');
    await startNewLife(page);
    await page.getByTestId('open-actions').click();
    await expect(page.getByTestId('active-menu')).toBeVisible();

    // Tab repeatedly: focus must stay inside the panel, landing on its Close
    // button when wrapping from the last focusable.
    for (let i = 0; i < 30; i++) {
      await page.keyboard.press('Tab');
    }
    const inside = await page.evaluate(() => {
      const panel = document.querySelector('[data-testid="active-menu"]');
      return Boolean(panel?.contains(document.activeElement));
    });
    expect(inside).toBe(true);

    await page.keyboard.press('Escape');
    await expect(page.getByTestId('active-menu')).toBeHidden();
    await expect
      .poll(() => page.evaluate(() => (document.activeElement as HTMLElement)?.dataset?.testid))
      .toBe('open-actions');
  });

  test('controls carry accessible names', async ({ page }) => {
    await page.goto('/');
    await startNewLife(page);
    await expect(page.getByTestId('age-up')).toBeVisible();

    await page.getByTestId('open-settings').click();
    await expect(page.getByRole('slider', { name: 'শব্দ-প্রভাবের ভলিউম' })).toBeEnabled();
    await expect(page.getByRole('slider', { name: 'মিউজিকের ভলিউম' })).toBeEnabled();
    await expect(page.getByRole('switch', { name: /শব্দ-প্রভাব/ })).toBeEnabled();
    await expect(page.getByRole('switch', { name: /মিউজিক/ })).toBeEnabled();
  });

  test('avatar is exposed as a labelled image', async ({ page }) => {
    await page.goto('/');
    await startNewLife(page);
    const avatar = page.getByTestId('avatar');
    await expect(avatar).toHaveAttribute('role', 'img');
    await expect(avatar).toHaveAttribute('aria-label', /^.+, .+$/);
  });
});