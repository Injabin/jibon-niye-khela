import { expect, test } from '@playwright/test';
import { readFile, readdir, unlink } from 'node:fs/promises';
import path from 'node:path';
import { resolveAllEvents, startNewLife } from './helpers';

/**
 * Gate 7 (TESTING.md / Additional_plus_improved_plan Phase 7) — Emotional Audio:
 *  - exactly two BGM tracks, crossfaded at the 18th birthday (no per-stage rotation)
 *  - per-tone feedback cues (good/bad/funny/neutral) fire through the real UI path
 *  - the birth cue fires on a brand-new life, the somber death cue exactly once
 *  - muted SFX and music stay silent end-to-end
 *  - CREDITS.md accounts for every new asset/cue with a real source + license
 */
test.use({ trace: 'on' });

const EARLY_FILE = '/audio/lofi.ogg';
const LATE_FILE = '/audio/ambient.ogg';

interface ProbeSnapshot {
  contextStarted: boolean;
  everPlayed: boolean;
  muted: boolean;
  activeArc: 'early' | 'late' | null;
  sfxPlays: readonly string[];
  musicPlays: readonly string[];
}

async function audioSnapshot(page: import('@playwright/test').Page): Promise<ProbeSnapshot> {
  return page.evaluate(() => {
    const probe = window.__JNK_AUDIO__;
    if (!probe) return { contextStarted: false, everPlayed: false, muted: true, activeArc: null, sfxPlays: [], musicPlays: [] };
    return probe.snapshot();
  });
}

type Tone = 'good' | 'bad' | 'funny' | 'neutral';
const TONE_CUE: Record<Tone, string> = {
  good: 'good_event',
  bad: 'bad_event',
  funny: 'funny_event',
  neutral: 'neutral_event',
};

/** A minimal but fully valid event def used to force a given tone through the
 * real EventCard → gameStore → GameHub.onChoose → playCue path. */
function probeEvent(tone: Tone) {
  return {
    id: `probe-${tone}`,
    text: `Probe ${tone} outcome`,
    minAge: 0,
    maxAge: 120,
    weight: 1,
    category: 'universal' as const,
    tone,
    choices: [
      {
        id: 'proceed',
        text: 'Continue',
        effects: {},
        outcomeText: 'It was just a calibration run.',
        tone,
      },
    ],
  };
}

/** Minimal shape of an exported save as the mutation target needs it. */
interface SaveMutationTarget {
  schemaVersion: number;
  seed: number;
  character: unknown;
  pendingEvents: unknown[];
  currentEventIndex: number;
  familyTree: unknown;
}

/** Export the current save, apply a mutation, and import the result. */
async function exportAndImport(page: import('@playwright/test').Page, mutate: (save: SaveMutationTarget) => void) {
  const downloadPromise = page.waitForEvent('download');
  await page.getByTestId('export-save').click();
  const download = await downloadPromise;
  const tmp = `downloads-audio-${Date.now()}-${Math.random().toString(36).slice(2)}.json`;
  await download.saveAs(tmp);
  const save: SaveMutationTarget = JSON.parse(await readFile(tmp, 'utf8'));
  mutate(save);
  await page.getByTestId('import-save').setInputFiles({
    name: 'save.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(save)),
  });
  await unlink(tmp).catch(() => {});
  await page.waitForTimeout(250);
  return save;
}

test.describe('Gate 7 audio assets', () => {
  test('exactly two in-manifest tracks exist on disk, retired tracks unreferenced', async () => {
    const root = process.cwd();
    const manifest = await readFile(path.join(root, 'lib/audio/manifest.ts'), 'utf8');
    const referenced = Array.from(manifest.matchAll(/\/audio\/([A-Za-z0-9_.-]+\.ogg)/g)).map((m) => m[1]);

    // Exactly the two Phase 7 arcs — nothing else may be in the manifest.
    const ogg = referenced.filter((f) => f.endsWith('.ogg'));
    expect([...new Set(ogg)].sort()).toEqual([EARLY_FILE.split('/').pop(), LATE_FILE.split('/').pop()].sort());

    // The retired per-stage files must not be referenced anywhere in audio/game code.
    for (const file of ['lib/audio/SoundManager.ts', 'components/game/GameHub.tsx']) {
      const src = await readFile(path.join(root, file), 'utf8');
      for (const retired of ['heavenly.ogg', 'jump.ogg', 'fastsong.ogg']) {
        expect(src, `${file} still references ${retired}`).not.toContain(retired);
      }
    }

    // Both active files exist on disk (spot-checking CREDITS entries vs. disk).
    const disk = await readdir(path.join(root, 'public/audio'));
    expect(disk).toContain('lofi.ogg');
    expect(disk).toContain('ambient.ogg');

    // CREDITS accounts for every bundled track + each Phase 7 synthesized cue
    // with a real source/license. No unlicensed or BitLife-derived material.
    const credits = await readFile(path.join(root, 'public/audio/CREDITS.md'), 'utf8');
    for (const cue of ['birth', 'good_event', 'bad_event', 'funny_event', 'death']) {
      expect(credits).toContain(cue);
    }
    expect(credits).toContain('lofi.ogg');
    expect(credits).toContain('ambient.ogg');
    expect(credits).toContain('CC0');
    expect(credits).not.toContain('BitLife');
  });
});

test.describe('Gate 7 birth + arc crossfade', () => {
  test('a new life births with a cue under the early arc, then crossfades to late at 18', async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto('/');
    await startNewLife(page);

    // Birth cue + early arc from the very first game snapshot.
    const birth = await audioSnapshot(page);
    expect(birth.sfxPlays).toContain('birth');
    expect(birth.activeArc).toBe('early');
    expect(birth.musicPlays).toContain(EARLY_FILE);

    // Age up with events drained until we cross the 18th birthday.
    const readAge = async () => {
      const text = await page.getByTestId('character-summary').textContent();
      return Number(text?.match(/(\d+) years old/)?.[1] ?? -1);
    };
    let age = await readAge();
    for (let i = 0; i < 60 && age < 18; i += 1) {
      if (await page.getByTestId('life-summary').isVisible().catch(() => false)) break;
      await resolveAllEvents(page);
      await page.getByTestId('age-up').click();
      await resolveAllEvents(page);
      age = await readAge();
    }
    expect(age, 'character died before the 18th-birthday arc switch').toBeGreaterThanOrEqual(18);

    // The switch lands on the late arc, in order, with no replayed early track.
    await expect
      .poll(async () => (await audioSnapshot(page)).activeArc)
      .toBe('late');
    const after = await audioSnapshot(page);
    expect(after.musicPlays).toEqual([EARLY_FILE, LATE_FILE]);
  });
});

test.describe('Gate 7 per-tone feedback cues', () => {
  for (const tone of ['good', 'bad', 'funny'] as const) {
    test(`${tone} outcomes play their own cue through the real choice path`, async ({ page }) => {
      await page.goto('/');
      await startNewLife(page);
      await expect(page.getByTestId('character-summary')).toBeVisible();

      // Force the tone: import a save whose single pending event is a probe of
      // exactly this tone, then click the real choice button.
      await exportAndImport(page, (save) => {
        save.pendingEvents = [probeEvent(tone)];
        save.currentEventIndex = 0;
      });

      await expect(page.getByTestId('event-card')).toBeVisible();
      await expect(page.getByTestId(`choice-0`)).toBeVisible();
      await page.getByTestId('choice-0').click();

      await expect
        .poll(async () => {
          const snap = await audioSnapshot(page);
          return snap.sfxPlays[snap.sfxPlays.length - 1];
        })
        .toBe(TONE_CUE[tone]);
    });
  }

  test('mid-life imports (resume-from-save) stay silent — no spurious cue', async ({ page }) => {
    await page.goto('/');
    await startNewLife(page);
    await expect(page.getByTestId('character-summary')).toBeVisible();

    await exportAndImport(page, (save) => {
      save.pendingEvents = [probeEvent('neutral')];
      save.currentEventIndex = 0;
    });
    await expect(page.getByTestId('event-card')).toBeVisible();

    const before = await audioSnapshot(page);
    // No cue is raised for the import itself; only a click would.
    await page.waitForTimeout(400);
    const after = await audioSnapshot(page);
    expect(after.sfxPlays).toEqual(before.sfxPlays);
  });
});

test.describe('Gate 7 death cue', () => {
  test('the somber death cue fires exactly once at the end of life', async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto('/');
    await startNewLife(page);

    for (let i = 0; i < 400; i += 1) {
      if (await page.getByTestId('life-summary').isVisible().catch(() => false)) break;
      await resolveAllEvents(page);
      if (await page.getByTestId('life-summary').isVisible().catch(() => false)) break;
      await page.getByTestId('age-up').click();
      await resolveAllEvents(page);
    }
    await expect(page.getByTestId('life-summary')).toBeVisible();

    const snap = await audioSnapshot(page);
    const deaths = snap.sfxPlays.filter((cue) => cue === 'death');
    expect(deaths, `expected exactly one death cue, saw ${deaths.length}`).toHaveLength(1);
  });
});

test.describe('Gate 7 mute blanket', () => {
  test('muted SFX and music both stay silent through the real Settings panel', async ({ page }) => {
    await page.goto('/');
    await startNewLife(page);
    await expect(page.getByTestId('character-summary')).toBeVisible();

    await page.getByTestId('open-settings').click();
    await expect(page.getByTestId('settings-panel')).toBeVisible();

    // SFX off (same label hit-target a user clicks, cf. Gate 3 motion spec).
    await page
      .getByTestId('settings-sfx-toggle')
      .evaluate((el) => (el.closest('label') as HTMLElement).click());
    // Music off.
    await page
      .getByTestId('settings-music-toggle')
      .evaluate((el) => (el.closest('label') as HTMLElement).click());
    await expect.poll(async () => (await audioSnapshot(page)).muted).toBe(true);
    await expect.poll(async () => (await audioSnapshot(page)).activeArc).toBeNull();
    await page.getByTestId('close-settings').click();

    const snapBefore = await audioSnapshot(page);
    const musicBefore = snapBefore.musicPlays;

    // A good outcome would normally cue; with SFX muted it must not.
    await exportAndImport(page, (save) => {
      save.pendingEvents = [probeEvent('good')];
      save.currentEventIndex = 0;
    });
    await expect(page.getByTestId('event-card')).toBeVisible();
    await page.getByTestId('choice-0').click();
    await page.waitForTimeout(400);

    const snapAfter = await audioSnapshot(page);
    expect(snapAfter.sfxPlays).toEqual(snapBefore.sfxPlays);
    expect(snapAfter.musicPlays).toEqual(musicBefore);
    expect(snapAfter.activeArc).toBeNull();
  });
});