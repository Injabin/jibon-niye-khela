export class RNG {
  private state: number;

  constructor(seed: number) {
    this.state = seed;
  }

  getState(): number {
    return this.state;
  }

  setState(state: number): void {
    this.state = state;
  }

  /** Returns [0, 1) */
  next(): number {
    this.state += 0x6D2B79F5;
    let t = this.state;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }

  /** Returns [min, max] integer inclusive */
  rangeInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /** Returns a random element from array */
  pick<T>(arr: T[]): T {
    if (arr.length === 0) throw new Error("Cannot pick from empty array");
    return arr[this.rangeInt(0, arr.length - 1)];
  }

  /** True with 'probability' chance (0.0 to 1.0) */
  chance(probability: number): boolean {
    return this.next() < probability;
  }
}
