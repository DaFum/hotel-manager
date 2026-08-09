import { expect, it } from "vitest";
import { leadingStandard, networkValueBp } from "./standards";
it("values participation and resolves equal standards by stable id", () => {
  expect(networkValueBp(7000, 6000)).toBeGreaterThan(
    networkValueBp(2000, 2000),
  );
  expect(
    leadingStandard([
      {
        id: "b",
        hotelAdoptionBp: 5000,
        guestAdoptionBp: 5000,
        compatibleWith: [],
      },
      {
        id: "a",
        hotelAdoptionBp: 5000,
        guestAdoptionBp: 5000,
        compatibleWith: [],
      },
    ])?.id,
  ).toBe("a");

  expect(() => networkValueBp(-1, 1000)).toThrow(/0..10000/);
  expect(() => networkValueBp(1000, Number.NaN)).toThrow(/0..10000/);
});
