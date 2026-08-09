import { describe, expect, it } from "vitest";
import {
  decideEscalation,
  escalationReason,
  raiseEscalation,
  resolveEscalation,
} from "./escalation";
import { createManagerAuthority } from "./managerAuthority";

const AUTHORITY = createManagerAuthority({ repairLimitMinor: 5_000_000 });

describe("manager escalation", () => {
  it("escalates spending above the manager limit", () => {
    expect(
      decideEscalation(AUTHORITY, { kind: "repair", amountMinor: 5_000_001 }),
    ).toBe("escalate");
  });

  it("allows spending up to the limit", () => {
    expect(
      decideEscalation(AUTHORITY, { kind: "repair", amountMinor: 5_000_000 }),
    ).toBe("allow");
  });

  it("always escalates a decision the group never delegates", () => {
    expect(decideEscalation(AUTHORITY, { kind: "sell-hotel" })).toBe(
      "escalate",
    );
    expect(
      decideEscalation(
        createManagerAuthority({ repairLimitMinor: Number.MAX_SAFE_INTEGER }),
        { kind: "sell-hotel" },
      ),
    ).toBe("escalate");
  });

  it("checks each kind of decision against its own limit", () => {
    const authority = createManagerAuthority({
      repairLimitMinor: 5_000_000,
      capexLimitMinor: 0,
      recoveryLimitMinor: 20_000,
      mayHire: false,
      mayReprice: true,
    });
    expect(decideEscalation(authority, { kind: "capex", amountMinor: 1 })).toBe(
      "escalate",
    );
    expect(
      decideEscalation(authority, { kind: "recovery", amountMinor: 20_000 }),
    ).toBe("allow");
    expect(
      decideEscalation(authority, { kind: "recovery", amountMinor: 20_001 }),
    ).toBe("escalate");
    expect(
      decideEscalation(authority, { kind: "hire", monthlyWageMinor: 300_000 }),
    ).toBe("escalate");
    expect(
      decideEscalation(authority, { kind: "reprice", rateMinor: 18_000 }),
    ).toBe("allow");
  });

  it("escalates a negative amount instead of treating it as within limits", () => {
    expect(
      decideEscalation(AUTHORITY, { kind: "repair", amountMinor: -1 }),
    ).toBe("escalate");
  });

  it("names why a decision was escalated so the group can answer it", () => {
    expect(
      escalationReason(AUTHORITY, { kind: "repair", amountMinor: 6_000_000 }),
    ).toBe("repair of 6000000 exceeds the 5000000 repair limit");
    expect(escalationReason(AUTHORITY, { kind: "sell-hotel" })).toBe(
      "selling a hotel is never delegated",
    );
    expect(
      escalationReason(AUTHORITY, { kind: "repair", amountMinor: 1 }),
    ).toBeNull();
  });

  it("keeps an escalation open until the group answers it", () => {
    const raised = raiseEscalation([], {
      id: "escalation.1",
      hotelId: "hotel.frankfurt.1",
      managerId: "manager.1",
      raisedAtMinutes: 1440,
      decision: { kind: "repair", amountMinor: 6_000_000 },
      reason: "repair of 6000000 exceeds the 5000000 repair limit",
    });
    expect(raised[0].status).toBe("open");
    const approved = resolveEscalation(
      raised,
      "escalation.1",
      "approved",
      2880,
    );
    expect(approved[0].status).toBe("approved");
    expect(approved[0].resolvedAtMinutes).toBe(2880);
    expect(() =>
      resolveEscalation(approved, "escalation.1", "rejected", 4320),
    ).toThrow(/already/);
  });

  it("refuses to raise the same escalation twice", () => {
    const entry = {
      id: "escalation.1",
      hotelId: "hotel.frankfurt.1",
      managerId: "manager.1",
      raisedAtMinutes: 1440,
      decision: { kind: "sell-hotel" as const },
      reason: "selling a hotel is never delegated",
    };
    expect(() => raiseEscalation(raiseEscalation([], entry), entry)).toThrow(
      /already/,
    );
  });

  it("refuses to resolve an escalation nobody raised", () => {
    expect(() =>
      resolveEscalation([], "escalation.404", "approved", 1),
    ).toThrow(/unknown/);
  });
});
