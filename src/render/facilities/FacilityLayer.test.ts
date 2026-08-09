import { expect, it } from "vitest";
import { barFill, loadBand, BAR_WIDTH } from "./FacilityLayer";

it("bands load into quiet, busy and over capacity", () => {
  expect(loadBand(10, 100)).toBe("quiet");
  expect(loadBand(85, 100)).toBe("busy");
  expect(loadBand(140, 100)).toBe("over");
  // A facility with no capacity at all is over capacity the moment it is used.
  expect(loadBand(1, 0)).toBe("over");
  expect(loadBand(0, 0)).toBe("quiet");
});

it("never draws a bar past its own track", () => {
  expect(barFill(50, 100)).toBe(BAR_WIDTH / 2);
  expect(barFill(300, 100)).toBe(BAR_WIDTH);
  expect(barFill(0, 100)).toBe(0);
});
