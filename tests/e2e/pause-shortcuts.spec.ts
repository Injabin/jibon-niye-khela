import { expect, test } from '@playwright/test';
import { startNewLife } from './helpers';

test.describe('Gate 10 — Keyboard Shortcuts & Pause System', () => {
  test('Esc closes open modal first, and only opens pause menu when nothing else is open', async ({
    page,
  }) => {
    await page.goto('/');
    await startNewLife(page);
    await expect(page.getByTestId('character-summary')).toBeVisible();

    // 1. Open Settings modal
    await page.getByTestId('open-settings').click();
    await expect(page.getByRole('dialog', { name: 'Settings' })).toBeVisible();

    // Press Escape -> Should close Settings modal, NOT open Pause Menu
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'Settings' })).toBeHidden();
    await expect(page.getByTestId('pause-menu')).toBeHidden();

    // 2. Now with nothing open, press Escape -> Should open Pause Menu
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('pause-menu')).toBeVisible();

    // Pressing Escape while Pause Menu is open resumes the game
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('pause-menu')).toBeHidden();
  });

  test('Pausing mid-event and resuming does not lose or duplicate in-progress event state', async ({
    page,
  }) => {
    await page.goto('/');
    await startNewLife(page);
    await expect(page.getByTestId('character-summary')).toBeVisible();

    // Inject a pending event with 2 choices to test pausing mid-event reliably
    await page.evaluate(() => {
      const store = (window as unknown as {
        __JNK_GAME_STORE__?: {
          setState: (state: unknown) => void;
        };
      }).__JNK_GAME_STORE__;

      store?.setState({
        pendingEvents: [
          {
            id: 'test_pause_dilemma',
            stage: 'young_adult',
            text: 'A wandering merchant offers you a mysterious glowing talisman.',
            tone: 'funny',
            choices: [
              {
                id: 'buy_talisman',
                text: 'Buy it for 50 Taka',
                effects: { money: -50, happiness: 10 },
                outcomeText: 'You feel curiously lucky today.',
              },
              {
                id: 'ignore_merchant',
                text: 'Politely walk away',
                effects: {},
                outcomeText: 'You continue on your path.',
              },
            ],
          },
        ],
        currentEventIndex: 0,
      });
    });

    // Event card must be visible
    await expect(page.getByTestId('event-card')).toBeVisible();
    await expect(page.getByText('A wandering merchant offers you a mysterious glowing talisman.')).toBeVisible();
    await expect(page.getByTestId('choice-0')).toContainText('Buy it for 50 Taka');

    // Press Escape -> Game pauses, Pause Menu appears over the event card
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('pause-menu')).toBeVisible();

    // Resume via Pause Menu Resume button
    await page.getByTestId('pause-resume').click();
    await expect(page.getByTestId('pause-menu')).toBeHidden();

    // Event card is STILL intact with exact same choices and text
    await expect(page.getByTestId('event-card')).toBeVisible();
    await expect(page.getByText('A wandering merchant offers you a mysterious glowing talisman.')).toBeVisible();
    await expect(page.getByTestId('choice-0')).toContainText('Buy it for 50 Taka');
    await expect(page.getByTestId('choice-1')).toContainText('Politely walk away');
  });

  test('Number-key choice selection matches visually numbered choices (no off-by-one mismatch)', async ({
    page,
  }) => {
    await page.goto('/');
    await startNewLife(page);
    await expect(page.getByTestId('character-summary')).toBeVisible();

    // Inject a pending event with 3 distinct choices
    await page.evaluate(() => {
      const store = (window as unknown as {
        __JNK_GAME_STORE__?: {
          setState: (state: unknown) => void;
        };
      }).__JNK_GAME_STORE__;

      store?.setState({
        pendingEvents: [
          {
            id: 'test_choice_numbers',
            stage: 'young_adult',
            text: 'Choose which direction to take at the crossroads.',
            tone: 'neutral',
            choices: [
              {
                id: 'choice_one',
                text: 'Take the northern mountain pass',
                effects: { smarts: 5 },
                outcomeText: 'High altitude expands your mind.',
              },
              {
                id: 'choice_two',
                text: 'Take the eastern coastal path',
                effects: { happiness: 10 },
                outcomeText: 'The ocean breeze restores your joy.',
              },
              {
                id: 'choice_three',
                text: 'Take the southern bustling highway',
                effects: { fame: 5 },
                outcomeText: 'You meet many travelers on the road.',
              },
            ],
          },
        ],
        currentEventIndex: 0,
      });
    });

    await expect(page.getByTestId('event-card')).toBeVisible();
    // Choice 1 shows number 1, Choice 2 shows number 2, Choice 3 shows number 3
    await expect(page.getByTestId('choice-0')).toContainText('1');
    await expect(page.getByTestId('choice-1')).toContainText('2');
    await expect(page.getByTestId('choice-2')).toContainText('3');

    // Pressing '2' should pick Choice 2 ("Take the eastern coastal path")
    await page.keyboard.press('2');

    // The event should now be resolved
    await expect(page.getByTestId('event-card')).toBeHidden({ timeout: 5000 });

    // Check that choice 2 was resolved by verifying character history has the outcome
    const hasOutcome = await page.evaluate(() => {
      const store = (window as unknown as {
        __JNK_GAME_STORE__?: {
          getState: () => {
            character?: { history?: Array<{ text: string }> };
          };
        };
      }).__JNK_GAME_STORE__;
      const history = store?.getState()?.character?.history ?? [];
      return history.some((h) => h.text.includes('The ocean breeze restores your joy'));
    });
    expect(hasOutcome).toBe(true);
  });

  test('Shortcuts do not fire while a text input is focused', async ({ page }) => {
    await page.goto('/');
    // Open Custom Life modal from landing screen
    await page.getByTestId('open-custom-life-btn').click();
    await expect(page.getByTestId('custom-life-modal')).toBeVisible();

    const nameInput = page.getByTestId('custom-name-input');
    await expect(nameInput).toBeVisible();

    // Focus input and type characters including numbers and '?'
    await nameInput.focus();
    await page.keyboard.press('End');
    await page.keyboard.type('123?');

    // The input value must contain the typed numbers and question mark
    await expect(nameInput).toHaveValue(/123\?/);

    // Shortcuts modal must NOT have opened
    await expect(page.getByTestId('shortcuts-modal')).toBeHidden();

    // Pause menu must NOT have opened
    await expect(page.getByTestId('pause-menu')).toBeHidden();
  });

  test('? shortcut opens keyboard shortcuts overlay listing all required bindings', async ({
    page,
  }) => {
    await page.goto('/');
    await startNewLife(page);
    await expect(page.getByTestId('character-summary')).toBeVisible();

    // Press '?'
    await page.keyboard.press('?');
    await expect(page.getByTestId('shortcuts-modal')).toBeVisible();

    // Check that all required shortcuts are accurately listed in the dialog
    const content = await page.getByTestId('shortcuts-modal').textContent();
    expect(content).toContain('Space');
    expect(content).toContain('Enter');
    expect(content).toContain('1');
    expect(content).toContain('2');
    expect(content).toContain('3');
    expect(content).toContain('4');
    expect(content).toContain('Esc');
    expect(content).toContain('Tab');
    expect(content).toContain('Arrow Keys');
    expect(content).toContain('?');

    // Pressing Escape closes the shortcuts modal
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('shortcuts-modal')).toBeHidden();
    // Confirm pause menu did not open upon closing shortcuts modal
    await expect(page.getByTestId('pause-menu')).toBeHidden();
  });

  test('Pause menu options function properly: Resume, Settings, and Quit', async ({ page }) => {
    await page.goto('/');
    await startNewLife(page);
    await expect(page.getByTestId('character-summary')).toBeVisible();

    // Open Pause Menu
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('pause-menu')).toBeVisible();

    // Click Settings inside Pause Menu
    await page.getByTestId('pause-settings').click();
    await expect(page.getByRole('dialog', { name: 'Settings' })).toBeVisible();

    // Close Settings
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'Settings' })).toBeHidden();

    // Open Pause Menu again and Quit to Landing
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('pause-menu')).toBeVisible();

    await page.getByTestId('pause-quit').click();
    await expect(page.getByTestId('pause-menu')).toBeHidden();
    // Should be on landing screen now
    await expect(page.getByTestId('new-game')).toBeVisible();
  });
});
