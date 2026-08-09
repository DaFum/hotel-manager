export class XorShift32 {
  constructor(public state: number) {
    this.state = state >>> 0 || 0x9e3779b9;
  }
  nextUint32() {
    let x = this.state;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    this.state = x >>> 0;
    return this.state;
  }
  nextFloat() {
    return this.nextUint32() / 0x1_0000_0000;
  }
}
const mix = (seed: number, salt: number) =>
  ((seed >>> 0) ^ Math.imul(salt, 0x9e3779b1)) >>> 0;
export function createRngStreams(seed: number) {
  return {
    guests: new XorShift32(mix(seed, 1)),
    staffing: new XorShift32(mix(seed, 2)),
    failures: new XorShift32(mix(seed, 3)),
    economy: new XorShift32(mix(seed, 4)),
    events: new XorShift32(mix(seed, 5)),
    weather: new XorShift32(mix(seed, 6)),
    AI: new XorShift32(mix(seed, 7)),
    narrative: new XorShift32(mix(seed, 8)),
  };
}

export type RngStreamName = keyof ReturnType<typeof createRngStreams>;
export type RngStateRecord = Record<RngStreamName, number>;

/** Rehydrates every stream from a save so replays continue bit-for-bit. */
export function restoreRngStreams(state: RngStateRecord) {
  return {
    guests: new XorShift32(state.guests),
    staffing: new XorShift32(state.staffing),
    failures: new XorShift32(state.failures),
    economy: new XorShift32(state.economy),
    events: new XorShift32(state.events),
    weather: new XorShift32(state.weather),
    AI: new XorShift32(state.AI),
    narrative: new XorShift32(state.narrative),
  };
}

export function captureRngState(
  streams: ReturnType<typeof createRngStreams>,
): RngStateRecord {
  return Object.fromEntries(
    Object.entries(streams).map(([k, v]) => [k, v.state]),
  ) as RngStateRecord;
}
