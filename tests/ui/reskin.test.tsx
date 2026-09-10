import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createCharacter } from '@/lib/engine/character';
import type { Stats } from '@/lib/engine/types';
import { StickyHeader } from '@/components/game/StickyHeader';
import { formatMoney } from '@/lib/ui/money';
import { rankForLife } from '@/lib/ui/rank';

/**
 * Gate UI-1 §A (TESTING.md):
 *  - the persisted store keeps the engine's four stat keys (nothing renamed),
 *  - the rendered UI shows the reskinned display labels "Martial Skill" and
 *    "Honor" while the progressbars keep the engine-key accessible names.
 *  - money/rank presentation helpers behave deterministically.
 */
describe('Modern Martial reskin — stat keys and display labels', () => {
  test('engine stat keys survive creation unchanged and are the only stat keys', () => {
    const { character } = createCharacter(42);
    expect(Object.keys(character.stats).sort()).toEqual(['happiness', 'health', 'looks', 'smarts']);
    const saved = JSON.parse(JSON.stringify({ stats: character.stats })) as { stats: Stats };
    expect(saved.stats).toHaveProperty('health');
    expect(saved.stats).toHaveProperty('happiness');
    expect(saved.stats).toHaveProperty('smarts');
    expect(saved.stats).toHaveProperty('looks');
  });

  test('StickyHeader renders the reskinned labels yet keeps engine-key progressbar names', () => {
    const { character } = createCharacter(7);
    character.money = 1234;
    const { container } = render(<StickyHeader character={character} compact={false} />);

    expect(container.textContent).toContain('বুদ্ধি');
    expect(container.textContent).toContain('চেহারা');

    const names: Record<keyof Stats, string> = {
      health: 'Health',
      happiness: 'Happiness',
      smarts: 'Smarts',
      looks: 'Looks',
    };
    for (const key of Object.keys(names) as (keyof Stats)[]) {
      const bar = screen.getByRole('progressbar', { name: names[key] });
      expect(bar.getAttribute('aria-valuenow')).toBe(String(Math.round(character.stats[key])));
      expect(screen.getByTestId(`stat-${key}`)).toBeTruthy();
      expect(screen.getByTestId(`stat-fill-${key}`)).toBeTruthy();
    }

    // The header still carries the Gate 1 summary contract.
    expect(container.querySelector('[data-testid="character-summary"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="money"]')).toBeTruthy();
    expect(container.textContent).toMatch(/(\d+) বছর বয়স/);
  });

  test('money formats with commas and no symbol, and rank derives deterministically', () => {
    expect(formatMoney(1234567)).toBe('1,234,567');
    expect(formatMoney(-50)).toBe('-50');

    const base = () => createCharacter(3).character;

    expect(rankForLife({ ...base(), age: 3 })).toBe('Swaddled Whelp');
    expect(rankForLife({ ...base(), age: 15 })).toBe('Squire');
    expect(rankForLife({ ...base(), age: 21 })).toBe('Free Blade');
    expect(
      rankForLife({
        ...base(),
        age: 30,
        career: { jobId: 'soldier', performance: 80, yearsAtJob: 4 },
      }),
    ).toBe('Battle-Hardened Veteran');
    expect(rankForLife({ ...base(), age: 40, reputation: { fame: 85, karma: 30 } })).toBe('Warlord');
    expect(rankForLife({ ...base(), alive: false, age: 75, reputation: { fame: 95, karma: 30 } })).toBe(
      'The Departed',
    );
  });
});