import { expect, test, type Page } from '@playwright/test';
import { resolveAllEvents, startNewLife } from './helpers';

/**
 * Gate 5 (TESTING.md — Career/education/relationship/crime/asset/health
 * systems each have a Playwright test exercising their core interaction, plus
 * achievements ≥3 recorded and persisted).
 *
 * Relationship is covered by `family-tree.spec.ts` (spend-time bond +8 via the
 * real UI, once-per-year refusal, persistence across reload).
 *
 * The specs fabricate a young-adult through the store's official exported
 * hook (same pattern as core-loop/motion specs) so the menus are reachable
 * without aging through 18 years per test, then drive the real UI. Where an
 * action rolls randomness, the stored RNG state is pinned to one that yields
 * a near-zero draw, making hire/arrest deterministic.
 */

function mulberryNext(state: number): number {
  const st = (state + 0x6d2b79f5) >>> 0;
  let t = st;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function findLowState(target: number): number {
  for (let state = 1; state < 5_000_000; state++) {
    if (mulberryNext(state) < target) return state >>> 0;
  }
  throw new Error('no low-RNG state found');
}

const LOW_STATE = findLowState(0.02);

interface CharacterSnapshot {
  age: number;
  alive: boolean;
  money: number;
  stats: { health: number; happiness: number; smarts: number; looks: number };
  education: { stage: string; enrolled: boolean; gpa: number; major: string; graduated: boolean };
  career: { jobId: string | null; performance: number; yearsAtJob: number };
  assets: Array<{ id: string; kind: string; name: string; value: number; acquiredAge: number }>;
  criminalRecord: Array<{ offense: string; age: number; sentenceYears: number; served: boolean }>;
  flags: string[];
  reputation: { fame: number; karma: number };
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

async function patchRngState(page: Page, state: number): Promise<void> {
  await page.evaluate((s) => {
    (window as unknown as { __JNK_GAME_STORE__: { setState: (patch: { rngState: number }) => void } })
      .__JNK_GAME_STORE__
      .setState({ rngState: s });
  }, state);
}

function adultPatch(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    age: 22,
    alive: true,
    stats: { health: 60, happiness: 70, smarts: 70, looks: 60 },
    money: 60_000,
    education: { stage: 'high', enrolled: false, gpa: 3.1, major: '', graduated: false },
    career: { jobId: null, performance: 50, yearsAtJob: 0 },
    assets: [],
    criminalRecord: [],
    flags: [],
    reputation: { fame: 0, karma: 60 },
    history: [],
    statHistory: [],
    ...overrides,
  };
}

async function prepareAdult(page: Page, overrides: Record<string, unknown> = {}) {
  await page.goto('/');
  await startNewLife(page);
  await patchCharacter(page, adultPatch(overrides));
}

async function openTabs(page: Page, tab: 'school' | 'career' | 'assets' | 'crime' | 'health') {
  await page.getByTestId('open-actions').click();
  await expect(page.getByTestId('active-menu')).toBeVisible();
  await page.getByTestId(`actions-tab-${tab}`).click();
}

async function closeActions(page: Page) {
  await page.getByTestId('close-actions').click();
  await expect(page.getByTestId('active-menu')).not.toBeAttached();
}

test.describe('system core interactions (Gate 5)', () => {
  test('education: enrolling in a vocational program sets state and costs tuition', async ({ page }) => {
    await prepareAdult(page);
    await openTabs(page, 'school');

    await page.getByTestId('enroll-vocational').click();

    await expect.poll(async () => (await readCharacter(page)).education.stage).toBe('vocational');

    const character = await readCharacter(page);
    expect(character.education.enrolled).toBe(true);
    expect(character.flags).toContain('student');
    expect(character.money).toBe(60_000 - 250);
  });

  test('career: a warehouse job is hired, pays salary on the next age-up, and can be quit', async ({ page }) => {
    await prepareAdult(page);
    // Pin the RNG to a near-zero draw so the hire roll succeeds every time.
    await patchRngState(page, LOW_STATE);

    await openTabs(page, 'career');
    await expect(page.getByTestId('job-warehouse')).toBeVisible();
    await page.getByTestId('job-warehouse').click();

    await expect.poll(async () => (await readCharacter(page)).career.jobId).toBe('warehouse');

    await closeActions(page);

    await page.getByTestId('age-up').click();
    await expect.poll(async () => (await readCharacter(page)).career.yearsAtJob).toBe(1);

    // Salary is deterministic (no pending choices have applied event effects yet):
    // warehouse mid (380+700)/2 = 540 × (0.5 + 55/100) = 567.
    expect((await readCharacter(page)).money).toBe(60_000 + 567);

    // The job is still held and can be quit from the menu. Menu actions are
    // refused while a choice is pending, so drain the year's events first.
    await resolveAllEvents(page);
    await openTabs(page, 'career');
    await expect(page.getByTestId('quit-job')).toBeVisible();
    await page.getByTestId('quit-job').click();
    await expect.poll(async () => (await readCharacter(page)).career.jobId).toBeNull();
  });

  test('assets: buy a car, see it depreciate on the yearly tick, then sell it', async ({ page }) => {
    await prepareAdult(page);

    await openTabs(page, 'assets');
    await page.getByTestId('buy-car').click();

    const afterBuy = await readCharacter(page);
    expect(afterBuy.money).toBe(60_000 - 8_500);
    expect(afterBuy.flags).toContain('has_car');
    const car = afterBuy.assets.find((asset) => asset.kind === 'car');
    expect(car).toBeDefined();
    expect(car!.value).toBe(8_500);

    await closeActions(page);
    await page.getByTestId('age-up').click();

    // Cars only depreciate, so one yearly tick must lower its value. Drain the
    // year's events first — menu actions are refused while a choice is pending.
    await resolveAllEvents(page);
    const afterTick = await readCharacter(page);
    const depreciated = afterTick.assets.find((asset) => asset.id === car!.id);
    expect(depreciated).toBeDefined();
    expect(depreciated!.value).toBeLessThan(8_500);

    // Sell now: proceeds return, and the ownership flag retires with the last car.
    const moneyBeforeSell = afterTick.money;
    await openTabs(page, 'assets');
    await page.getByTestId(`sell-${car!.id}`).click();
    const afterSell = await readCharacter(page);
    expect(afterSell.money).toBe(moneyBeforeSell + depreciated!.value);
    expect(afterSell.flags).not.toContain('has_car');
    expect(afterSell.assets.find((asset) => asset.id === car!.id)).toBeUndefined();
  });

  test('crime: committing a burglary deterministically reaches the arrest branch', async ({ page }) => {
    await prepareAdult(page);
    // Pin the RNG so the arrest roll fails (next()<0.55) and the sentence roll
    // floors at 1 year — the arrest branch of commitCrime is fully exercised.
    await patchRngState(page, LOW_STATE);

    await openTabs(page, 'crime');
    await page.getByTestId('crime-burglary').click();

    const character = await readCharacter(page);
    expect(character.flags).toContain('in_jail');
    expect(character.flags).toContain('criminal_record');
    expect(character.criminalRecord.length).toBe(1);
    expect(character.criminalRecord[0].offense).toBe('burglary');
    expect(character.criminalRecord[0].served).toBe(false);
    expect(character.criminalRecord[0].sentenceYears).toBeGreaterThanOrEqual(1);
  });

  test('health: a doctor visit restores health and charges the standard fee', async ({ page }) => {
    await prepareAdult(page);

    await openTabs(page, 'health');
    await page.getByTestId('visit-doctor').click();

    const character = await readCharacter(page);
    expect(character.stats.health).toBe(75);
    expect(character.stats.happiness).toBe(75);
    expect(character.money).toBe(60_000 - 50);
  });
});

test.describe('achievements persist (Gate 5)', () => {
  test('≥3 ribbons are recorded and stored on death', async ({ page }) => {
    // A lived-and-done character: 129 → the forced age-up lands on 130, which
    // is past UPPER_AGE_BOUND and always kills, after which the game records
    // ribbons. Wealth, an undergraduate degree, a high GPA and a house earn
    // scholar, tycoon, straight_a, homeowner and long_life in one stroke.
    await prepareAdult(page, {
      age: 129,
      money: 250_000,
      flags: ['gpa_high', 'has_house'],
      education: { stage: 'undergraduate', enrolled: false, gpa: 3.9, major: 'stem', graduated: true },
      reputation: { fame: 0, karma: 60 },
    });

    await page.getByTestId('age-up').click();
    await expect(page.getByTestId('life-summary')).toBeVisible();

    const raw = await page.evaluate(() => localStorage.getItem('jibon-niye-khela/achievements'));
    expect(raw, 'achievements were persisted to localStorage').not.toBeNull();
    const persisted = JSON.parse(raw ?? '{}') as { unlocked: Record<string, unknown> };
    expect(Object.keys(persisted.unlocked).length).toBeGreaterThanOrEqual(3);
    expect(persisted.unlocked).toHaveProperty('long_life');
    expect(persisted.unlocked).toHaveProperty('scholar');
    expect(persisted.unlocked).toHaveProperty('tycoon');
  });
});