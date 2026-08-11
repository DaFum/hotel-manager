import { describe, expect, it } from "vitest";
import {
  authorizeRecovery,
  complaintForWait,
  resolveComplaint,
} from "./complaints";

describe("complaints", () => {
  it("creates long checkin complaint after twenty minutes", () => {
    expect(complaintForWait("p1", 21)?.cause).toBe("longCheckIn");
    expect(complaintForWait("p1", 20)).toBeNull();
  });

  it("apology recovery is free and lifts satisfaction slightly", () => {
    expect(
      resolveComplaint(
        { cause: "longCheckIn", satisfaction: 50 },
        "apologize",
        10000,
      ),
    ).toEqual({ expenseMinor: 0, satisfaction: 55 });
  });

  it("discount recovery costs ten percent of room charge and improves satisfaction", () => {
    expect(
      resolveComplaint(
        { cause: "longCheckIn", satisfaction: 50 },
        "discount10",
        10000,
      ),
    ).toEqual({ expenseMinor: 1000, satisfaction: 65 });
  });

  it("authorizes the same discount amount that resolution posts", () => {
    const authorized = authorizeRecovery("discount10", 12345, {
      frontDeskOnDuty: 1,
      cashMinor: 5000,
    });
    const resolved = resolveComplaint(
      { cause: "longCheckIn", satisfaction: 50 },
      "discount10",
      12345,
    );
    expect(authorized).toEqual({ ok: true, costMinor: resolved.expenseMinor });
  });

  it("returns structured causes when recovery cannot be authorized", () => {
    expect(
      authorizeRecovery("discount10", 10000, {
        frontDeskOnDuty: 0,
        cashMinor: 10000,
      }),
    ).toEqual({
      ok: false,
      cause: "alert.recovery.noFrontDesk",
      causeValues: { frontDeskOnDuty: 0 },
    });
    expect(
      authorizeRecovery("discount10", 10000, {
        frontDeskOnDuty: 1,
        cashMinor: 999,
      }),
    ).toEqual({
      ok: false,
      cause: "alert.recovery.insufficientCash",
      causeValues: { cashMinor: 999, costMinor: 1000 },
    });
  });

  it("never pushes satisfaction above the scale maximum", () => {
    expect(
      resolveComplaint(
        { cause: "longCheckIn", satisfaction: 95 },
        "discount10",
        10000,
      ).satisfaction,
    ).toBe(100);
  });
});
