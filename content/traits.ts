import type { Tone } from '@/lib/engine/types';

export interface TraitDef {
  id: string;
  label: string;
  description: string;
  tone: Tone;
}

export const TRAITS: readonly TraitDef[] = [
  {
    id: 'sunbeam',
    label: 'Sunbeam',
    description: 'Your smile can lift a whole room.',
    tone: 'good',
  },
  {
    id: 'rascal',
    label: 'Rascal',
    description: 'Trouble finds you, and you like it.',
    tone: 'funny',
  },
  {
    id: 'bookworm',
    label: 'Bookworm',
    description: 'You read the dictionary for fun.',
    tone: 'good',
  },
  {
    id: 'stargazer',
    label: 'Stargazer',
    description: 'Always wondering what is up there.',
    tone: 'neutral',
  },
  {
    id: 'scrappy',
    label: 'Scrappy',
    description: 'Small, loud, and hard to keep down.',
    tone: 'funny',
  },
  {
    id: 'daydreamer',
    label: 'Daydreamer',
    description: 'Half of you lives on another planet.',
    tone: 'neutral',
  },
  {
    id: 'storm',
    label: 'Storm',
    description: 'Moody clouds roll in without warning.',
    tone: 'bad',
  },
  {
    id: 'fixer',
    label: 'Fixer',
    description: 'Anything broken becomes your project.',
    tone: 'good',
  },
];