export interface MacroState {
  inflationBp: number;
  interestBp: number;
  unemploymentBp: number;
  growthBp: number;
  energyPriceIndexBp: number;
}
export function nextBounded(
  current: number,
  target: number,
  maxMove: number,
): number {
  if (![current, target, maxMove].every(Number.isSafeInteger) || maxMove < 0)
    throw new Error("invalid macro transition");
  const delta = target - current;
  return current + Math.sign(delta) * Math.min(Math.abs(delta), maxMove);
}
export function advanceMacro(
  state: MacroState,
  targets: MacroState,
): MacroState {
  return {
    inflationBp: nextBounded(state.inflationBp, targets.inflationBp, 50),
    interestBp: nextBounded(state.interestBp, targets.interestBp, 75),
    unemploymentBp: nextBounded(
      state.unemploymentBp,
      targets.unemploymentBp,
      40,
    ),
    growthBp: nextBounded(state.growthBp, targets.growthBp, 60),
    energyPriceIndexBp: nextBounded(
      state.energyPriceIndexBp,
      targets.energyPriceIndexBp,
      100,
    ),
  };
}
