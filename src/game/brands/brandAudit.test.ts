import { describe, expect, it } from "vitest";
import {
  auditBrand,
  brandDemandUpliftBp,
  REMEDIATION_GRACE_DAYS,
  recordAudit,
  scheduleRemediation,
} from "./brandAudit";
import { assignBrand, createBrand, registerBrand } from "./brandTypes";
import { shouldRemoveBrand } from "../company/companyMonth";

const STANDARD = {
  minRoomQuality: 70,
  requiredFacilities: ["facility.breakfast_room"],
};

describe("brand audit", () => {
  it("waits for an uninterrupted failed audit's remediation deadline", () => {
    const failed = recordAudit({
      hotelId: "hotel.1",
      brandId: "brand.1",
      dateKey: "1991-01-01",
      result: { compliant: false, failures: ["quality"] },
    });
    const compliant = {
      ...failed,
      dateKey: "1991-02-01",
      compliant: true,
      failures: [],
      remediationDueDateKey: null,
    };
    const failedAgain = {
      ...failed,
      dateKey: "1991-03-01",
      remediationDueDateKey: "1991-03-31",
    };
    expect(shouldRemoveBrand([failed], "1991-01-30")).toBe(false);
    expect(
      shouldRemoveBrand([failed, compliant, failedAgain], "1991-04-01"),
    ).toBe(false);
    expect(
      shouldRemoveBrand(
        [
          failed,
          {
            ...failed,
            dateKey: "1991-02-01",
            remediationDueDateKey: "1991-03-03",
          },
        ],
        "1991-03-03",
      ),
    ).toBe(true);
  });
  it("reports concrete failed standards instead of a single XP score", () => {
    const result = auditBrand(STANDARD, { roomQuality: 65, facilities: [] });
    expect(result.compliant).toBe(false);
    expect(result.failures).toEqual([
      "room-quality",
      "facility.breakfast_room",
    ]);
  });

  it("passes a house that meets every declared promise", () => {
    const result = auditBrand(STANDARD, {
      roomQuality: 70,
      facilities: ["facility.breakfast_room"],
    });
    expect(result).toEqual({ compliant: true, failures: [] });
  });

  it("checks satisfaction and stars only when the brand promises them", () => {
    const strict = {
      ...STANDARD,
      minGuestSatisfaction: 75,
      minStars: 4,
    };
    const result = auditBrand(strict, {
      roomQuality: 90,
      facilities: ["facility.breakfast_room"],
      guestSatisfaction: 60,
      stars: 3,
    });
    expect(result.failures).toEqual(["guest-satisfaction", "stars"]);
    expect(
      auditBrand(STANDARD, {
        roomQuality: 90,
        facilities: ["facility.breakfast_room"],
        guestSatisfaction: 10,
        stars: 0,
      }).compliant,
    ).toBe(true);
  });

  it("names failures in a stable order regardless of how the hotel is described", () => {
    const standard = {
      minRoomQuality: 70,
      requiredFacilities: ["facility.wellness", "facility.breakfast_room"],
    };
    expect(
      auditBrand(standard, { roomQuality: 80, facilities: [] }).failures,
    ).toEqual(["facility.breakfast_room", "facility.wellness"]);
  });

  it("keeps the audit record with its cause, not just a verdict", () => {
    const record = recordAudit({
      hotelId: "hotel.frankfurt.1",
      brandId: "brand.rheinstern",
      dateKey: "1991-03-01",
      result: auditBrand(STANDARD, { roomQuality: 65, facilities: [] }),
    });
    expect(record).toEqual({
      hotelId: "hotel.frankfurt.1",
      brandId: "brand.rheinstern",
      dateKey: "1991-03-01",
      compliant: false,
      failures: ["room-quality", "facility.breakfast_room"],
      remediationDueDateKey: "1991-03-31",
    });
  });

  it("gives a failed house a dated grace period before the flag comes down", () => {
    expect(scheduleRemediation("1991-03-01")).toBe("1991-03-31");
    expect(REMEDIATION_GRACE_DAYS).toBe(30);
  });

  it("does not schedule remediation for a compliant audit", () => {
    const record = recordAudit({
      hotelId: "hotel.frankfurt.1",
      brandId: "brand.rheinstern",
      dateKey: "1991-03-01",
      result: auditBrand(STANDARD, {
        roomQuality: 80,
        facilities: ["facility.breakfast_room"],
      }),
    });
    expect(record.compliant).toBe(true);
    expect(record.remediationDueDateKey).toBeNull();
  });

  it("earns the brand's demand uplift only while the house complies", () => {
    const brand = createBrand({
      id: "brand.rheinstern",
      name: "Rheinstern",
      standard: STANDARD,
      demandUpliftBasisPoints: 800,
      monthlyProgrammeCostMinor: 250_000,
    });
    const brands = registerBrand([], brand);
    const assignments = assignBrand([], {
      hotelId: "hotel.frankfurt.1",
      brandId: "brand.rheinstern",
      sinceDateKey: "1991-01-01",
    });
    expect(
      brandDemandUpliftBp(brands, assignments, "hotel.frankfurt.1", {
        roomQuality: 80,
        facilities: ["facility.breakfast_room"],
      }),
    ).toBe(800);
    expect(
      brandDemandUpliftBp(brands, assignments, "hotel.frankfurt.1", {
        roomQuality: 40,
        facilities: [],
      }),
    ).toBe(0);
    // A house flying no flag earns nothing rather than throwing.
    expect(
      brandDemandUpliftBp(brands, assignments, "hotel.munich.1", {
        roomQuality: 80,
        facilities: ["facility.breakfast_room"],
      }),
    ).toBe(0);
  });
});
