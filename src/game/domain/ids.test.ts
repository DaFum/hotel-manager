import { describe, expect, it } from "vitest";
import { compareIds, orderedKeys } from "./ids";

describe("authoritative ids", () => {
  it("orders record keys with the locale-independent id comparator", () => {
    const records = {
      "hotel.zurich.1": true,
      "hotel.frankfurt.10": true,
      "hotel.frankfurt.2": true,
    };

    expect(orderedKeys(records)).toEqual(Object.keys(records).sort(compareIds));
  });
});
