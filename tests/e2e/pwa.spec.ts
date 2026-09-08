import { expect, test } from '@playwright/test';

/**
 * init.md M6 #3 / TESTING.md Gate 6 — PWA offline check: the manifest is a
 * real installable web app, and a page visited once stays playable after the
 * network is dropped (service-worker shell + cached chunks, state in
 * localStorage/IndexedDB).
 */
test.describe('PWA / offline (M6 #3)', () => {
  test('serves a valid installable web manifest', async ({ request }) => {
    const res = await request.get('/manifest.webmanifest');
    expect(res.ok()).toBe(true);
    const manifest = await res.json();
    expect(manifest.name).toContain('Jibon Niye Khela');
    expect(manifest.display).toBe('standalone');
    expect(manifest.start_url).toBe('/');
    expect(
      manifest.icons.some(
        (icon: { sizes?: string; purpose?: string }) => icon.sizes === '512x512' && icon.purpose === 'maskable',
      ),
    ).toBe(true);
  });

  test('serves the icons referenced by the manifest', async ({ request }) => {
    for (const src of [
      '/icons/icon-192.png',
      '/icons/icon-512.png',
      '/icons/icon-maskable-512.png',
    ]) {
      const res = await request.get(src);
      expect(res.ok()).toBe(true);
      expect(res.headers()['content-type']).toContain('image/png');
    }
  });

  test('registers the offline service worker', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('new-game')).toBeVisible();
    await page.evaluate(() =>
      navigator.serviceWorker.ready.then((registration) => {
        if (!registration.active) throw new Error('no active service worker');
      }),
    );
    const script = await page.evaluate(() =>
      navigator.serviceWorker.getRegistrations().then((registrations) =>
        registrations.map((r) => r.active?.scriptURL).filter(Boolean),
      ),
    );
    expect(script.join(',').endsWith('/sw.js')).toBe(true);
  });

  test('app remains playable offline once visited', async ({ page, context }) => {
    await page.goto('/');
    await expect(page.getByTestId('new-game')).toBeVisible();

    // Let the SW activate and claim the page, then navigate once more while
    // online so the shell + chunks are actually in the cache.
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null, undefined, {
      timeout: 15_000,
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('new-game')).toBeVisible();

    await context.setOffline(true);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('new-game')).toBeVisible({ timeout: 20_000 });
  });
});