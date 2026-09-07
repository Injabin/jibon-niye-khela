import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { resolveAllEvents, startNewLife } from './helpers';

test.describe('export/import save round-trip (Gate 2)', () => {
  test('export, wipe storage, import the file, and the character matches', async ({ page }) => {
    await page.goto('/');
    await startNewLife(page);

    // Build some mid-life progress.
    for (let i = 0; i < 4; i++) {
      await page.getByTestId('age-up').click();
      await resolveAllEvents(page);
    }
    const preExport = await readStateSummary(page);

    // Export: capture the download.
    const downloadPromise = page.waitForEvent('download');
    await page.getByTestId('export-save').click();
    const download = await downloadPromise;
    const savePath = `downloads-${Date.now()}.json`;
    await download.saveAs(savePath);
    const savedJson = await readFile(savePath, 'utf8');
    expect(savedJson.length).toBeGreaterThan(0);

    // Wipe storage and reload -> back to the fresh "new life" screen.
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await expect(page.getByTestId('new-game')).toBeVisible();

    // Import the exported file.
    const fileInput = page.getByTestId('import-save');
    await fileInput.setInputFiles({ name: 'save.json', mimeType: 'application/json', buffer: Buffer.from(savedJson) });

    await expect(page.getByTestId('character-summary')).toBeVisible();
    const postImport = await readStateSummary(page);

    expect(postImport.name).toBe(preExport.name);
    expect(postImport.age).toBe(preExport.age);
    expect(postImport.money).toBe(preExport.money);
    expect(postImport.stats).toEqual(preExport.stats);
  });

  test('a corrupt import is rejected without crashing the app', async ({ page }) => {
    await page.goto('/');
    await startNewLife(page);

    const fileInput = page.getByTestId('import-save');
    await fileInput.setInputFiles({
      name: 'corrupt.json',
      mimeType: 'application/json',
      buffer: Buffer.from('this is not a save file'),
    });

    // An error banner appears and the current life is not destroyed.
    await expect(page.getByTestId('error')).toBeVisible();
    await expect(page.getByTestId('error')).toContainText(/json|valid|could not|cannot|invalid|unsupported|corrupted/i);
    await expect(page.getByTestId('character-summary')).toBeVisible();
  });
});

async function readStateSummary(page: import('@playwright/test').Page) {
  const name = (await page.getByTestId('character-summary').locator('h2').textContent())?.trim() ?? '';
  const summaryText = await page.getByTestId('character-summary').textContent();
  const ageMatch = summaryText?.match(/(\d+) years old/);
  const money = (await page.getByTestId('money').textContent())?.trim() ?? '';
  const health = await page.getByRole('progressbar', { name: 'Health' }).getAttribute('aria-valuenow');
  const happiness = await page
    .getByRole('progressbar', { name: 'Happiness' })
    .getAttribute('aria-valuenow');
  const smarts = await page.getByRole('progressbar', { name: 'Smarts' }).getAttribute('aria-valuenow');
  const looks = await page.getByRole('progressbar', { name: 'Looks' }).getAttribute('aria-valuenow');

  return {
    name,
    age: ageMatch ? Number(ageMatch[1]) : null,
    money,
    stats: { health, happiness, smarts, looks },
  };
}