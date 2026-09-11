import { expect, test, type Page } from '@playwright/test';
import { resolveAllEvents } from './helpers';

/**
 * Gate 8 Automated Test Suite — Responsive Layout Overhaul
 *
 * Verifies:
 * 1. Mobile (375px), Tablet (900px), and Desktop (1440px) use distinct layout tiers.
 * 2. Zero horizontal scrolling (scrollWidth <= clientWidth) across all supported widths
 *    on Landing, Hub, Life Actions, Family Tree, Settings, and Profile Sheet.
 * 3. Event chronicle has dedicated internal vertical scroll on tablet/desktop.
 *    With 15 age-ups, chronicle scrolls internally while character card and Age Up
 *    remain pinned and reachable on-screen without window scrolling.
 * 4. Desktop (1440px) fills available width with 3 regions (LeftSidebar, Chronicle, RightRail)
 *    with zero dead margin space.
 */

async function assertNoHorizontalScroll(page: Page, contextName: string): Promise<void> {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    const maxScrollWidth = Math.max(doc.scrollWidth, body.scrollWidth);
    const clientWidth = doc.clientWidth;
    return {
      hasOverflow: maxScrollWidth > clientWidth + 1,
      scrollWidth: maxScrollWidth,
      clientWidth,
    };
  });
  expect(
    overflow.hasOverflow,
    `Horizontal scroll detected in ${contextName}: scrollWidth (${overflow.scrollWidth}px) > clientWidth (${overflow.clientWidth}px)`,
  ).toBe(false);
}

test.describe('Gate 8 — Responsive Layout Overhaul', () => {
  test('Mobile (375px): 1-column layout, sticky anchors, no sidebar/rail, zero overflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // 1. Landing state
    await expect(page.getByTestId('new-game')).toBeVisible();
    await assertNoHorizontalScroll(page, 'Mobile Landing');

    // 2. Start game -> Active Hub
    await page.getByTestId('new-game').click();
    await expect(page.getByTestId('character-summary')).toBeVisible();
    await expect(page.getByTestId('age-up')).toBeVisible();

    // Mobile specific: StickyHeader and ControlDeck are mounted; LeftSidebar and RightRail are NOT
    await expect(page.locator('footer')).toBeVisible();
    expect(await page.locator('aside[aria-label="Character and controls"]').count()).toBe(0);
    expect(await page.locator('aside[aria-label="Secondary stats and lineage"]').count()).toBe(0);

    await assertNoHorizontalScroll(page, 'Mobile Hub');

    // Capture required screenshot
    await page.screenshot({ path: 'test-results/responsive/mobile-375px.png', fullPage: false });
  });

  test('Tablet (900px): 2-column layout, LeftSidebar + internal scroll, no right rail', async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 800 });
    await page.goto('/');

    // 1. Landing state
    await expect(page.getByTestId('new-game')).toBeVisible();
    await assertNoHorizontalScroll(page, 'Tablet Landing');

    // 2. Start game -> Active Hub
    await page.getByTestId('new-game').click();
    await expect(page.getByTestId('character-summary')).toBeVisible();
    await expect(page.getByTestId('age-up')).toBeVisible();

    // Tablet specific: LeftSidebar mounted, RightRail NOT mounted, ControlDeck footer NOT mounted
    await expect(page.locator('aside[aria-label="চরিত্র আর নিয়ন্ত্রণ"]')).toBeVisible();
    expect(await page.locator('aside[aria-label="বাকি পরিসংখ্যান আর বংশ-পরম্পরা"]').count()).toBe(0);
    expect(await page.locator('footer').count()).toBe(0);

    // Main Chronicle container is mounted with internal scroll
    await expect(page.locator('#chronicle-scroll')).toBeVisible();

    await assertNoHorizontalScroll(page, 'Tablet Hub');

    // Capture required screenshot
    await page.screenshot({ path: 'test-results/responsive/tablet-900px.png', fullPage: false });
  });

  test('Desktop (1440px): 3-region layout (LeftSidebar : Chronicle : RightRail), zero dead space', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    // 1. Landing state
    await expect(page.getByTestId('new-game')).toBeVisible();
    await assertNoHorizontalScroll(page, 'Desktop Landing');

    // 2. Start game -> Active Hub
    await page.getByTestId('new-game').click();
    await expect(page.getByTestId('character-summary')).toBeVisible();
    await expect(page.getByTestId('age-up')).toBeVisible();

    // Desktop specific: 3 regions all present simultaneously
    const leftSidebar = page.locator('aside[aria-label="চরিত্র আর নিয়ন্ত্রণ"]');
    const mainChronicle = page.locator('#chronicle-scroll');
    const rightRail = page.locator('aside[aria-label="বাকি পরিসংখ্যান আর বংশ-পরম্পরা"]');

    await expect(leftSidebar).toBeVisible();
    await expect(mainChronicle).toBeVisible();
    await expect(rightRail).toBeVisible();

    // No mobile header/footer
    expect(await page.locator('footer').count()).toBe(0);

    // Geometry verification: Left region is on the left, right region is on the right, center is between
    const leftBox = (await leftSidebar.boundingBox())!;
    const centerBox = (await mainChronicle.boundingBox())!;
    const rightBox = (await rightRail.boundingBox())!;

    expect(leftBox.x).toBeLessThan(centerBox.x);
    expect(centerBox.x).toBeLessThan(rightBox.x);
    expect(centerBox.width).toBeGreaterThan(leftBox.width); // Center log is widest dominant element
    expect(rightBox.width).toBeGreaterThan(200); // Right rail filled, no dead margins
    expect(rightBox.x + rightBox.width).toBeGreaterThan(1300); // Spans full bleed to the right

    await assertNoHorizontalScroll(page, 'Desktop Hub');

    // Capture required screenshot
    await page.screenshot({ path: 'test-results/responsive/desktop-1440px.png', fullPage: false });
  });

  test('15 Age-Up endurance test: Chronicle scrolls internally; LeftSidebar remains pinned on screen', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await page.getByTestId('new-game').click();
    await expect(page.getByTestId('age-up')).toBeVisible();

    // Age up 15 times to build real chronicle history
    for (let i = 0; i < 15; i++) {
      await resolveAllEvents(page);
      if (await page.getByTestId('life-summary').isVisible().catch(() => false)) break;
      await page.getByTestId('age-up').click();
    }
    await resolveAllEvents(page);

    // Assert internal chronicle scroll container has grown and is scrollable
    const chronicleMetrics = await page.locator('#chronicle-scroll').evaluate((el) => ({
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
      scrollTop: el.scrollTop,
    }));

    expect(
      chronicleMetrics.scrollHeight,
      'Chronicle should have accumulated enough history to scroll',
    ).toBeGreaterThan(chronicleMetrics.clientHeight);

    // Window scroll remains 0 (the page itself did not scroll away!)
    const windowScrollY = await page.evaluate(() => window.scrollY);
    expect(windowScrollY).toBe(0);

    // Character Card & Age Up button remain fully visible within the viewport
    const ageUpRect = (await page.getByTestId('age-up').boundingBox())!;
    expect(ageUpRect.y).toBeGreaterThanOrEqual(0);
    expect(ageUpRect.y + ageUpRect.height).toBeLessThanOrEqual(800);

    const summaryRect = (await page.getByTestId('character-summary').boundingBox())!;
    expect(summaryRect.y).toBeGreaterThanOrEqual(0);
    expect(summaryRect.y + summaryRect.height).toBeLessThanOrEqual(800);
  });

  async function auditModalsAtViewport(page: Page, width: number, height: number, label: string): Promise<void> {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    await page.getByTestId('new-game').click();
    await expect(page.getByTestId('age-up')).toBeVisible();

    // 1. Life Actions Modal (ActiveMenu)
    await page.getByTestId('open-actions').first().click();
    await expect(page.getByTestId('active-menu')).toBeVisible();
    await assertNoHorizontalScroll(page, `${label} ActiveMenu`);
    await page.getByTestId('close-actions').click();
    await expect(page.getByTestId('active-menu')).toBeHidden();

    // 2. Family Tree Modal (FamilyTreeView)
    await page.getByTestId('open-family-tree').first().click();
    await expect(page.getByTestId('family-tree')).toBeVisible();
    await assertNoHorizontalScroll(page, `${label} FamilyTreeView`);
    await page.getByTestId('family-tree-close').click();
    await expect(page.getByTestId('family-tree')).toBeHidden();

    // 3. Settings Panel (SettingsPanel)
    await page.getByTestId('open-settings').first().click();
    await expect(page.getByTestId('settings-panel')).toBeVisible();
    await assertNoHorizontalScroll(page, `${label} SettingsPanel`);
    await page.getByTestId('settings-backdrop').click({ position: { x: 10, y: 10 } });
    await expect(page.getByTestId('settings-panel')).toBeHidden();

    // 4. Full Profile Modal (ProfileSheet)
    await page.getByTestId('deck-tab-profile').first().click();
    await expect(page.getByTestId('profile-sheet')).toBeVisible();
    await assertNoHorizontalScroll(page, `${label} ProfileSheet`);
    await page.getByTestId('close-profile').click();
    await expect(page.getByTestId('profile-sheet')).toBeHidden();
  }

  test('Zero horizontal scrollbar modal audit: Mobile (375px)', async ({ page }) => {
    await auditModalsAtViewport(page, 375, 667, 'Mobile 375px');
  });

  test('Zero horizontal scrollbar modal audit: Tablet (900px)', async ({ page }) => {
    await auditModalsAtViewport(page, 900, 800, 'Tablet 900px');
  });

  test('Zero horizontal scrollbar modal audit: Desktop (1440px)', async ({ page }) => {
    await auditModalsAtViewport(page, 1440, 900, 'Desktop 1440px');
  });
});
