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
  await page.getByTestId('kind-car').click();
  await page.getByTestId('buy-car_toyota_corolla').click();

  const popup = page.getByTestId('rejection-popup');
  await expect(popup).toBeVisible();
  await expect(popup).toHaveAttribute('role', 'alert');
  await expect(page.getByTestId('active-menu')).toBeVisible();

  await page.getByTestId('dismiss-rejection').click();
  await expect(popup).toBeHidden();
});


test('successful actions show a dismissible success popup above the game UI', async ({ page }) => {
  await page.goto('/');
  await startNewLife(page);

  await page.evaluate(() => {
    const store = (window as unknown as {
      __JNK_GAME_STORE__: {
        getState: () => { character: Record<string, unknown>; message: string | null; rejection: string | null };
        setState: (patch: {
          character: Record<string, unknown>;
          message?: string | null;
          rejection?: string | null;
        }) => void;
      };
    }).__JNK_GAME_STORE__;
    const character = store.getState().character;
    store.setState({
      character: {
        ...character,
        age: 22,
        alive: true,
        money: 60_000,
        stats: { health: 60, happiness: 70, smarts: 70, looks: 60 },
        education: { stage: 'high', enrolled: false, gpa: 3.1, major: '', graduated: false },
        career: { jobId: null, performance: 50, yearsAtJob: 0 },
        assets: [],
        criminalRecord: [],
        flags: [],
        reputation: { fame: 0, karma: 60 },
      },
      message: null,
      rejection: null,
    });
  });

  await page.getByTestId('open-actions').first().click();
  await page.getByTestId('actions-tab-assets').click();
  await page.getByTestId('kind-car').click();
  await page.getByTestId('buy-car_toyota_corolla').click();

  const popup = page.getByTestId('success-popup');
  await expect(popup).toBeVisible();
  await expect(popup).toHaveAttribute('role', 'status');

  await page.getByTestId('dismiss-message').click();
  await expect(popup).toBeHidden();
});