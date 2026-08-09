import { describe, expect, it } from "vitest";
import { appendChronicleEntry, type ChronicleEntry } from "./chronicle";

const entry = (id: string, date: string): ChronicleEntry => ({
  id,
  date,
  scope: "company",
  textKey: `chronicle.${id}`,
});

describe("chronicle", () => {
  it("deduplicates and orders stable history", () => {
    const e = entry("1", "1997-01-01");
    expect(appendChronicleEntry([e], e)).toEqual([e]);
  });

  it("orders by date first and id second, whatever order entries arrive in", () => {
    const later = entry("a", "1999-06-30");
    const earlier = entry("z", "1991-01-01");
    const sameDayB = entry("b", "1997-04-05");
    const sameDayA = entry("a-second", "1997-04-05");

    let entries: ChronicleEntry[] = [];
    // Deliberately appended newest-first and with a same-day collision, so
    // the ordering contract is exercised rather than the insertion order.
    for (const next of [later, sameDayB, sameDayA, earlier])
      entries = appendChronicleEntry(entries, next);

    expect(entries.map((x) => x.id)).toEqual(["z", "a-second", "b", "a"]);
  });

  it("refuses an entry that could not be explained later", () => {
    expect(() =>
      appendChronicleEntry([], { ...entry("1", "1997-01-01"), id: "" }),
    ).toThrow();
    expect(() =>
      appendChronicleEntry([], { ...entry("1", "1997-01-01"), date: "" }),
    ).toThrow();
    expect(() =>
      appendChronicleEntry([], { ...entry("1", "1997-01-01"), textKey: "" }),
    ).toThrow();
  });
});
