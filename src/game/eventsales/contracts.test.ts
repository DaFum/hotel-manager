import { expect, it } from "vitest";
import {
  contractValueMinor,
  executionLoad,
  roomBlockNights,
  type EventContract,
} from "./contracts";
import { leadConverts, offerPriceMinor, qualifyLead } from "./leads";

it("combines rental rooms catering and technology", () => {
  expect(
    contractValueMinor({
      rental: 200000,
      rooms: 450000,
      catering: 180000,
      technology: 50000,
    }),
  ).toBe(880000);
});

it("blocks the rooms a delegation actually sleeps in", () => {
  const contract: EventContract = {
    id: "event.1",
    guests: 120,
    nights: 2,
    roomsBlocked: 40,
    startDateKey: "1991-03-04",
  };
  expect(roomBlockNights(contract)).toBe(80);
  expect(roomBlockNights({ ...contract, roomsBlocked: 0 })).toBe(0);
});

it("pushes conference load into breakfast, housekeeping and security", () => {
  const load = executionLoad({
    id: "event.1",
    guests: 150,
    nights: 1,
    roomsBlocked: 60,
    startDateKey: "1991-03-04",
  });
  expect(load.cateringCovers).toBe(150);
  expect(load.breakfastCovers).toBe(60);
  expect(load.housekeepingMinutes).toBeGreaterThan(0);
  expect(load.securityGuests).toBe(150);
});

it("qualifies leads and loses the ones priced above their budget", () => {
  const lead = {
    id: "lead.1",
    guests: 150,
    nights: 1,
    budgetMinor: 900000,
    leadDays: 40,
  };
  expect(qualifyLead(lead).ok).toBe(true);
  expect(qualifyLead({ ...lead, guests: 0 }).ok).toBe(false);
  expect(qualifyLead({ ...lead, leadDays: 0 }).ok).toBe(false);

  expect(leadConverts(lead, 800000)).toBe(true);
  expect(leadConverts(lead, 900001)).toBe(false);
});

it("prices an offer from the delegation, not from a flat fee", () => {
  const small = offerPriceMinor({ guests: 50, nights: 1, roomsBlocked: 20 });
  const large = offerPriceMinor({ guests: 200, nights: 2, roomsBlocked: 90 });
  expect(large).toBeGreaterThan(small);
  expect(Number.isSafeInteger(large)).toBe(true);
});
