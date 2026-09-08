import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: 0,
  reporter: [['list']],
  timeout: 90_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
    // Traces balloon the evaluate-heavy endurance specs (three-lives, systems),
    // so they are recorded only on failure here; motion.spec.ts opts back in
    // for the passing-run evidence it needs (Gate 3).
    trace: 'retain-on-failure',
  },
  webServer: {
    // Production build: the offline/PWA check (M6 #3) must exercise the
    // real served app, not dev-mode HMR.
    command: 'npm run build && npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 180_000,
    stdout: 'ignore',
  },
});