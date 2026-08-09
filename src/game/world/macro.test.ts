import { expect, it } from "vitest";
import { advanceMacro, nextBounded } from "./macro";
it("caps macro moves", () => {
  expect(nextBounded(500, 900, 50)).toBe(550);
  expect(
    advanceMacro(
      { inflationBp: 200, interestBp: 400, unemploymentBp: 500, growthBp: 100 },
      { inflationBp: 5000, interestBp: 0, unemploymentBp: 0, growthBp: 1000 },
    ),
  ).toEqual({
    inflationBp: 250,
    interestBp: 325,
    unemploymentBp: 460,
    growthBp: 160,
  });
});
