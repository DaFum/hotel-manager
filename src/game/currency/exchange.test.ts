import { expect, it } from "vitest";
import { convertMinor, exchangeRate } from "./exchange";
import { advanceCommonCurrency, settlementCurrency } from "./paths";
it("converts fixed-point minor units and branches common currency systemically", () => {
  expect(convertMinor(10000, 19550)).toBe(19550);
  expect(
    exchangeRate([{ from: "DEM", to: "USD", rateBasis: 6000 }], "USD", "DEM"),
  ).toBe(16667);
  const path = advanceCommonCurrency({
    id: "union",
    memberCurrencies: ["DEM"],
    coordinationBp: 7000,
    tradeIntegrationBp: 8000,
    publicSupportBp: 6000,
    active: false,
  });
  expect(settlementCurrency("DEM", path, "ECU")).toBe("ECU");
  expect(() => convertMinor(Number.MAX_SAFE_INTEGER, 20_000)).toThrow(
    /overflow/,
  );
  expect(() =>
    exchangeRate(
      [{ from: "DEM", to: "USD", rateBasis: Number.NaN }],
      "DEM",
      "USD",
    ),
  ).toThrow(/missing exchange rate/);
  expect(() =>
    advanceCommonCurrency({ ...path, coordinationBp: 10_001 }),
  ).toThrow(/coordination/);
});
