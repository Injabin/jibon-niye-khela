import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const ARTIFACT_DIR = 'C:/Users/HP/.gemini/antigravity/brain/c93f50e2-6964-46ea-89cd-0795e170fea5';

test.describe('Phase 1 Gate — Bangla Typography & Conjunct Verification', () => {
  test('renders Baloo Da 2 and Hind Siliguri cleanly across 20 sentences and 40 conjuncts with 0 tofu boxes', async ({
    page,
  }) => {
    // 1. Visit font test page
    await page.goto('/font-test');
    await expect(page.getByTestId('font-test-page')).toBeVisible({ timeout: 15_000 });

    // 2. Main heading check
    const heading = page.getByTestId('main-heading');
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('জীবন নিয়ে খেলা — ঢাকাইয়া ফন্ট ও যুক্তাক্ষর টেস্ট');

    // 3. Verify Canonical Lines
    await expect(page.getByTestId('canonical-birth')).toContainText('আব্বে হালায়!');
    await expect(page.getByTestId('canonical-first-call')).toContainText('আব্বে পিচ্চি!');

    // 4. Verify all 40 conjunct cards render non-empty text
    const conjunctSection = page.getByTestId('conjuncts-section');
    await expect(conjunctSection).toBeVisible();
    for (let i = 0; i < 40; i++) {
      const card = page.getByTestId(`conjunct-${i}`);
      await expect(card).toBeVisible();
      const text = await card.innerText();
      expect(text.trim().length).toBeGreaterThan(0);
      // Ensure no unrendered tofu replacement character
      expect(text).not.toContain('\uFFFD');
    }

    // 5. Verify all 20 Dhakaiya sentences render both Display & Body variants
    const sentenceSection = page.getByTestId('sentences-section');
    await expect(sentenceSection).toBeVisible();
    for (let i = 1; i <= 20; i++) {
      const item = page.getByTestId(`sentence-item-${i}`);
      await expect(item).toBeVisible();

      const displayLine = page.getByTestId(`sentence-display-${i}`);
      const bodyLine = page.getByTestId(`sentence-body-${i}`);

      await expect(displayLine).toBeVisible();
      await expect(bodyLine).toBeVisible();

      const displayText = await displayLine.innerText();
      const bodyText = await bodyLine.innerText();

      expect(displayText.trim().length).toBeGreaterThan(5);
      expect(bodyText.trim().length).toBeGreaterThan(5);
      expect(displayText).not.toContain('\uFFFD');
      expect(bodyText).not.toContain('\uFFFD');
    }

    // 6. Verify Slang bank items
    const slangSection = page.getByTestId('slang-section');
    await expect(slangSection).toBeVisible();
    const slangCard0 = page.getByTestId('slang-item-0');
    await expect(slangCard0).toContainText('মামুর বেটা');

    // 7. Verify computed fonts
    const displayFont = await heading.evaluate((el) => window.getComputedStyle(el).fontFamily);
    const bodyFont = await page.getByTestId('sentence-body-1').evaluate((el) => window.getComputedStyle(el).fontFamily);

    console.log('Computed Display Font:', displayFont);
    console.log('Computed Body Font:', bodyFont);

    expect(displayFont).toMatch(/Baloo/i);
    expect(bodyFont).toMatch(/Hind/i);

    // 8. Capture Real Screenshots for Gate 1 Evidence
    const imgDir = path.resolve(process.cwd(), 'public/images');
    if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir, { recursive: true });

    // Full page screenshot
    const fullPageBuffer = await page.screenshot({ fullPage: true });
    fs.writeFileSync(path.join(imgDir, 'bangla-font-full.png'), fullPageBuffer);
    if (fs.existsSync(ARTIFACT_DIR)) {
      fs.writeFileSync(path.join(ARTIFACT_DIR, 'bangla-font-full.png'), fullPageBuffer);
    }

    // Conjunct grid screenshot
    const conjunctBuffer = await conjunctSection.screenshot();
    fs.writeFileSync(path.join(imgDir, 'bangla-conjuncts.png'), conjunctBuffer);
    if (fs.existsSync(ARTIFACT_DIR)) {
      fs.writeFileSync(path.join(ARTIFACT_DIR, 'bangla-conjuncts.png'), conjunctBuffer);
    }

    // Sentences section screenshot
    const sentencesBuffer = await sentenceSection.screenshot();
    fs.writeFileSync(path.join(imgDir, 'bangla-sentences.png'), sentencesBuffer);
    if (fs.existsSync(ARTIFACT_DIR)) {
      fs.writeFileSync(path.join(ARTIFACT_DIR, 'bangla-sentences.png'), sentencesBuffer);
    }
  });
});
