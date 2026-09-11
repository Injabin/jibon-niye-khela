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
    label: 'হাসিখুশি',
    description: 'তোমার এক চিলতে হাসিতে পুরা ঘরের সবার মন ভালো হইয়া যায়।',
    tone: 'good',
  },
  {
    id: 'rascal',
    label: 'বিচ্ছু ও পাজি',
    description: 'সারাদিন পাড়ায় দুষ্টামি আর গ্যাঞ্জাম বাঁধানোর ধান্দা।',
    tone: 'funny',
  },
  {
    id: 'bookworm',
    label: 'পড়ুয়া পোকা',
    description: 'বই পাইলে আর দুনিয়ার কোনো হুঁশ থাকে না, মগজে প্রচুর ঘিলু।',
    tone: 'good',
  },
  {
    id: 'stargazer',
    label: 'উদাসী',
    description: 'আকাশের পানে চাইয়া গভীর চিন্তায় হাবুডুবু খাওয়া স্বভাব।',
    tone: 'neutral',
  },
  {
    id: 'scrappy',
    label: 'লড়াকু',
    description: 'সাইজে পিচ্চি হইলে কী হইবো, এক্কেরে ডেঞ্জারাস চিজ!',
    tone: 'funny',
  },
  {
    id: 'daydreamer',
    label: 'দিবাস্বপ্ন বিলাসী',
    description: 'সারাদিন মনের কল্পনার জগতে বাইয়া বেড়ানো।',
    tone: 'neutral',
  },
  {
    id: 'storm',
    label: 'গরম মেজাজ',
    description: 'কথায় কথায় চান্দি গরম, রাগ উঠলে কোনো কিছুর হুশ থাকে না।',
    tone: 'bad',
  },
  {
    id: 'fixer',
    label: 'ওস্তাদ কারিগর',
    description: 'ভাঙাচোরা জিনিস পাইলেই জোড়াতালি দিয়া ঠিক করার শখ।',
    tone: 'good',
  },
];