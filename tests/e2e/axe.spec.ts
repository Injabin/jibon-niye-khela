import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { resolveAllEvents } from './helpers';

/**
 * TESTING.md Gate 6 — automated accessibility scan (axe-core) against the
 * main screens: hub, active life (event card), settings, family tree, and
 * the life summary + heir offer. Fails the gate on any critical/serious
 * violation; minor/moderate are printed for the record but don't block.
 *
 * Each screen is scanned in BOTH color schemes (Gate UI-1 E cross-theme
 * regression): dark-mode crimson text uses the dedicated AA tokens, and this
 * sweep is what enforces that no half-themed screen slips through.
 */
test.describe('axe-core scan (Gate 6)', () => {
  const settle = (page: Page) => page.waitForTimeout(500);

  async function assertNoCriticalSerious(page: Page) {
    const results = await new AxeBuilder({ page }).analyze();
    const blocking = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
    const summary = blocking.map((v) => ({
      id: v.id,
      impact: v.impact,
      nodes: v.nodes.map((n) => n.target),
    }));
    expect(JSON.stringify(summary, null, 2)).toBe('[]');
  }

  for (const scheme of ['light', 'dark'] as const) {
    test(`${scheme}: hub landing`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto('/');
      await expect(page.getByTestId('new-game')).toBeVisible();
      await settle(page);
      await assertNoCriticalSerious(page);
    });

    test(`${scheme}: active life with an event card`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto('/');
      await page.getByTestId('new-game').click();
      await expect(page.getByTestId('age-up')).toBeVisible();
      // Years can carry 0–3 events (G5 content), so age up until a card shows.
      for (let i = 0; i < 10 && !(await page.getByTestId('event-card').isVisible().catch(() => false)); i++) {
        await resolveAllEvents(page);
        if (await page.getByTestId('life-summary').isVisible().catch(() => false)) break;
        await page.getByTestId('age-up').click();
      }
      await expect(page.getByTestId('event-card')).toBeVisible();
      await settle(page);
      await assertNoCriticalSerious(page);
    });

    test(`${scheme}: settings panel`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto('/');
      await page.getByTestId('new-game').click();
      await page.getByTestId('open-settings').click();
      await expect(page.getByTestId('settings-panel')).toBeVisible();
      await settle(page);
      await assertNoCriticalSerious(page);
    });

    test(`${scheme}: family tree dialog`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto('/');
      await page.getByTestId('new-game').click();
      await page.getByTestId('open-family-tree').click();
      await expect(page.getByTestId('family-tree')).toBeVisible();
      await settle(page);
      await assertNoCriticalSerious(page);
    });

    test(`${scheme}: life summary and heir offer (death state)`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto('/');
      await page.getByTestId('new-game').click();
      await patchDeadWithHeirs(page);
      await expect(page.getByTestId('life-summary')).toBeVisible();
      await expect(page.getByTestId('heir-offer')).toBeVisible();
      await settle(page);
      await assertNoCriticalSerious(page);
    });
  }
});

/** Fabricate a deceased adult with two adult children (see legacy.spec for
 *  the same technique) so the death-screen summary + heir offer render. */
async function patchDeadWithHeirs(page: Page): Promise<void> {
  await page.waitForFunction(() => typeof (window as unknown as { __JNK_GAME_STORE__?: unknown }).__JNK_GAME_STORE__ !== 'undefined');
  await page.evaluate(() => {
    const store = (window as unknown as {
      __JNK_GAME_STORE__: {
        getState: () => {
          character: Record<string, unknown> & { name: string; surname: string };
          familyTree: {
            selfId: string;
            members: Array<{
              id: string;
              name: string;
              role: string;
              age: number;
              alive: boolean;
              bond: number;
              metAge: number;
              lastSpentAge: number;
            }>;
            edges: Array<{ from: string; to: string; label: string }>;
          };
        };
        setState: (patch: Record<string, unknown>) => void;
      };
    }).__JNK_GAME_STORE__;
    const s = store.getState();
    const surname = s.character.surname;
    const children = [22, 18].map((age, i) => ({
      id: `heir-${i}`,
      name: `${['Ruben', 'Oni'][i]} ${surname}`,
      gender: 'male' as const,
      role: 'child' as const,
      age,
      alive: true,
      bond: 62,
      metAge: 40,
      lastSpentAge: -1,
    }));
    store.setState({
      character: {
        ...s.character,
        age: 65,
        money: 60_000,
        alive: false,
        causeOfDeath: 'old age',
        flags: ['has_child'],
      },
      pendingEvents: [],
      currentEventIndex: 0,
      familyTree: {
        ...s.familyTree,
        members: [...s.familyTree.members.filter((m) => m.role !== 'child'), ...children],
        edges: [
          ...s.familyTree.edges,
          ...children.map((c) => ({ from: s.familyTree.selfId, to: c.id, label: 'parent' as const })),
        ],
      },
    });
  });
}