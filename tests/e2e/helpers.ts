import { expect, type Page } from '@playwright/test';

/** Read the character's displayed state used to compare across reloads. */
export async function readDisplayedState(page: Page) {
  const summary = await page.getByTestId('character-summary').locator('h2').textContent();
  const ageText = await page.getByTestId('character-summary').textContent();
  const moneyText = await page.getByTestId('money').textContent();

  const ageMatch = ageText?.match(/(\d+) years old/);
  const health = await page.getByRole('progressbar', { name: 'Health' }).getAttribute('aria-valuenow');
  const happiness = await page
    .getByRole('progressbar', { name: 'Happiness' })
    .getAttribute('aria-valuenow');
  const smarts = await page.getByRole('progressbar', { name: 'Smarts' }).getAttribute('aria-valuenow');
  const looks = await page.getByRole('progressbar', { name: 'Looks' }).getAttribute('aria-valuenow');

  return {
    name: summary?.trim() ?? '',
    age: ageMatch ? Number(ageMatch[1]) : null,
    money: moneyText?.trim() ?? '',
    stats: { health, happiness, smarts, looks },
  };
}

/** Start a fresh life (automatically waits for hydration + new-game button). */
export async function startNewLife(page: Page): Promise<void> {
  await page.getByTestId('new-game').click();
}

/** Click choice buttons until the event card disappears. */
export async function resolveAllEvents(page: Page): Promise<void> {
  for (let i = 0; i < 5; i++) {
    const card = page.getByTestId('event-card');
    if (!(await card.isVisible().catch(() => false))) return;
    await page.getByTestId('choice-0').first().click();
  }
}

/** Age up repeatedly, resolving any events, until the life summary appears. */
export async function playUntilDeath(page: Page, maxYears = 400): Promise<void> {
  for (let i = 0; i < maxYears; i++) {
    if (await page.getByTestId('life-summary').isVisible().catch(() => false)) return;
    await page.getByTestId('age-up').click();
    await resolveAllEvents(page);
  }
  await expect(page.getByTestId('life-summary')).toBeVisible();
}