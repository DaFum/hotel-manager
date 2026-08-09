import { describe, expect, it } from "vitest";
import {
  eligiblePromotions,
  promote,
  type KeyPerson,
} from "./careerProgression";

const person = (over: Partial<KeyPerson> = {}): KeyPerson => ({
  id: "person.1",
  staffId: "staff.1",
  role: "receptionist",
  experience: 80,
  leadership: 65,
  monthsInRole: 40,
  careerHistory: [],
  ...over,
});

describe("key staff careers", () => {
  it("promotes proven staff", () =>
    expect(
      eligiblePromotions({
        role: "receptionist",
        experience: 80,
        leadership: 65,
      }),
    ).toContain("front-office-manager"));

  it("keeps the record of how somebody got there", () => {
    const promoted = promote(person(), "front-office-manager", "1997-04-05");
    expect(promoted.role).toBe("front-office-manager");
    expect(promoted.monthsInRole).toBe(0);
    expect(promoted.careerHistory).toEqual([
      { role: "front-office-manager", dateKey: "1997-04-05" },
    ]);
    expect(() => promote(promoted, "hotel-director", "1997-05-05")).toThrow();
  });

  it("refuses scores that are not whole", () => {
    expect(() =>
      eligiblePromotions({
        role: "receptionist",
        experience: 80.5,
        leadership: 65,
      }),
    ).toThrow();
    expect(() =>
      eligiblePromotions({
        role: "receptionist",
        experience: 80,
        leadership: 200,
      }),
    ).toThrow();
  });
});
