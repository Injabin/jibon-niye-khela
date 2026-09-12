import { expect, test } from '@playwright/test';

interface AvatarState {
  hair: string;
  outfit: string;
}

test.describe('Phase 4 avatar customization', () => {
  test('custom life swatches persist and profile swatches update the avatar', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('open-custom-life-btn').click();
    await expect(page.getByTestId('custom-life-modal')).toBeVisible();

    await page.getByTestId('custom-hair-chestnut').click();
    await page.getByTestId('custom-outfit-mint').click();
    await page.getByTestId('start-custom-life-btn').click();
    await expect(page.getByTestId('character-summary')).toBeVisible();

    const readAppearance = () =>
      page.evaluate(() => {
        const store = (window as unknown as {
          __JNK_GAME_STORE__: { getState: () => { character: { appearance?: AvatarState } } };
        }).__JNK_GAME_STORE__;
        return store.getState().character.appearance;
      });

    await expect.poll(readAppearance).toEqual({ hair: 'chestnut', outfit: 'mint' });

    await page.getByTestId('deck-tab-profile').click();
    await expect(page.getByTestId('avatar-customization')).toBeVisible();
    await page.getByTestId('profile-hair-silver').click();
    await page.getByTestId('profile-outfit-coral').click();

    await expect.poll(readAppearance).toEqual({ hair: 'silver', outfit: 'coral' });
    await expect(page.getByTestId('profile-sheet').getByTestId('avatar')).toBeVisible();
  });
});
