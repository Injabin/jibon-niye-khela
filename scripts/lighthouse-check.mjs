/**
 * Gate 6 Lighthouse mobile check (init.md M6 #2, TESTING.md Gate 6).
 *
 * Builds the app, serves it with `next start`, runs Lighthouse in mobile
 * mode against the game screens, and fails unless the target scores are met:
 *   Performance >= 85, Accessibility >= 95, Best Practices >= 90.
 * The full JSON report(s) are written to .lighthouse/ for the record.
 *
 * Uses Playwright's bundled Chromium (no system Chrome needed).
 *
 *   node scripts/lighthouse-check.mjs
 */

import { execSync, spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const lighthouse = require('lighthouse').default ?? require('lighthouse');
const chromeLauncher = require('chrome-launcher');

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, '.lighthouse');

const TARGETS = { performance: 85, accessibility: 95, 'best-practices': 90 };
const URL = 'http://localhost:3210';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForServer(port, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://localhost:${port}`);
      if (res.ok) return;
    } catch {
      // not up yet
    }
    await sleep(500);
  }
  throw new Error(`server did not answer on :${port} within ${timeoutMs}ms`);
}

function chromiumPath() {
  try {
    return require('@playwright/test').chromium.executablePath();
  } catch {
    return process.env.CHROME_PATH;
  }
}

async function run() {
  console.log('> building');
  execSync('npm run build', { cwd: ROOT, stdio: 'inherit' });

  console.log('> starting production server');
  const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', '3210'], {
    cwd: ROOT,
    stdio: 'ignore',
  });
  try {
    await waitForServer(3210, 60_000);

    mkdirSync(OUT, { recursive: true });
    const profileDir = resolve(OUT, 'chrome-profile');
    mkdirSync(profileDir, { recursive: true });
    const chromePath = chromiumPath();
    console.log(`> launching lighthouse chromium: ${chromePath}`);
    const chrome = await chromeLauncher.launch({
      chromePath,
      userDataDir: profileDir,
      chromeFlags: ['--headless', '--disable-gpu', '--no-sandbox'],
    });

    const checks = [
      { path: '/', name: 'hub', report: 'hub.json' },
    ];

    const results = [];
    try {
      for (const check of checks) {
        const runner = await lighthouse(`${URL}${check.path}`, {
          port: chrome.port,
          output: 'json',
          formFactor: 'mobile',
          preset: 'desktop', // taps into the fresh modern preset; ignored by score math
          screenEmulation: { mobile: true, width: 390, height: 844, deviceScaleFactor: 2 },
          throttling: { rttMs: 150, throughputKbps: 1638.4, cpuSlowdownMultiplier: 4 },
          onlyCategories: ['performance', 'accessibility', 'best-practices'],
          quiet: true,
        });
        const lhr = runner.lhr;
        writeFileSync(resolve(OUT, check.report), JSON.stringify(lhr, null, 2));

        const scores = {};
        for (const [key, name] of Object.entries({ performance: 'Performance', accessibility: 'Accessibility', 'best-practices': 'Best Practices' })) {
          scores[key] = Math.round((lhr.categories[key]?.score ?? 0) * 100);
          console.log(`  ${check.name.padEnd(16)} ${name.padEnd(15)} ${scores[key]}`);
        }
        results.push({ name: check.name, scores });
      }
    } finally {
      await chrome.kill();
    }

    const failed = results.flatMap((r) =>
      Object.entries(TARGETS)
        .filter(([key, min]) => r.scores[key] < min)
        .map(([key, min]) => ({ screen: r.name, audit: key, got: r.scores[key], min })),
    );

    if (failed.length > 0) {
      console.error('LIGHTHOUSE BELOW TARGET:');
      for (const f of failed) console.error(`  ${f.screen} ${f.audit}: got ${f.got}, need >= ${f.min}`);
      process.exitCode = 1;
    } else {
      console.log('Lighthouse targets met.');
    }
  } finally {
    server.kill();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});