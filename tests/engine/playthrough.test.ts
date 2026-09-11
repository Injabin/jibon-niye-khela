import { describe, expect, it } from 'vitest';
import { useGameStore } from '@/lib/store/gameStore';
import type { Character, Tone } from '@/lib/engine/types';
import { SUBJECTS, type MajorField } from '@/lib/engine/events/categories/education';
import { SCHOOLS } from '@/content/education/schools';

const MAJORS = Object.keys(SUBJECTS) as MajorField[];
const SCHOOL_IDS = new Set(SCHOOLS.map((s) => s.id));
const TONES: Tone[] = ['good', 'bad', 'neutral', 'funny'];

interface Anomaly {
  seed: number;
  age: number;
  problem: string;
}

describe('bug-hunt playthrough (J) — many simulated lives under stress', () => {
  it('plays 30 lives without engine anomalies', { timeout: 120_000 }, () => {
    const anomalies: Anomaly[] = [];
    for (let seed = 1; seed <= 30; seed++) {
      try {
        simulateLife(seed, anomalies);
      } catch (err) {
        anomalies.push({
          seed,
          age: -1,
          problem: `life crashed: ${err instanceof Error ? err.message : String(err)}`,
        });
      }
    }

    const byProblem = new Map<string, number>();
    for (const a of anomalies) {
      const key = a.problem;
      byProblem.set(key, (byProblem.get(key) ?? 0) + 1);
    }
    const summary = [...byProblem.entries()]
      .map(([problem, count]) => `  ×${count}  ${problem}`)
      .sort()
      .join('\n');
    expect(anomalies, `anomalies across 30 lives:\n${summary}`).toEqual([]);
  });
});

function checkCharacter(c: Character, seed: number, anomalies: Anomaly[]): void {
  for (const [k, v] of Object.entries(c.stats)) {
    if (typeof v !== 'number') anomalies.push({ seed, age: c.age, problem: `stats.${k} not number: ${String(v)}` });
    else if (Number.isNaN(v)) anomalies.push({ seed, age: c.age, problem: `stats.${k} is NaN` });
  }
  if (typeof c.money !== 'number' || Number.isNaN(c.money)) {
    anomalies.push({ seed, age: c.age, problem: 'money is not a finite number' });
  }
  if (Number.isNaN(c.age) || c.age < 0) anomalies.push({ seed, age: c.age, problem: `age broken: ${c.age}` });
  if (c.education.gpa < 0 || c.education.gpa > 4 || Number.isNaN(c.education.gpa)) {
    anomalies.push({ seed, age: c.age, problem: `gpa out of range: ${c.education.gpa}` });
  }
  if (c.education.major && c.education.major !== '' && !MAJORS.includes(c.education.major as MajorField)) {
    anomalies.push({ seed, age: c.age, problem: `unknown major: ${c.education.major}` });
  }
  if (c.education.school && !SCHOOL_IDS.has(c.education.school.id)) {
    anomalies.push({ seed, age: c.age, problem: `unknown school id: ${c.education.school.id}` });
  }
  if (c.career.performance < 0 || c.career.performance > 100) {
    anomalies.push({ seed, age: c.age, problem: `career performance out of range: ${c.career.performance}` });
  }
  if (c.education.enrolled && c.education.stage === 'none') {
    anomalies.push({ seed, age: c.age, problem: 'enrolled but stage is none' });
  }

  const ids = new Set<string>();
  const spouses = c.relationships.filter((r) => r.relation === 'spouse');
  if (spouses.length > 1) anomalies.push({ seed, age: c.age, problem: `more than one living spouse (${spouses.length})` });
  for (const r of c.relationships) {
    if (!r.id) anomalies.push({ seed, age: c.age, problem: 'relationship without id' });
    else if (ids.has(r.id)) anomalies.push({ seed, age: c.age, problem: `duplicate relationship id: ${r.id}` });
    else ids.add(r.id);
    if (!r.name) anomalies.push({ seed, age: c.age, problem: `relationship ${r.id} without name` });
    if (r.meter < 0 || r.meter > 100 || Number.isNaN(r.meter)) {
      anomalies.push({ seed, age: c.age, problem: `relationship ${r.id} meter broken: ${r.meter}` });
    }
  }

  for (const h of c.history) {
    if (!h.text) anomalies.push({ seed, age: c.age, problem: 'history entry without text' });
    else if (!TONES.includes(h.tone)) anomalies.push({ seed, age: c.age, problem: `history tone invalid: ${h.tone}` });
    else if (h.text.includes('undefined') || h.text.includes('NaN')) {
      anomalies.push({ seed, age: c.age, problem: `history text has template leftovers: ${h.text.slice(0, 60)}` });
    }
  }

  if (c.flags.includes('in_jail') && c.career.jobId) {
    anomalies.push({ seed, age: c.age, problem: 'in jail but has a job' });
  }
}

function resolvePending(seed: number, anomalies: Anomaly[]): void {
  let guard = 0;
  while (useGameStore.getState().pendingEvents.length > 0 && guard < 24) {
    const { pendingEvents, currentEventIndex } = useGameStore.getState();
    const ev = pendingEvents[currentEventIndex];
    if (!ev) break;
    if (guard > 18) {
      anomalies.push({
        seed,
        age: useGameStore.getState().character?.age ?? -1,
        problem: `pending events looping: ${pendingEvents.map((e) => e.id).join(', ')} at idx ${currentEventIndex}`,
      });
      break;
    }
    const choice = ev.choices[0];
    if (!choice) break;
    useGameStore.getState().resolveCurrentChoice(choice.id);
    guard += 1;
  }
  if (useGameStore.getState().pendingEvents.length > 0) {
    const { pendingEvents } = useGameStore.getState();
    anomalies.push({
      seed,
      age: useGameStore.getState().character?.age ?? -1,
      problem: `pending events stuck after resolution: ${pendingEvents.map((e) => `${e.id}(${e.choices.map((c) => c.id).join('/')})`).join(' | ')}`,
    });
  }
}

function pokeOneIdle(seed: number, anomalies: Anomaly[]): void {
  const c = useGameStore.getState().character;
  if (!c || !c.alive) return;
  const s = useGameStore.getState();
  const action = Math.floor(Math.random() * 30);
  try {
    if (action === 0) s.studyHarder();
    else if (action === 1) s.hireTutor();
    else if (action === 2) s.skipClass();
    else if (action === 3) s.joinDebateClub();
    else if (action === 4) s.applyToSchool(SCHOOLS[Math.floor(Math.random() * SCHOOLS.length)].id);
    else if (action === 5 && c.education.enrolled === false && c.age >= 18) {
      const major = MAJORS[Math.floor(Math.random() * MAJORS.length)];
      s.enrollHigherEducation(Math.random() < 0.7 ? 'undergraduate' : 'vocational', major);
    } else if (action === 6) s.workOvertime();
    else if (action === 7) s.suckUpToBoss();
    else if (action === 8) s.askForRaise();
    else if (action === 9) s.doGymWorkout();
    else if (action === 10) s.watchMovie();
    else if (action === 11) s.prayOrWorship();
    else if (action === 12) s.visitKabiraj();
    else if (action === 13 && c.age >= 16) s.getDatingCandidates();
    else if (action === 14 && c.age >= 16) {
      const candidates = s.getDatingCandidates();
      if (candidates.length > 0) s.askOut(candidates[Math.floor(Math.random() * candidates.length)]);
    } else if (action === 15) {
      const partner = c.relationships.find((r) => r.relation === 'dating' || r.relation === 'crush');
      if (partner) s.makeOfficial(partner.id);
    } else if (action === 16) {
      const partner = c.relationships.find((r) => r.relation === 'partner');
      if (partner) s.propose(partner.id, Math.random() < 0.5 ? 'kazi_office' : 'community_center');
    } else if (action === 17) {
      const partner = c.relationships.find((r) => r.relation === 'partner' || r.relation === 'spouse');
      if (partner) s.haveBaby(partner.id);
    } else if (action === 18) {
      const partner = c.relationships.find((r) => r.relation === 'partner' || r.relation === 'spouse' || r.relation === 'dating');
      if (partner) s.datePartner(partner.id);
    } else if (action === 19) {
      const partner = c.relationships.find((r) => r.relation === 'partner' || r.relation === 'spouse' || r.relation === 'dating' || r.relation === 'crush');
      if (partner) s.giveGift(partner.id);
    } else if (action === 20) {
      const partner = c.relationships.find((r) => r.relation === 'partner' || r.relation === 'spouse');
      if (partner) s.breakupOrDivorce(partner.id);
    } else if (action === 21) {
      const partner = c.relationships.find((r) => r.relation === 'partner' || r.relation === 'spouse');
      if (partner) s.cheat(partner.id);
    } else if (action === 22) {
      const ex = c.relationships.find((r) => r.relation === 'ex');
      if (ex) s.callEx(ex.id);
    } else if (action === 23) {
      const ex = c.relationships.find((r) => r.relation === 'ex');
      if (ex) s.hookupEx(ex.id);
    } else if (action === 24) {
      const ex = c.relationships.find((r) => r.relation === 'ex');
      if (ex) s.reuniteEx(ex.id);
    } else if (action === 25) {
      const ex = c.relationships.find((r) => r.relation === 'ex');
      if (ex) s.insultEx(ex.id);
    } else if (action === 26) s.buyAsset(['car', 'home', 'jewelry', 'collectible', 'stock', 'crypto'][Math.floor(Math.random() * 6)] as never);
    else if (action === 27) s.doSideHustle(['tuition', 'delivery', 'street_vendor'][Math.floor(Math.random() * 3)] as never);
    else if (action === 28) s.commitCrime(['pickpocket', 'shoplift', 'burglary', 'street_fight', 'gambling', 'smuggling', 'fraud'][Math.floor(Math.random() * 6)] as never);
    else if (action === 29) {
      const aliveRel = c.relationships.find((r) => r.alive);
      if (aliveRel) s.interactWithPerson(aliveRel.id, ['chat', 'spend_time', 'gift', 'compliment', 'insult'][Math.floor(Math.random() * 5)] as never);
    }
  } catch (err) {
    anomalies.push({ seed, age: c.age, problem: `idle action threw: ${err instanceof Error ? err.message : String(err)}` });
  }
}

function simulateLife(seed: number, anomalies: Anomaly[]): Character {
  localStorage.clear();
  useGameStore.getState().resetGame();
  useGameStore.setState({ isHydrated: true });
  useGameStore.getState().newGame(seed);

  let last = useGameStore.getState().character;
  if (!last) throw new Error('no character after newGame');

  for (let year = 0; year < 95; year++) {
    const st = useGameStore.getState();
    if (!st.character || !st.character.alive) break;

    resolvePending(seed, anomalies);

    const pokes = 1 + Math.floor(Math.random() * 2);
    for (let p = 0; p < pokes; p++) pokeOneIdle(seed, anomalies);
    resolvePending(seed, anomalies);

    const before = useGameStore.getState().character;
    useGameStore.getState().ageUp();
    const after = useGameStore.getState().character;
    if (before && after && before.alive && after.alive) {
      if (after.age !== before.age + 1) {
        anomalies.push({ seed, age: after.age, problem: `age jumped from ${before.age} to ${after.age}` });
      }
    }
    resolvePending(seed, anomalies);

    const cur = useGameStore.getState().character;
    if (cur) checkCharacter(cur, seed, anomalies);
    last = cur ?? last;
  }
  return last;
}