import { describe, expect, it } from "vitest";
import { createFnbState } from "../../fnb/fnbState";
import frozenV8 from "../fixtures/save-v8.json";
import { migrateEnvelope, validateEnvelope } from "../saveSchema";
import type { SaveEnvelope } from "../saveVersions";
import { migrateV8ToV9 } from "./v8-to-v9";

const v8 = () => structuredClone(frozenV8) as unknown as SaveEnvelope;

describe("v8 to v9", () => {
  it("adds a complete F&B section without changing unrelated state", () => {
    const old = v8();
    const oldState = old.state as Record<string, unknown>;
    const next = migrateV8ToV9(old);
    const nextState = next.state as Record<string, unknown>;

    expect(next.saveVersion).toBe(9);
    expect(next.protocolVersion).toBe(old.protocolVersion);
    expect(nextState.fnb).toEqual(createFnbState());
    expect(nextState.company).toEqual(oldState.company);
    expect(nextState.finance).toEqual(oldState.finance);
    expect(validateEnvelope(migrateEnvelope(v8()))).toEqual([]);
  });

  it("repairs a malformed F&B section instead of spreading it through", () => {
    const old = v8();
    (old.state as Record<string, unknown>).fnb = {
      outlets: [{ id: "breakfastRoom", served: -1 }],
    };

    expect((migrateV8ToV9(old).state as Record<string, unknown>).fnb).toEqual(
      createFnbState(),
    );

    const current = migrateEnvelope(v8());
    const currentFnb = (
      current.state as { fnb: ReturnType<typeof createFnbState> }
    ).fnb;
    currentFnb.outlets[0].stockLeft = -1;
    expect(validateEnvelope(current)).toContain(
      "the state has no complete Plan 08 fnb",
    );

    currentFnb.outlets[0].stockLeft = 0;
    currentFnb.outlets[0].serviceUtilizationBp = 1_000_001;
    expect(validateEnvelope(current)).toContain(
      "the state has no complete Plan 08 fnb",
    );
  });

  it("preserves a complete non-trivial F&B section", () => {
    const old = v8();
    const fnb = createFnbState();
    fnb.outlets[0] = {
      ...fnb.outlets[0],
      demand: 20,
      capacity: 10,
      served: 10,
      waitlisted: 10,
      serviceThroughput: 30,
      stockLeft: 0,
      ingredientExpenseMinor: 4_500,
      averageWaitMinutes: 30,
      serviceUtilizationBp: 6_667,
      kitchenUtilizationBp: 6_667,
      cause: "facility.cause.stock",
    };
    (old.state as Record<string, unknown>).fnb = fnb;

    expect((migrateV8ToV9(old).state as Record<string, unknown>).fnb).toEqual(
      fnb,
    );
  });
});
