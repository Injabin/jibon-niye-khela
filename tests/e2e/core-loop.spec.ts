import { expect, test } from '@playwright/test';
import { readDisplayedState, resolveAllEvents, startNewLife } from './helpers';

test.describe('full loop smoke test (Gate 2)', () => {
  test('create a character, age up, resolve event choices, and reach the life summary', async ({ page }) => {
    // A full life is ~70 years × up to 3 events/year (G5 content), each event
    // carrying a possible 2.4s moment sting, so this legitimately exceeds the
    // global 90s default on a slower dev machine.
    test.setTimeout(180_000);
    await page.goto('/');
    await startNewLife(page);

    let eventSeen = false;

    for (let i = 0; i < 400; i++) {
      if (await page.getByTestId('life-summary').isVisible().catch(() => false)) break;

      // The store refuses to age up while a choice is pending, so clear any
      // leftover event first — otherwise the age-up click below waits forever
      // on a button that cannot appear until that event is resolved (a stall
      // the parallel lottie tests can trigger by delaying an event-card paint).
      await resolveAllEvents(page);
      // A resolved choice can be fatal, so the summary may only now be
      // rendered — age-up is gone, don't wait on a click that can never land.
      if (await page.getByTestId('life-summary').isVisible().catch(() => false)) break;

      await page.getByTestId('age-up').click();
      if (await page.getByTestId('event-card').isVisible().catch(() => false)) {
        eventSeen = true;
        await resolveAllEvents(page);
      }
    }

    // The loop terminates only because the character died and the summary rendered.
    await expect(page.getByTestId('life-summary')).toBeVisible();
    await expect(page.getByTestId('life-summary')).toContainText('Cause of death');
    expect(eventSeen).toBe(true);
  });

  test('choosing an option on an event changes the displayed stats', async ({ page }) => {
    await page.goto('/');
    await startNewLife(page);

    // Age up until an event with choices appears.
    for (let i = 0; i < 60; i++) {
      await resolveAllEvents(page);
      await page.getByTestId('age-up').click();
      if (await page.getByTestId('event-card').isVisible().catch(() => false)) break;
      await resolveAllEvents(page);
    }

    await expect(page.getByTestId('event-card')).toBeVisible();
    const before = await readDisplayedState(page);

    // Gate 5 content draws 0–3 events per year, so a year may hold several
    // cards. Resolve the rest after this first real pointer choice, then
    // assert the displayed state reflects the choices we made.
    await page.getByTestId('choice-0').first().click();
    await resolveAllEvents(page);
    await expect(page.getByTestId('event-card')).toHaveCount(0);

    const after = await readDisplayedState(page);
    const statChanged =
      before.stats.health !== after.stats.health ||
      before.stats.happiness !== after.stats.happiness ||
      before.stats.smarts !== after.stats.smarts ||
      before.stats.looks !== after.stats.looks;
    const moneyChanged = before.money !== after.money;

    expect(statChanged || moneyChanged, 'no displayed stat or coins changed after a choice').toBe(true);
  });
});