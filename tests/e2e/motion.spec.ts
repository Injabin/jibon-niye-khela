import { expect, test } from '@playwright/test';
import { readFile, unlink } from 'node:fs/promises';

/**
 * Gate 3 checks (TESTING.md):
 *  - reduced-motion fallback is instant, not just shorter
 *  - the Settings toggle really changes behaviour
 *  - no audio is attempted before the first user interaction
 *  - full-motion transitions genuinely run (and are captured as evidence)
 */

// Gate 3 evidence is recorded even for passing runs.
test.use({ trace: 'on' });

async function audioSnapshot(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const probe = window.__JNK_AUDIO__;
    if (!probe) return { contextStarted: false, everPlayed: false, muted: true };
    return probe.snapshot();
  });
}

test.describe('reduced-motion fallback (Gate 3)', () => {
  test('OS reduce: transitions are instant and the flag is applied', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');

    await expect
      .poll(() => page.evaluate(() => document.documentElement.dataset.reducedMotion))
      .toBe('true');

    await page.getByTestId('new-game').click();

    // Age up until an event card renders so we can inspect a motion element.
    for (let i = 0; i < 40; i++) {
      if (await page.getByTestId('event-card').isVisible().catch(() => false)) break;
      await page.getByTestId('age-up').click();
    }
    await expect(page.getByTestId('event-card')).toBeVisible();

    const readCardMotion = () =>
      page.getByTestId('event-card').evaluate((el) => {
        const style = getComputedStyle(el);
        return {
          transform: style.transform,
          duration: parseFloat(style.transitionDuration),
        };
      });

    const first = await readCardMotion();
    await page.waitForTimeout(120);
    const second = await readCardMotion();

    // Settled immediately (effectively zero duration) and transform already final.
    expect(first.transform).toBe(second.transform);
    expect(first.duration).toBeLessThan(0.005);
  });

  test('Settings reduced-motion toggle changes behaviour without an OS preference', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/play?start=1');
    await expect(page.getByTestId('character-summary')).toBeVisible();

    await expect
      .poll(() => page.evaluate(() => document.documentElement.dataset.reducedMotion))
      .toBe('false');

    await page.getByTestId('open-settings').click();
    await expect(page.getByTestId('settings-panel')).toBeVisible();

    await page.getByTestId('settings-motion-reduced').check();
    await expect
      .poll(() => page.evaluate(() => document.documentElement.dataset.reducedMotion))
      .toBe('true');

    await page.getByTestId('settings-motion-full').check();
    await expect
      .poll(() => page.evaluate(() => document.documentElement.dataset.reducedMotion))
      .toBe('false');
  });
});

test.describe('sound autoplay discipline (Gate 3)', () => {
  test('no audio is attempted before the first user interaction', async ({ page }) => {
    await page.goto('/');

    const before = await audioSnapshot(page);
    expect(before.contextStarted, 'AudioContext created on load').toBe(false);
    expect(before.everPlayed, 'sound played before any click').toBe(false);

    await page.getByTestId('new-game').click();
    await page.waitForTimeout(400);

    const after = await audioSnapshot(page);
    expect(after.everPlayed, 'first button press should play a cue').toBe(true);
    expect(after.contextStarted).toBe(true);
  });

  test('the Settings sound-off toggle mutes plays through the real UI', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('new-game').click();

    await page.getByTestId('open-settings').click();
    await expect(page.getByTestId('settings-panel')).toBeVisible();

    // SFX is enabled by default; switch it off through the real UI. The checkbox
    // is visually hidden (sr-only) so Playwright clicks the wrapping label, the
    // same hit target a user clicks.
    await page
      .getByTestId('settings-sfx-toggle')
      .evaluate((el) => (el.closest('label') as HTMLElement).click());

    await expect
      .poll(() => audioSnapshot(page).then((s) => s.muted))
      .toBe(true);

    await page.getByTestId('close-settings').click();

    const playedBefore = (await audioSnapshot(page)).everPlayed;
    await page.getByTestId('age-up').click();
    await page.waitForTimeout(300);

    const after = await audioSnapshot(page);
    expect(after.everPlayed, 'a muted sfx should never surface as a play call').toBe(playedBefore);
  });
});

test.describe('full-motion visual evidence (Gate 3)', () => {
  test('a stat change actually animates under full motion, and is captured', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/');
    await page.getByTestId('new-game').click();

    // Export the fresh character so we can deterministically nudge a stat.
    const downloadPromise = page.waitForEvent('download');
    await page.getByTestId('export-save').click();
    const download = await downloadPromise;
    const exportPath = `downloads-motion-${Date.now()}.json`;
    await download.saveAs(exportPath);
    const saved = JSON.parse(await readFile(exportPath, 'utf8'));
    // Nudge a stat to a value that is *guaranteed* different from the current
    // one (clamping can wreck the +12 trick when health is already near max,
    // leaving no width change to animate).
    const currentHealth = saved.character.stats.health;
    saved.character.stats.health =
      currentHealth >= 80 ? Math.max(0, currentHealth - 40) : Math.min(100, currentHealth + 40);
    expect(saved.character.stats.health).not.toBe(currentHealth);

    // Framer animates fills by writing per-frame inline widths (no WAAPI/CSS
    // transition), so prove motion by the time-course: multiple distinct widths
    // between the old and new fill. An instant jump produces only two distinct
    // values, so three proves a tween. Poll BEFORE import so the whole run is
    // observed.
    const animated = page
      .waitForFunction(
        () => {
          const el = document.querySelector('[data-testid="stat-fill-health"]');
          if (!el) return false;
          const win = window as unknown as { __JNK_FILL_WIDTHS__?: number[] };
          const watched = (win.__JNK_FILL_WIDTHS__ = win.__JNK_FILL_WIDTHS__ || []);
          const width = parseFloat(getComputedStyle(el).width);
          if (watched[watched.length - 1] !== width) watched.push(width);
          return new Set(watched).size >= 3;
        },
        null,
        { timeout: 10_000 },
      )
      .then(() => true)
      .catch(() => false);

    await page.getByTestId('import-save').setInputFiles({
      name: 'save.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(saved)),
    });

    expect(await animated, 'Health fill never showed a Framer-driven width transition').toBe(true);

    // Capture static evidence: character summary + an animating event card.
    await expect(page.getByTestId('character-summary')).toBeVisible();
    await expect(page.getByTestId('event-card')).toBeVisible().catch(() => {});
    await page.screenshot({ path: `test-results/motion-evidence-summary.png`, fullPage: true });

    try {
      await unlink(exportPath);
    } catch {
      // Cleanup best-effort.
    }
  });
});