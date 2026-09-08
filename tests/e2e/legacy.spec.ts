import { expect, test, type Page } from '@playwright/test';
import { startNewLife } from './helpers';

/**
 * M5 #4 (init.md) — legacy/heir mode: a dead life offers to continue as a
 * child who has come of age. Asserts the handover through the real UI: the
 * heir offer lists the children, continuing swaps in a playable heir with the
 * inherited share, and their family tree still shows the late parent and now
 * a sibling.
 */

interface Snap {
  age: number;
  alive: boolean;
  money: number;
  gender: string;
  name: string;
  surname: string;
  flags: string[];
}

async function readCharacter(page: Page): Promise<Snap> {
  return page.evaluate(() => {
    const store = (window as unknown as { __JNK_GAME_STORE__: { getState: () => { character: Snap } } })
      .__JNK_GAME_STORE__;
    return store.getState().character;
  });
}

async function patchForDeath(
  page: Page,
  childCount: 2 | 1,
  adultAge: 0 | 16,
): Promise<{ ids: string[]; parentName: string }> {
  const result = await page.evaluate(
    (opts) => {
      const store = (window as unknown as {
        __JNK_GAME_STORE__: {
          getState: () => {
            character: Record<string, unknown> & { gender: string; name: string; surname: string };
            familyTree: {
              selfId: string;
              members: Array<{
                id: string;
                name: string;
                gender: string;
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
      const parent = s.character;
      const surname = parent.surname;

      const makeChild = (id: string, name: string, age: number) => ({
        id,
        name: `${name} ${surname}`,
        gender: 'male',
        role: 'child',
        age,
        alive: true,
        bond: 62,
        metAge: 40,
        lastSpentAge: -1,
      });

      const children = [];
      if (opts.childCount >= 1) children.push(makeChild('heir-eldest', 'Ruben', opts.adultAge === 0 ? 22 : 16));
      if (opts.childCount >= 2) children.push(makeChild('heir-second', 'Oni', 18));

      const tree = {
        ...s.familyTree,
        members: [...s.familyTree.members.filter((m) => m.role !== 'child'), ...children],
        edges: [
          ...s.familyTree.edges,
          ...children.map((c) => ({ from: s.familyTree.selfId, to: c.id, label: 'parent' as const })),
        ],
      };

      store.setState({
        character: {
          ...parent,
          gender: 'female',
          age: 65,
          money: 60_000,
          alive: false,
          causeOfDeath: 'old age',
          flags: ['has_child'],
        },
        pendingEvents: [],
        currentEventIndex: 0,
        familyTree: tree,
      });
      return { ids: children.map((c) => c.id), parentName: `${parent.name} ${parent.surname}` };
    },
    { childCount, adultAge },
  );
  return result;
}

test.describe('legacy / heir mode (M5 #4)', () => {
  test('a dead life offers its adult children and continues as the eldest heir', async ({ page }) => {
    await page.goto('/');
    await startNewLife(page);
    const { ids, parentName } = await patchForDeath(page, 2, 0);

    // Death screen presents the heir offer with both children, split estate.
    await expect(page.getByTestId('life-summary')).toBeVisible();
    await expect(page.getByTestId('heir-offer')).toBeVisible();
    await expect(page.getByTestId(`continue-as-heir-${ids[0]}`)).toContainText('(22)');
    await expect(page.getByTestId(`continue-as-heir-${ids[1]}`)).toContainText('(18)');

    // Hand over to the eldest.
    await page.getByTestId(`continue-as-heir-${ids[0]}`).click();

    await expect.poll(async () => (await readCharacter(page)).alive).toBe(true);
    const heir = await readCharacter(page);
    expect(heir.age).toBe(22);
    expect(heir.surname).toBeTruthy();
    // 60,000 split two ways; debt is never inherited.
    expect(heir.money).toBe(30_000);
    expect(heir.flags).toEqual([]);

    // The heir is playable: stroll a year.
    await page.getByTestId('age-up').click();
    await expect.poll(async () => (await readCharacter(page)).age).toBe(23);

    // Their family tree still carries the late parent and now a sibling.
    await page.getByTestId('open-family-tree').click();
    await expect(page.getByRole('button', { name: parentName })).toBeVisible();
    await expect(page.getByTestId('tree-node-sibling')).toBeVisible();
    await expect(page.getByTestId('tree-node-self')).toBeVisible();
    await page.getByTestId('family-tree-close').click();
    await expect(page.getByTestId('family-tree')).not.toBeVisible();
  });

  test('no heir offer when the children have not come of age', async ({ page }) => {
    await page.goto('/');
    await startNewLife(page);
    await patchForDeath(page, 1, 16);

    await expect(page.getByTestId('life-summary')).toBeVisible();
    await expect(page.getByTestId('heir-offer')).not.toBeAttached();
  });
});