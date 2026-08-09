import { expect, it } from "vitest";
import { marketWageMinor, vacancies, wagePressureBp } from "./market";

it("raises wages when vacancies exceed labor supply", () => {
  expect(wagePressureBp(200, 100)).toBeGreaterThan(10000);
});

it("relieves wages when a city has more workers than posts", () => {
  expect(wagePressureBp(50, 200)).toBeLessThan(10000);
});

it("never lets a single boom or bust price labor out of the market", () => {
  expect(wagePressureBp(10_000, 1)).toBe(15000);
  expect(wagePressureBp(0, 10_000)).toBe(7500);
  // A city with no workers at all still has to quote a wage.
  expect(wagePressureBp(10, 0)).toBe(15000);
});

it("prices a post at the pressure the city is under", () => {
  expect(marketWageMinor(200_000, 12000)).toBe(240_000);
  expect(marketWageMinor(200_000, 10000)).toBe(200_000);
});

it("rejects a base wage that is not whole positive Pfennig", () => {
  for (const wage of [0, -1, 1.5])
    expect(() => marketWageMinor(wage, 10000)).toThrow(/wage/);
});

it("counts every hotel's open posts against the city's workers", () => {
  expect(
    vacancies([
      { posts: 20, staffed: 14 },
      { posts: 10, staffed: 10 },
    ]),
  ).toBe(6);
  // An overstaffed house does not create phantom vacancies elsewhere.
  expect(vacancies([{ posts: 5, staffed: 9 }])).toBe(0);
});

it("rejects non-integer counts and out-of-band pressure", () => {
  for (const value of [-1, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
    expect(() => wagePressureBp(value, 10)).toThrow(/vacancies/);
    expect(() => wagePressureBp(10, value)).toThrow(/workers/);
  }
  expect(() => vacancies([{ posts: 1.5, staffed: 1 }])).toThrow(/posts/);
  expect(() => vacancies([{ posts: 1, staffed: -1 }])).toThrow(/staffed/);
  for (const pressure of [7499, 15001, 10000.5])
    expect(() => marketWageMinor(200_000, pressure)).toThrow(/pressure/);
});
