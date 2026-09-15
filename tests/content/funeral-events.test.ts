import { describe, expect, it } from 'vitest';
import { createCharacter } from '@/lib/engine/character';
import { resolveEventChoice } from '@/lib/engine/events/registry';
import { buildFuneralEvent } from '@/content/events/funeral';

describe('Part D — religion-aware funeral rites', () => {
  it('a Muslim funeral carries a জানাজা at a realistic Dhaka graveyard with three cost tiers', () => {
    const event = buildFuneralEvent({ name: 'রাবেয়া বেগম', roleLabel: 'আম্মা', religion: 'islam' });

    expect(event.tone).toBe('neutral');
    expect(event.choices).toHaveLength(3);
    expect(event.choices.every((c) => c.tone !== 'funny')).toBe(true);

    const budget = event.choices.find((c) => c.id === 'funeral_muslim_budget')!;
    const standard = event.choices.find((c) => c.id === 'funeral_muslim_standard')!;
    const premium = event.choices.find((c) => c.id === 'funeral_muslim_premium')!;

    expect((budget.effects.money ?? 0)).toBeLessThan(0);
    expect((standard.effects.money ?? 0)).toBeLessThan(budget.effects.money!);
    expect((premium.effects.money ?? 0)).toBeLessThan(standard.effects.money!);
    expect((premium.effects.karma ?? 0)).toBeGreaterThan((budget.effects.karma ?? 0));

    expect(budget.outcomeText).toContain('আজিমপুর কবরস্থান');
    expect(standard.outcomeText).toContain('বনানী কবরস্থান');
    expect(premium.outcomeText).toContain('মিরপুর শাহী কবরস্থান');
    expect(event.text).toContain('জানাজার');
  });

  it('a Hindu funeral carries a দাহ (cremation) at a realistic শ্মশান with three cost tiers', () => {
    const event = buildFuneralEvent({ name: 'কমলা দেবী', roleLabel: 'নানী', religion: 'hinduism' });

    expect(event.choices).toHaveLength(3);
    expect(event.choices.every((c) => c.tone !== 'funny')).toBe(true);

    const budget = event.choices.find((c) => c.id === 'funeral_hindu_budget')!;
    const standard = event.choices.find((c) => c.id === 'funeral_hindu_standard')!;
    const premium = event.choices.find((c) => c.id === 'funeral_hindu_premium')!;

    expect((budget.effects.money ?? 0)).toBeLessThan(0);
    expect((premium.effects.karma ?? 0)).toBeGreaterThan((budget.effects.karma ?? 0));

    expect(budget.outcomeText).toContain('পোস্তা শ্মশান');
    expect(standard.outcomeText).toContain('রায়ের বাজার মহানগর শ্মশান');
    expect(premium.outcomeText).toContain('পিণ্ডদান');
  });

  it('resolving a funeral tier deducts its cost and logs a respectful history entry', () => {
    const { character } = createCharacter(21);
    character.age = 45;
    character.religion = 'islam';
    const before = character.money;

    const event = buildFuneralEvent({ name: 'রহিম মিয়া', roleLabel: 'আব্বা', religion: 'islam' });
    const budget = event.choices.find((c) => c.id === 'funeral_muslim_budget')!;
    resolveEventChoice(character, event, budget.id);

    expect(character.money).toBe(before - 15);
    const last = character.history[character.history.length - 1];
    expect(last.tone).toBe('neutral');
    expect(last.age).toBe(45);
    expect(last.text).toContain('আজিমপুর কবরস্থান');
  });
});