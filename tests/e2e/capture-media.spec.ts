import { test, expect } from '@playwright/test';
import path from 'node:path';

test.use({
  viewport: { width: 1280, height: 720 },
  video: {
    mode: 'on',
    size: { width: 1280, height: 720 },
  },
});

test.describe('Gate 11 Media Capture — Real Gameplay Footage', () => {
  test('capture real gameplay footage of event resolving and stat reacting', async ({ page }) => {
    // 1. Navigate to in-game view and auto-start
    await page.goto('/play?start=1');
    await expect(page.getByTestId('character-summary')).toBeVisible({ timeout: 15_000 });

    // 2. Capture crisp hero screenshot for atmospheric visual
    await page.waitForTimeout(1000); // Allow ambient animations to settle
    const heroPath = path.join(process.cwd(), 'public', 'images', 'gameplay-hero.png');
    await page.screenshot({ path: heroPath });

    // 3. Age up until an interactive event card with choices appears
    const eventCard = page.getByTestId('event-card');
    for (let i = 0; i < 20; i++) {
      if (await eventCard.isVisible().catch(() => false)) break;
      const ageUpBtn = page.getByTestId('age-up');
      if (await ageUpBtn.isEnabled().catch(() => false)) {
        await ageUpBtn.click();
        await page.waitForTimeout(500);
      }
    }

    await expect(eventCard).toBeVisible({ timeout: 10_000 });

    // 4. Capture poster frame of active dilemma
    const posterPath = path.join(process.cwd(), 'public', 'media', 'gameplay-poster.png');
    await page.screenshot({ path: posterPath });

    // 5. Select choice 0 on the event card to trigger stat delta & sound reaction
    const firstChoice = page.getByTestId('choice-0').first();
    await expect(firstChoice).toBeVisible();
    await page.waitForTimeout(800); // Record brief pause contemplating choice
    await firstChoice.click();

    // 6. Wait for event resolution, stat reaction animation, and chronicle update
    await page.waitForTimeout(2500);

    // 7. Save recorded video to public/media/gameplay-demo.webm
    const video = page.video();
    expect(video).not.toBeNull();
    if (video) {
      await page.close(); // Closing page finalizes video recording
      const targetVideoPath = path.join(process.cwd(), 'public', 'media', 'gameplay-demo.webm');
      await video.saveAs(targetVideoPath);
    }
  });
});
