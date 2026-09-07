export type Tone = 'good' | 'bad' | 'neutral' | 'funny';

export interface Stats {
  health: number;
  happiness: number;
  smarts: number;
  looks: number;
}

export interface LifeEventLogEntry {
  age: number;
  text: string;
  tone: Tone;
}

export interface Job {
  id: string;
  title: string;
  salary: number;
  requiredSmarts: number;
}

export interface Character {
  id: string;
  name: string;
  surname: string;
  gender: 'male' | 'female';
  birthYear: number;
  stats: Stats;
  money: number;
  age: number;
  alive: boolean;
  causeOfDeath?: string;
  traits: string[];
  history: LifeEventLogEntry[];
  job: Job | null;
  assets: string[];
}

export interface StatEffects {
  health?: number;
  happiness?: number;
  smarts?: number;
  looks?: number;
  money?: number;
}

export interface EventChoice {
  id: string;
  text: string;
  effects: StatEffects;
  outcomeText: string;
  tone: Tone;
}

export interface LifeEventDef {
  id: string;
  text: string;
  minAge: number;
  maxAge: number;
  weight: number;
  tone: Tone;
  choices: EventChoice[];
  requiredFlags?: string[];
  tags?: string[];
}
