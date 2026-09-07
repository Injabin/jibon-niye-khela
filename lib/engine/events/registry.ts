import { Character, LifeEventDef } from '../types';
import { RNG } from '../rng';

export const eventRegistry: LifeEventDef[] = [
  {
    id: 'toddler_first_steps',
    text: 'You took your first steps today!',
    minAge: 1,
    maxAge: 2,
    weight: 100,
    tone: 'good',
    choices: [
      {
        id: 'walk',
        text: 'Walk to mommy',
        effects: { happiness: 10, health: 5 },
        outcomeText: 'You successfully waddled over to your mother. She clapped happily.',
        tone: 'good'
      },
      {
        id: 'fall',
        text: 'Fall on your face',
        effects: { happiness: -5, health: -2 },
        outcomeText: 'You tried to run before you could walk and face-planted. Ouch!',
        tone: 'bad'
      }
    ]
  },
  {
    id: 'child_eat_bug',
    text: 'You found a squishy green bug on the playground.',
    minAge: 3,
    maxAge: 6,
    weight: 50,
    tone: 'funny',
    choices: [
      {
        id: 'eat',
        text: 'Eat it',
        effects: { health: -10, happiness: 5 },
        outcomeText: 'It tasted gross, but you felt adventurous. Then your tummy hurt.',
        tone: 'bad'
      },
      {
        id: 'squish',
        text: 'Squish it',
        effects: { happiness: -2 },
        outcomeText: 'You squished it. It left a green stain on your shoe.',
        tone: 'neutral'
      }
    ]
  },
  {
    id: 'school_bully',
    text: 'A bigger kid demands your lunch money.',
    minAge: 7,
    maxAge: 12,
    weight: 60,
    tone: 'bad',
    choices: [
      {
        id: 'give',
        text: 'Give it to them',
        effects: { happiness: -10, money: -5 },
        outcomeText: 'You went hungry today, but stayed safe.',
        tone: 'bad'
      },
      {
        id: 'fight',
        text: 'Fight back',
        effects: { health: -15, happiness: 15 },
        outcomeText: 'You got a black eye, but you stood your ground. You feel proud.',
        tone: 'good'
      }
    ]
  },
  {
    id: 'school_test',
    text: 'You have a big math test today.',
    minAge: 8,
    maxAge: 14,
    weight: 80,
    tone: 'neutral',
    choices: [
      {
        id: 'try',
        text: 'Try your best',
        effects: { smarts: 5, happiness: -5 },
        outcomeText: 'You passed! It was stressful, but you feel smarter.',
        tone: 'good'
      },
      {
        id: 'cheat',
        text: 'Cheat',
        effects: { smarts: -5 },
        outcomeText: 'You cheated and passed, but you did not learn anything.',
        tone: 'bad'
      }
    ]
  },
  {
    id: 'teen_party',
    text: 'You were invited to a high school party.',
    minAge: 14,
    maxAge: 18,
    weight: 70,
    tone: 'good',
    choices: [
      {
        id: 'go',
        text: 'Go to the party',
        effects: { happiness: 15, health: -5 },
        outcomeText: 'You had a blast, though you stayed up way too late.',
        tone: 'good'
      },
      {
        id: 'stay_home',
        text: 'Stay home and study',
        effects: { smarts: 10, happiness: -10 },
        outcomeText: 'You got ahead on your homework, but felt lonely.',
        tone: 'neutral'
      }
    ]
  },
  {
    id: 'teen_pimple',
    text: 'You woke up with a massive pimple on your nose.',
    minAge: 13,
    maxAge: 17,
    weight: 90,
    tone: 'bad',
    choices: [
      {
        id: 'pop',
        text: 'Pop it',
        effects: { looks: -5, happiness: -5 },
        outcomeText: 'You popped it, but it just got redder and angrier.',
        tone: 'bad'
      },
      {
        id: 'leave',
        text: 'Leave it alone',
        effects: { looks: -2, happiness: 2 },
        outcomeText: 'It looks bad, but you know it will heal faster.',
        tone: 'neutral'
      }
    ]
  },
  {
    id: 'child_lost_tooth',
    text: 'You lost your first tooth!',
    minAge: 5,
    maxAge: 7,
    weight: 100,
    tone: 'good',
    choices: [
      {
        id: 'pillow',
        text: 'Put it under pillow',
        effects: { money: 5, happiness: 10 },
        outcomeText: 'The tooth fairy left you some money!',
        tone: 'good'
      }
    ]
  },
  {
    id: 'teen_crush',
    text: 'Your crush looked at you in the hallway.',
    minAge: 13,
    maxAge: 18,
    weight: 60,
    tone: 'good',
    choices: [
      {
        id: 'smile',
        text: 'Smile back',
        effects: { happiness: 10 },
        outcomeText: 'They smiled back! Your heart is fluttering.',
        tone: 'good'
      },
      {
        id: 'look_away',
        text: 'Look away quickly',
        effects: { happiness: -5 },
        outcomeText: 'You panicked and pretended you didn\'t see them.',
        tone: 'bad'
      }
    ]
  },
  {
    id: 'child_bike',
    text: 'Your parents got you a bicycle.',
    minAge: 6,
    maxAge: 10,
    weight: 50,
    tone: 'good',
    choices: [
      {
        id: 'ride',
        text: 'Learn to ride',
        effects: { health: 5, happiness: 10 },
        outcomeText: 'You scraped your knee a few times, but you finally got the hang of it!',
        tone: 'good'
      }
    ]
  },
  {
    id: 'toddler_tantrum',
    text: 'Your parents refused to buy you candy at the store.',
    minAge: 2,
    maxAge: 4,
    weight: 80,
    tone: 'bad',
    choices: [
      {
        id: 'cry',
        text: 'Throw a tantrum',
        effects: { happiness: 5, smarts: -2 },
        outcomeText: 'You screamed until you were red in the face. They still said no.',
        tone: 'bad'
      },
      {
        id: 'accept',
        text: 'Accept it',
        effects: { smarts: 5 },
        outcomeText: 'You pouted, but moved on.',
        tone: 'neutral'
      }
    ]
  }
];

export function getEligibleEvents(character: Character): LifeEventDef[] {
  return eventRegistry.filter(e => character.age >= e.minAge && character.age <= e.maxAge);
}

export function drawYearlyEvents(character: Character, rng: RNG): LifeEventDef[] {
  const eligible = getEligibleEvents(character);
  if (eligible.length === 0) return [];

  // Determine how many events fire (0 to 2)
  const numEvents = rng.rangeInt(0, 2);
  const selected: LifeEventDef[] = [];
  
  // Weighted random selection
  for (let i = 0; i < numEvents; i++) {
    const totalWeight = eligible.reduce((sum, e) => sum + e.weight, 0);
    if (totalWeight === 0) break;

    let roll = rng.rangeInt(0, totalWeight - 1);
    for (const event of eligible) {
      if (roll < event.weight) {
        // Pick this one, avoid duplicates in same year
        if (!selected.find(s => s.id === event.id)) {
          selected.push(event);
        }
        break;
      }
      roll -= event.weight;
    }
  }

  return selected;
}
