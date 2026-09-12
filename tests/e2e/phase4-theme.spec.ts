import { expect, test } from '@playwright/test';

async function solidSrgb(page: import('@playwright/test').Page, color: string): Promise<{ r: number; g: number; b: number }> {
  return page.evaluate((input) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 1, 1);
    ctx.fillStyle = input;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    return { r, g, b };
  }, color);
}

function luminance({ r, g, b }: { r: number; g: number; b: number }): number {
  const channel = (value: number) => {
    const c = value / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrastRatio(a: { r: number; g: number; b: number }, b: { r: number; g: number; b: number }): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Composite a possibly-translucent surface color over the page background. */
async function effectiveBackground(
  page: import('@playwright/test').Page,
  surfaceColor: string,
  pageColor: string,
): Promise<{ r: number; g: number; b: number }> {
  return page.evaluate(
    ({ surface, behind }) => {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = behind;
      ctx.fillRect(0, 0, 1, 1);
      ctx.fillStyle = surface;
      ctx.fillRect(0, 0, 1, 1);
      const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
      return { r, g, b };
    },
    { surface: surfaceColor, behind: pageColor },
  );
}

async function readPalette(page: import('@playwright/test').Page) {
  const raw = await page.getByTestId('character-summary').evaluate((element) => {
    const summary = getComputedStyle(element);
    const heading = getComputedStyle(element.querySelector('h2')!);
    return {
      surface: summary.backgroundColor,
      headingColor: heading.color,
    };
  });
  const pageColor = await page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor);
  const background = await effectiveBackground(page, raw.surface, pageColor);
  const foreground = await solidSrgb(page, raw.headingColor);
  return { background, foreground };
}

test('Phase 4 cozy palette meets contrast and avatar size evidence', async ({ page }) => {
  await page.goto('/play?start=1');
  await expect(page.getByTestId('character-summary')).toBeVisible();

  const { background, foreground } = await readPalette(page);
  const ratio = contrastRatio(foreground, background);
  console.log(`Phase 4 character summary contrast ratio: ${ratio.toFixed(2)}:1`);
  expect(ratio).toBeGreaterThanOrEqual(4.5);

  await page.screenshot({ path: 'test-results/phase4-dashboard-full.png', fullPage: true });
  await page.getByTestId('character-summary').getByTestId('avatar').screenshot({
    path: 'test-results/phase4-avatar-toolbar.png',
  });
  await page.getByTestId('deck-tab-profile').click();
  await expect(page.getByTestId('profile-sheet')).toBeVisible();
  await page.getByTestId('profile-sheet').getByTestId('avatar').screenshot({
    path: 'test-results/phase4-avatar-full.png',
  });
});

test('dark mode toggles real theme tokens and keeps contrast', async ({ page }) => {
  await page.goto('/play?start=1');
  await expect(page.getByTestId('character-summary')).toBeVisible();

  const light = await readPalette(page);

  await page.getByTestId('open-settings').click();
  await expect(page.getByTestId('settings-panel')).toBeVisible();
  await page.getByTestId('settings-theme-dark').click();
  await expect(page.getByTestId('settings-theme-dark')).toBeChecked();
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('settings-panel')).toBeHidden();

  const dark = await readPalette(page);
  const darkRatio = contrastRatio(dark.foreground, dark.background);
  console.log(`Dark mode character summary contrast ratio: ${darkRatio.toFixed(2)}:1`);
  expect(dark.background).not.toEqual(light.background);
  expect(luminance(dark.background)).toBeLessThan(luminance(light.background));
  expect(darkRatio).toBeGreaterThanOrEqual(4.5);

  await page.screenshot({ path: 'test-results/phase4-dashboard-full-dark.png', fullPage: true });
  await page.getByTestId('character-summary').getByTestId('avatar').screenshot({
    path: 'test-results/phase4-avatar-toolbar-dark.png',
  });
  await page.getByTestId('deck-tab-profile').click();
  await expect(page.getByTestId('profile-sheet')).toBeVisible();
  await page.getByTestId('profile-sheet').getByTestId('avatar').screenshot({
    path: 'test-results/phase4-avatar-full-dark.png',
  });
});