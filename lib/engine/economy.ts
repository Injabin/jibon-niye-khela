import { Character, Job } from './types';
import { applyStatEffects } from './stats';
import { RNG } from './rng';

export const JOB_MARKET: Job[] = [
  { id: 'fast_food', title: 'Fast Food Worker', salary: 15000, requiredSmarts: 0 },
  { id: 'retail', title: 'Retail Associate', salary: 18000, requiredSmarts: 10 },
  { id: 'factory', title: 'Factory Worker', salary: 25000, requiredSmarts: 20 },
  { id: 'clerk', title: 'Office Clerk', salary: 35000, requiredSmarts: 40 },
  { id: 'teacher', title: 'School Teacher', salary: 45000, requiredSmarts: 60 },
  { id: 'plumber', title: 'Plumber', salary: 55000, requiredSmarts: 40 },
  { id: 'nurse', title: 'Registered Nurse', salary: 70000, requiredSmarts: 70 },
  { id: 'programmer', title: 'Software Engineer', salary: 95000, requiredSmarts: 80 },
  { id: 'lawyer', title: 'Lawyer', salary: 120000, requiredSmarts: 90 },
  { id: 'doctor', title: 'Medical Doctor', salary: 200000, requiredSmarts: 95 },
  { id: 'ceo', title: 'Corporate Executive', salary: 500000, requiredSmarts: 90 },
];

export function getAvailableJobs(character: Character): Job[] {
  if (character.age < 18) return [];
  // Return jobs the character meets the smarts requirement for
  // Give a small +-10 leeway via randomness? We will keep it strictly threshold based for simplicity
  return JOB_MARKET.filter(job => character.stats.smarts >= job.requiredSmarts);
}

export function applyYearlyIncome(character: Character, rng: RNG): void {
  if (character.age < 18 && character.age >= 6) {
    // Allowance based on age
    const allowance = rng.rangeInt(10, 50);
    applyStatEffects(character, { money: allowance });
  } else if (character.job) {
    // If they have a job, they get paid
    // Minus taxes and living expenses (roughly 30% tax/expenses)
    const netIncome = Math.floor(character.job.salary * 0.7);
    applyStatEffects(character, { money: netIncome });
    
    // Tiny chance to get fired if happiness or smarts are too low
    if (character.stats.happiness < 20 || character.stats.smarts < (character.job.requiredSmarts - 10)) {
      if (rng.chance(0.1)) {
        character.history.push({
          age: character.age,
          text: `You were fired from your job as a ${character.job.title} due to poor performance.`,
          tone: 'bad'
        });
        character.job = null;
      }
    }
  }
}
