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
      { id: 'cry', text: 'Throw a tantrum', effects: { happiness: 5, smarts: -2 }, outcomeText: 'You screamed until you were red in the face. They still said no.', tone: 'bad' },
      { id: 'accept', text: 'Accept it', effects: { smarts: 5 }, outcomeText: 'You pouted, but moved on.', tone: 'neutral' }
    ]
  },
  {
    id: 'adult_tax_audit',
    text: 'You received a letter from the government. You are being audited.',
    minAge: 22,
    maxAge: 65,
    weight: 40,
    tone: 'bad',
    choices: [
      { id: 'cooperate', text: 'Cooperate fully', effects: { money: -500, happiness: -10 }, outcomeText: 'It took hours of paperwork and cost you some fines, but you survived.', tone: 'neutral' },
      { id: 'hide', text: 'Try to hide assets', effects: { money: -2000, happiness: -20, smarts: -5 }, outcomeText: 'They caught your lies and fined you heavily.', tone: 'bad' }
    ]
  },
  {
    id: 'adult_office_romance',
    text: 'A coworker you find attractive asked you out for drinks.',
    minAge: 20,
    maxAge: 55,
    weight: 50,
    tone: 'neutral',
    choices: [
      { id: 'go', text: 'Go for it', effects: { happiness: 15, looks: 5 }, outcomeText: 'You had a great time, but office gossip has started.', tone: 'good' },
      { id: 'decline', text: 'Keep it professional', effects: { smarts: 5 }, outcomeText: 'You declined politely. Work remains peaceful.', tone: 'neutral' }
    ]
  },
  {
    id: 'adult_lottery',
    text: 'You found a $100 bill on the sidewalk!',
    minAge: 18,
    maxAge: 100,
    weight: 20,
    tone: 'good',
    choices: [
      { id: 'keep', text: 'Keep it', effects: { money: 100, happiness: 10 }, outcomeText: 'Finder\'s keepers!', tone: 'good' },
      { id: 'donate', text: 'Donate it', effects: { happiness: 15, smarts: 2 }, outcomeText: 'You gave it to a local shelter. You feel amazing.', tone: 'good' }
    ]
  },
  {
    id: 'senior_back_pain',
    text: 'You woke up with severe lower back pain.',
    minAge: 55,
    maxAge: 80,
    weight: 70,
    tone: 'bad',
    choices: [
      { id: 'doctor', text: 'Go to the doctor', effects: { health: 5, money: -200 }, outcomeText: 'The doctor gave you some stretches to do. It costs money, but helps.', tone: 'neutral' },
      { id: 'ignore', text: 'Ignore it', effects: { health: -15, happiness: -10 }, outcomeText: 'The pain got worse and ruined your week.', tone: 'bad' }
    ]
  },
  {
    id: 'senior_scam',
    text: 'Someone called claiming to be your grandson needing bail money.',
    minAge: 65,
    maxAge: 100,
    weight: 50,
    tone: 'bad',
    choices: [
      { id: 'pay', text: 'Send the money', effects: { money: -1000, happiness: -15, smarts: -5 }, outcomeText: 'You got scammed! You feel foolish and poorer.', tone: 'bad' },
      { id: 'hangup', text: 'Hang up', effects: { smarts: 5, happiness: 5 }, outcomeText: 'You recognized the scam and hung up immediately.', tone: 'good' }
    ]
  },
  {
    id: 'adult_promotion_offer',
    text: 'Your boss offered you a new role. It pays more but means longer hours.',
    minAge: 25,
    maxAge: 50,
    weight: 40,
    tone: 'neutral',
    choices: [
      { id: 'accept', text: 'Accept it', effects: { money: 2000, happiness: -10, health: -5 }, outcomeText: 'You took the job. The money is great, but you are exhausted.', tone: 'neutral' },
      { id: 'decline', text: 'Decline', effects: { happiness: 10 }, outcomeText: 'You prioritized your work-life balance.', tone: 'good' }
    ]
  },
  {
    id: 'senior_hobby',
    text: 'You have a lot of free time now. Want to pick up a hobby?',
    minAge: 60,
    maxAge: 90,
    weight: 60,
    tone: 'good',
    choices: [
      { id: 'garden', text: 'Start gardening', effects: { health: 10, happiness: 15, money: -50 }, outcomeText: 'You grew beautiful tomatoes and got some fresh air.', tone: 'good' },
      { id: 'tv', text: 'Watch TV', effects: { health: -5, happiness: 5 }, outcomeText: 'You binge-watched five seasons of a soap opera.', tone: 'neutral' }
    ]
  },
  {
    id: 'midlife_crisis',
    text: 'You are hit by a sudden, intense feeling of a midlife crisis.',
    minAge: 40,
    maxAge: 50,
    weight: 30,
    tone: 'bad',
    choices: [
      { id: 'car', text: 'Buy a sports car', effects: { money: -20000, happiness: 20, looks: 10 }, outcomeText: 'You bought a flashy car. It was expensive, but you feel young again!', tone: 'funny' },
      { id: 'therapy', text: 'Go to therapy', effects: { money: -1000, happiness: 15, smarts: 5 }, outcomeText: 'You worked through your feelings constructively.', tone: 'good' },
      { id: 'ignore', text: 'Bottle it up', effects: { happiness: -25, health: -5 }, outcomeText: 'You ignored it, and the existential dread grew heavier.', tone: 'bad' }
    ]
  },
  {
    id: 'adult_invest',
    text: 'A friend has a "guaranteed" crypto investment opportunity.',
    minAge: 20,
    maxAge: 40,
    weight: 60,
    tone: 'neutral',
    choices: [
      { id: 'invest', text: 'Invest $1000', effects: { money: -1000, happiness: -10, smarts: -5 }, outcomeText: 'It was a rug pull. You lost all your money.', tone: 'bad' },
      { id: 'pass', text: 'Pass on it', effects: { smarts: 5, happiness: 5 }, outcomeText: 'You trusted your gut and saved your cash.', tone: 'good' }
    ]
  },
  {
    id: 'adult_stray_pet',
    text: 'A stray cat followed you home.',
    minAge: 18,
    maxAge: 80,
    weight: 50,
    tone: 'good',
    choices: [
      { id: 'keep', text: 'Keep it', effects: { happiness: 20, money: -200 }, outcomeText: 'You adopted the cat! It costs money for food, but brings you joy.', tone: 'good' },
      { id: 'shelter', text: 'Take to shelter', effects: { happiness: 5 }, outcomeText: 'You made sure it found a safe place.', tone: 'neutral' }
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
