import { test, expect, type Page } from '@playwright/test';
import path from 'node:path';

async function assertNoHorizontalScroll(page: Page, contextName: string) {
  const hasHorizontalScroll = await page.evaluate(() => {
    return (
      document.documentElement.scrollWidth > document.documentElement.clientWidth ||
      document.body.scrollWidth > window.innerWidth
    );
  });
  expect(
    hasHorizontalScroll,
    `Unexpected horizontal scrollbar detected on ${contextName} (scrollWidth > clientWidth)`
  ).toBe(false);
}

test.describe('Gate 11 — Public Landing / Marketing Page', () => {
  test('Hero section, features, video, and tags render correctly', async ({ page }) => {
    await page.goto('/');

    // 1. Brand Nav & Title
    await expect(page.locator('h1')).toContainText('Jibon Niye Khela');

    // 2. Primary & Secondary CTAs
    const playCta = page.getByTestId('new-game');
    await expect(playCta).toBeVisible();
    await expect(playCta).toContainText('Play Free in Browser');

    const customCta = page.getByTestId('open-custom-life-btn');
    await expect(customCta).toBeVisible();

    // 3. Gameplay Video and Features
    await expect(page.getByTestId('gameplay-video')).toBeVisible();
    await expect(page.getByText('Every Life is Different')).toBeVisible();
    await expect(page.getByText('Reactive Stats, Sounds & Moments')).toBeVisible();
    await expect(page.getByText('100% Free Forever, No Ads, No Accounts')).toBeVisible();

    // 4. Tags
    await expect(page.getByTestId('tag-life-simulation')).toBeVisible();
    await expect(page.getByTestId('tag-choice-driven')).toBeVisible();
    await expect(page.getByTestId('tag-free-to-play')).toBeVisible();
    await expect(page.getByTestId('tag-no-ads')).toBeVisible();
    await expect(page.getByTestId('tag-browser-based')).toBeVisible();
  });

  test('Responsive layouts: 375px, 900px, 1440px with zero horizontal scroll', async ({ page }) => {
    const viewports = [
      { name: 'mobile-375px', width: 375, height: 667 },
      { name: 'tablet-900px', width: 900, height: 800 },
      { name: 'desktop-1440px', width: 1440, height: 900 },
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');

      // Confirm primary CTA visible
      await expect(page.getByTestId('new-game')).toBeVisible();

      // Zero horizontal scroll assertion
      await assertNoHorizontalScroll(page, `${vp.name} Landing`);

      // Capture screenshot for evidence
      const screenshotPath = path.join(process.cwd(), 'test-results', 'landing', `${vp.name}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: false });
    }
  });

  test('Primary Play CTA routes directly into New Life flow with zero paywalls or signups', async ({ page }) => {
    await page.goto('/');

    const playCta = page.getByTestId('new-game');
    await expect(playCta).toBeVisible();
    await playCta.click();

    // Verify URL routes to /play
    await page.waitForURL('**/play**');
    expect(page.url()).toContain('/play');

    // Confirm game character is initialized and ready to play
    await expect(page.getByTestId('character-summary')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('age-up')).toBeVisible();

    // Confirm no signup wall, payment prompt, or broken links
    expect(await page.locator('input[type="password"]').count()).toBe(0);
    expect(await page.getByText(/credit card|pricing|subscribe|sign in/i).count()).toBe(0);
  });
});
