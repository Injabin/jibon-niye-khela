import { expect, test } from '@playwright/test';
import { startNewLife } from './helpers';

/**
 * Gate 4 / M4 #3 — family tree graph:
 *  - opens from the hub with all five household nodes (three generations)
 *  - tapping a node opens the relationship panel and a once-per-year bond spend
 *  - the raised bond survives a full page reload (persisted, schema v2)
 *  - reduced motion strips the floating animation (static graph)
 */

async function openTree(page: Parameters<typeof startNewLife>[0]) {
  await page.getByTestId('open-family-tree').click();
  await expect(page.getByTestId('family-tree')).toBeVisible();
}

test.describe('family tree (Gate 4)', () => {
  test('opens from the hub and shows the full three-generation household', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('/');
    await startNewLife(page);
    await openTree(page);

    await expect(page.getByTestId('tree-node-self')).toBeVisible();
    await expect(page.getByTestId('tree-node-mother')).toBeVisible();
    await expect(page.getByTestId('tree-node-father')).toBeVisible();
    await expect(page.getByTestId('tree-node-grandparent')).toHaveCount(2);

    await page.getByTestId('family-tree-close').click();
    await expect(page.getByTestId('family-tree')).not.toBeAttached();
  });

  test('tapping a node opens the panel and spends bond once per year', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('/');
    await startNewLife(page);
    await openTree(page);

    await page.getByTestId('tree-node-mother').click();
    await expect(page.getByTestId('tree-panel')).toBeVisible();
    await expect(page.getByTestId('tree-relation')).toContainText('Mother');

    const before = Number(await page.getByTestId('tree-bond-value').textContent());
    await page.getByTestId('tree-spend-time').click();

    const after = Number(await page.getByTestId('tree-bond-value').textContent());
    expect(after).toBe(before + 8);

    // Refused the same year: the button is disabled and says so.
    await expect(page.getByTestId('tree-spend-time')).toBeDisabled();
    await expect(page.getByTestId('tree-spend-time')).toContainText('Spent time this year');
  });

  test('the raised bond persists across a full reload', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('/');
    await startNewLife(page);
    await openTree(page);

    await page.getByTestId('tree-node-mother').click();
    const before = Number(await page.getByTestId('tree-bond-value').textContent());
    await page.getByTestId('tree-spend-time').click();
    await expect(page.getByTestId('tree-bond-value')).toHaveText(String(before + 8));

    await page.reload();
    await expect(page.getByTestId('open-family-tree')).toBeVisible();
    await openTree(page);
    await page.getByTestId('tree-node-mother').click();
    await expect(page.getByTestId('tree-bond-value')).toHaveText(String(before + 8));
  });

  test('reduced motion swaps the graph to the static variant', async ({ page }) => {
    test.setTimeout(60_000);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await startNewLife(page);
    await openTree(page);

    await expect(page.getByTestId('family-tree')).toHaveAttribute('data-motion', 'static');
    await expect(page.getByTestId('tree-node-self')).toBeVisible();
  });
});