import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';

/**
 * Gate UI-1 §C (TESTING.md): every reskinned screen reads its stat/tone/
 * wealth presentation from the shared theme layer. No component in the theme
 * surface may define its own hex color (UI-DESIGN.md §1.1 consistency rule).
 */

const RESKINNED = [
  'components/game/StickyHeader.tsx',
  'components/game/ChronicleStream.tsx',
  'components/game/dashboard/EventCard.tsx',
  'components/game/ProfileSheet.tsx',
  'components/game/LifeSummary.tsx',
  'components/game/dashboard/StatBar.tsx',
  'components/game/ActiveMenu.tsx',
  'components/game/GameHub.tsx',
  'components/game/SettingsPanel.tsx',
];

/**
 * Screens that take every color from the shared theme but express it through
 * token utility classes (or the pure avatar palette data layer) rather than a
 * direct import of the concept lookup. They still introduce no local hex.
 */
const COLOR_FREE = [
  'components/game/ControlDeck.tsx',
  'components/game/dashboard/LeftSidebar.tsx',
  'components/game/dashboard/RightRail.tsx',
  'components/game/dashboard/TimelineStream.tsx',
  'components/game/NpcChips.tsx',
  'components/avatar/Avatar.tsx',
];

describe('Modern Martial reskin — shared concept lookup discipline', () => {
  for (const rel of RESKINNED) {
    test(`${rel} resolves colors through the shared theme layer`, async () => {
      const src = await readFile(resolve(process.cwd(), rel), 'utf8');
      const importsUser = /@\/lib\/theme(\/concepts)?['"]/.test(src);
      expect(importsUser, 'must import the theme/concepts token layer').toBe(true);

      const hexLiterals = src.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];
      expect(hexLiterals, `no local hex colors allowed (found ${hexLiterals.join(', ')})`).toEqual([]);
    });
  }

  for (const rel of COLOR_FREE) {
    test(`${rel} introduces no local color of its own`, async () => {
      const src = await readFile(resolve(process.cwd(), rel), 'utf8');
      const hexLiterals = src.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];
      expect(hexLiterals, `no local hex colors allowed (found ${hexLiterals.join(', ')})`).toEqual([]);
    });
  }

  test('the shared lookup itself is the single binding of stat display labels', async () => {
    const src = await readFile(resolve(process.cwd(), 'lib/theme/concepts.ts'), 'utf8');
    expect(src).toContain('স্বাস্থ্য');
    expect(src).toContain('সুখ');
    expect(src).toContain('বুদ্ধি');
    expect(src).toContain("label: 'চেহারা'");
    expect(src).toContain("key: 'smarts'");
    expect(src).toContain("key: 'looks'");
  });
});