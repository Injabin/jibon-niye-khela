import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { startNewLife } from './helpers';

/**
 * M5 #3 (init.md) — Life Summary screen: timeline, stat-over-lifetime SVG
 * chart, this-life ribbons, and the canvas-rendered shareable image export.
 *
 * A finished elder is fabricated through the store's official exported hook
 * (same pattern as systems.spec/core-loop), aged once to its forced death,
 * then every section of the summary is asserted from the real UI — including
 * a real PNG download with a valid signature from the export button.
 */

interface CharacterSnapshot {
  age: number;
  alive: boolean;
  money: number;
}

async function readCharacter(page: Page): Promise<CharacterSnapshot> {
  return page.evaluate(() => {
    const store = (window as unknown as { __JNK_GAME_STORE__: { getState: () => { character: CharacterSnapshot } } })
      .__JNK_GAME_STORE__;
    return store.getState().character;
  });
}

async function patchCharacter(page: Page, patch: Record<string, unknown>): Promise<void> {
  await page.evaluate((p) => {
    const store = (window as unknown as {
      __JNK_GAME_STORE__: {
        getState: () => { character: Record<string, unknown> };
        setState: (patch: Record<string, unknown>) => void;
      };
    }).__JNK_GAME_STORE__;
    store.setState({ character: { ...store.getState().character, ...(p as Record<string, unknown>) } });
  }, patch);
}

const STAT_HISTORY = [
  { age: 1, health: 90, happiness: 80, smarts: 60, looks: 70 },
  { age: 22, health: 82, happiness: 74, smarts: 76, looks: 71 },
  { age: 45, health: 70, happiness: 85, smarts: 78, looks: 66 },
  { age: 75, health: 52, happiness: 62, smarts: 80, looks: 58 },
  { age: 100, health: 30, happiness: 48, smarts: 81, looks: 50 },
  { age: 120, health: 18, happiness: 42, smarts: 81, looks: 46 },
];

const HISTORY = [
  { age: 3, text: 'Crawled onto the kitchen table and declared it a throne.', tone: 'funny' as const },
  { age: 22, text: 'Graduated with honours and a leather-patched blazer.', tone: 'good' as const },
  { age: 60, text: 'Bought a house with a plaque on the door.', tone: 'good' as const },
];

function elderPatch(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    age: 129,
    alive: true,
    stats: { health: 20, happiness: 45, smarts: 82, looks: 50 },
    money: 250_000,
    education: { stage: 'undergraduate', enrolled: false, gpa: 3.9, major: 'stem', graduated: true },
    career: { jobId: 'military', performance: 70, yearsAtJob: 12 },
    assets: [],
    criminalRecord: [{ offense: 'grand_theft_auto', age: 28, sentenceYears: 2, served: true }],
    flags: ['gpa_high', 'has_house', 'has_child', 'job_military'],
    reputation: { fame: 92, karma: 70 },
    history: HISTORY,
    statHistory: STAT_HISTORY,
    ...overrides,
  };
}

test.describe('life summary (M5 #3)', () => {
  test('renders timeline, stat chart, ribbons, and exports a valid PNG', async ({ page }) => {
    await page.goto('/');
    await startNewLife(page);
    await patchCharacter(page, elderPatch());

    await page.getByTestId('age-up').click();
    await expect(page.getByTestId('life-summary')).toBeVisible();

    const character = await readCharacter(page);
    expect(character.age).toBe(130);
    expect(character.alive).toBe(false);

    // Story: cause of death and the timeline with our years in order.
    const summary = page.getByTestId('life-summary');
    await expect(summary).toContainText('lived for 130 years');
    await expect(summary).toContainText('Cause of death');

    const timeline = page.getByTestId('life-timeline');
    await expect(timeline).toContainText('declared it a throne');
    await expect(timeline).toContainText('Graduated with honours');
    await expect(timeline).toContainText('Bought a house');
    const entries = timeline.locator('li');
    expect(await entries.count()).toBeGreaterThanOrEqual(4);

    // Stat-over-lifetime chart: all four metrics plot inside the SVG.
    await expect(page.getByTestId('life-chart-section')).toBeVisible();
    const chart = page.getByTestId('life-chart');
    await expect(chart.locator('svg')).toBeVisible();
    for (const metric of ['health', 'happiness', 'smarts', 'looks'] as const) {
      await expect(page.getByTestId(`life-chart-line-${metric}`)).toHaveAttribute('points', /\d/);
      await expect(page.getByTestId(`life-chart-line-${metric}`)).toHaveAttribute('points', /\d,\d/);
    }

    // Ribbons: this life earned several; the chips render with their names.
    const ribbons = page.getByTestId('life-ribbons');
await expect(ribbons).toContainText('দীর্ঘায়ু বাবাজি');
await expect(ribbons).toContainText('টুপি-গাউন পরা পণ্ডিত');
await expect(ribbons).toContainText('ট্যাকা-পাগলা ধনকুবের');
await expect(ribbons).toContainText('মহল্লার চেনা-জানা নাম');
await expect(ribbons).toContainText('ঘুরে দাঁড়ানোর গল্প');

    // Export: a real canvas PNG downloads with a valid signature and size.
    const downloadPromise = page.waitForEvent('download');
    await page.getByTestId('export-summary-image').click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/^[^-]+-[^-]+-life\.png$/);
    const filePath = await download.path();
    const buffer = readFileSync(filePath!);
    expect(buffer.length).toBeGreaterThan(20_000);
    expect([...buffer.subarray(0, 4)]).toEqual([0x89, 0x50, 0x4e, 0x47]);
  });
});