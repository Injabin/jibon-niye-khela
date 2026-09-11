/**
 * Finance engine (DESIGN.md §5.5, F — Phase 3.5).
 *
 * Savings pay simple yearly interest; loans accrue simple interest on their
 * outstanding balance and flip the `has_debt` content flag; bankruptcy is
 * available only to the insolvent — assets are liquidated at a firesale, the
 * remainder is written off, and new borrowing is blocked for a stretch; and a
 * will liquidates the estate to cash (money + savings + assets − debts,
 * floored at zero: debt is never inherited). All state changes are pure and
 * deterministic; nothing here consumes RNG except minting loan ids.
 */

import type { RNG } from '@/lib/engine/rng';
import { MONEY_MAX, MONEY_MIN, clamp } from '@/lib/engine/stats';
import type { Character, FinanceState, LoanKind, Tone } from '@/lib/engine/types';

export const SAVINGS_RATE = 0.04;
export const BANKRUPTCY_FIRESALE = 0.6;
export const BANKRUPTCY_BLOCK_YEARS = 7;
/** Fixed quick-amount the UI offers for the savings deposit/withdraw buttons. */
export const QUICK_BANK_AMOUNT = 5_000;

export const LOAN_KIND_LABELS: Record<LoanKind, string> = {
  personal: 'ব্যক্তিগত ঋণ',
  student: 'শিক্ষা ঋণ',
  home: 'বাসা/জমি ঋণ',
  business: 'ব্যবসার ঋণ',
};

const LOAN_RATES: Record<LoanKind, number> = {
  personal: 0.08,
  student: 0.06,
  home: 0.07,
  business: 0.1,
};

export interface FinanceOutcome {
  text: string;
  tone: Tone;
}

export interface FinanceActionResult extends FinanceOutcome {
  ok: boolean;
}

export function defaultFinance(): FinanceState {
  return { savings: 0, savingsRate: SAVINGS_RATE, loans: [], bankruptcies: 0 };
}

/** Access the finance block, defaulting it in place for characters from older saves. */
export function getFinance(character: Character): FinanceState {
  if (!character.finance) character.finance = defaultFinance();
  return character.finance;
}

/** Liquid net worth: cash + savings + asset values − outstanding loans. */
export function netWorth(character: Character): number {
  const fin = character.finance ?? defaultFinance();
  const assetValue = character.assets.reduce((sum, a) => sum + a.value, 0);
  const debt = fin.loans.reduce((sum, l) => sum + l.balance, 0);
  return Math.floor(character.money + fin.savings + assetValue - debt);
}

function loanId(rng: RNG): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 8; i++) {
    id += chars[rng.rangeInt(0, chars.length - 1)];
  }
  return id;
}

function setFlag(character: Character, flag: string): void {
  if (!character.flags.includes(flag)) character.flags.push(flag);
}

function removeFlag(character: Character, flag: string): void {
  character.flags = character.flags.filter((f) => f !== flag);
}

/** `has_debt` mirrors the finance position: outstanding loans or a negative balance. */
function syncDebtFlag(character: Character): void {
  const fin = character.finance ?? defaultFinance();
  const owes = fin.loans.length > 0 || character.money < 0;
  if (owes) setFlag(character, 'has_debt');
  else removeFlag(character, 'has_debt');
}

export function depositSavings(character: Character, amount: number): FinanceActionResult {
  const cash = Math.floor(amount);
  if (!character.alive) return { ok: false, text: 'ইহকালের ব্যাংক লেনদেন এহন অচল।', tone: 'neutral' };
  if (cash <= 0 || character.money < cash) {
    return { ok: false, text: `জমানোর মতো ${cash.toLocaleString()} ট্যাকা পকেটে নাই!`, tone: 'neutral' };
  }
  const fin = getFinance(character);
  character.money -= cash;
  fin.savings = clamp(fin.savings + cash, 0, MONEY_MAX);
  return { ok: true, text: `ব্যাংকে ${cash.toLocaleString()} ট্যাকা জমা রাখলা — সঞ্চয়ে সুদের ফুল ফুটতে লাগলো।`, tone: 'good' };
}

export function withdrawSavings(character: Character, amount: number): FinanceActionResult {
  const cash = Math.floor(amount);
  if (!character.alive) return { ok: false, text: 'ইহকালের ব্যাংক লেনদেন এহন অচল।', tone: 'neutral' };
  if (cash <= 0) return { ok: false, text: 'তোলার অংকটা তো ঠিক নাই!', tone: 'neutral' };
  const fin = getFinance(character);
  if (fin.savings < cash) {
    return {
      ok: false,
      text: `ব্যাংকে জমা আচে মাত্র ${fin.savings.toLocaleString()} ট্যাকা — ${cash.toLocaleString()} ট্যাকা এহনো তোলা যাইবো না!`,
      tone: 'neutral',
    };
  }
  fin.savings = Math.max(0, fin.savings - cash);
  character.money = clamp(character.money + cash, MONEY_MIN, MONEY_MAX);
  return { ok: true, text: `ব্যাংক থেকে ${cash.toLocaleString()} ট্যাকা তুললা — পকেটে ট্যাকা উলটাইয়া আইলো!`, tone: 'good' };
}

export function takeLoan(
  character: Character,
  rng: RNG,
  amount: number,
  kind: LoanKind = 'personal',
): FinanceActionResult {
  const sum = Math.floor(amount);
  if (!character.alive) return { ok: false, text: 'মৃতব্যক্তি আর ধার নিতে পারে না।', tone: 'neutral' };
  if (sum <= 0) return { ok: false, text: 'কত ট্যাকা ধার নিবা? ঠিক কইরা বোলো!', tone: 'neutral' };
  const fin = getFinance(character);
  if (fin.bankruptcyBlockUntilAge !== undefined && character.age < fin.bankruptcyBlockUntilAge) {
    return {
      ok: false,
      text: `দেউলিয়া ঘোষণার কালিমা মাথায় — ব্যাংকগুলো তোকে আর ${fin.bankruptcyBlockUntilAge - character.age} বছর ধার দিবে না!`,
      tone: 'bad',
    };
  }
  character.money = clamp(character.money + sum, MONEY_MIN, MONEY_MAX);
  fin.loans.push({
    id: loanId(rng),
    kind,
    principal: sum,
    balance: sum,
    rate: LOAN_RATES[kind],
    takenAge: character.age,
  });
  syncDebtFlag(character);
  return {
    ok: true,
    text: `${LOAN_KIND_LABELS[kind]} হিসেবে ব্যাংক থেকে ${sum.toLocaleString()} ট্যাকা ধার লইলা — সোদে চুকাইতে হইবো, খেয়াল রাখো!`,
    tone: 'neutral',
  };
}

export function repayLoan(character: Character, loanIdToPay: string, amount?: number): FinanceActionResult {
  if (!character.alive) return { ok: false, text: 'মৃতব্যক্তি আর ঋণ শোধ করতে পারে না।', tone: 'neutral' };
  const fin = getFinance(character);
  const loan = fin.loans.find((l) => l.id === loanIdToPay);
  if (!loan) return { ok: false, text: 'এই ধার তো তোমার খাতায়ই নাই!', tone: 'neutral' };
  const toward = amount === undefined ? loan.balance : Math.floor(amount);
  if (toward <= 0) return { ok: false, text: 'শোধের অংকটা তো ঠিক নাই!', tone: 'neutral' };
  if (character.money < toward) {
    return {
      ok: false,
      text: `এখনো হাতে ${toward.toLocaleString()} ট্যাকা নাই — কিস্তি আপাতত মুলতুবি!`,
      tone: 'neutral' as const,
    };
  }
  character.money -= toward;
  loan.balance = Math.max(0, loan.balance - toward);
  if (loan.balance === 0) {
    fin.loans = fin.loans.filter((l) => l.id !== loanIdToPay);
  }
  syncDebtFlag(character);
  return {
    ok: true,
    text: `ব্যাংকের ধার খাতায় ${toward.toLocaleString()} ট্যাকা শোধ করলা — ঋণের বোঝাটা হালকা হইলো!`,
    tone: 'good',
  };
}

/**
 * Bankruptcy discharge (DESIGN.md §5.2): only the truly insolvent qualify.
 * Assets sell at a firesale discount, every resource goes to the creditors,
 * the unrecoverable remainder is written off, and new borrowing is blocked.
 */
export function declareBankruptcy(character: Character): FinanceActionResult {
  if (!character.alive) return { ok: false, text: 'মৃতব্যক্তি আর দেউলিয়া ঘোষণা দিতে পারে না।', tone: 'neutral' };
  if (netWorth(character) >= 0) {
    return {
      ok: false,
      text: 'ট্যাকা-সম্পদ তো এখনো আছে — এই অবস্থায় আদালতে দেউলিয়া ঘোষণা মাইনা নিবে না!',
      tone: 'neutral',
    };
  }

  const fin = getFinance(character);
  let realized = 0;
  for (const asset of character.assets) {
    realized += Math.floor(asset.value * BANKRUPTCY_FIRESALE);
  }
  character.assets = [];
  fin.savings = 0;
  character.money = 0;
  fin.loans = [];

  fin.bankruptcies += 1;
  fin.bankruptcyBlockUntilAge = character.age + BANKRUPTCY_BLOCK_YEARS;
  setFlag(character, 'bankrupt');
  syncDebtFlag(character);
  character.reputation.fame = clamp(character.reputation.fame - 10);
  character.reputation.karma = clamp(character.reputation.karma - 10);

  return {
    ok: true,
    tone: 'bad',
    text: `দেউলিয়া ঘোষণা দিলা! আদালতে দিবানালি ম্যানেজার সম্পত্তি সাউজ করে ${realized.toLocaleString()} ট্যাকা আদায় করলো; বাকি ধার পুরাই মাফ। ${BANKRUPTCY_BLOCK_YEARS} বছর ব্যাংকগুলো তোর দিকে কী-ই বা মুখ তুলে চাইবে...`,
  };
}

/**
 * Yearly finance maintenance: savings earn their rate and every outstanding
 * loan accrues its annual interest. Quiet by default (like assets).
 */
export function tickFinance(character: Character): FinanceOutcome | null {
  if (!character.alive) return null;
  const fin = getFinance(character);

  if (fin.savings > 0) {
    const interest = Math.floor(fin.savings * fin.savingsRate);
    fin.savings = clamp(fin.savings + interest, 0, MONEY_MAX);
  }

  for (const loan of fin.loans) {
    const interest = Math.floor(loan.balance * loan.rate);
    loan.balance = clamp(loan.balance + interest, 0, MONEY_MAX);
  }

  return null;
}

/**
 * The will's settlement: liquidate everything into a cash estate —
 * money + savings + asset values − outstanding loans, floored at zero so
 * debts die with the debtor (never inherited). Assets are sold at market
 * value; the survivors get cash only (F locked decision).
 */
export function liquidateEstate(character: Character): number {
  const fin = character.finance ?? defaultFinance();
  const assetValue = character.assets.reduce((sum, a) => sum + a.value, 0);
  const debt = fin.loans.reduce((sum, l) => sum + l.balance, 0);
  return Math.max(0, Math.floor(character.money + fin.savings + assetValue - debt));
}