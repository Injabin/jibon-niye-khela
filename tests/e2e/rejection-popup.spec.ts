import { expect, test } from '@playwright/test';
import { startNewLife } from './helpers';

test('rejected actions show a dismissible popup above the game UI', async ({ page }) => {
  await page.goto('/');
  await startNewLife(page);

  await page.evaluate(() => {
    const store = (window as unknown as {
      __JNK_GAME_STORE__: {
        getState: () => { character: Record<string, unknown> };
        setState: (patch: { character: Record<string, unknown> }) => void;
      };
    }).__JNK_GAME_STORE__;
    const character = store.getState().character;
    store.setState({ character: { ...character, activityBudgetUsed: 3 } });
  });

  await page.getByTestId('open-actions').first().click();
  await page.getByTestId('actions-tab-assets').click();
  await page.getByTestId('buy-car').click();

  const popup = page.getByTestId('rejection-popup');
  await expect(popup).toBeVisible();
  await expect(popup).toHaveAttribute('role', 'alert');
  await expect(page.getByTestId('active-menu')).toBeVisible();

  await page.getByTestId('dismiss-rejection').click();
  await expect(popup).toBeHidden();
});