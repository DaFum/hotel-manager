import { describe, expect, it } from "vitest";
import {
  OPENING_CHECKLIST,
  createPreOpening,
  evaluateOpeningReadiness,
  markPreOpeningTask,
  openHotel,
} from "./preOpening";

const READY = {
  staffReady: true,
  suppliersReady: true,
  inventoryReady: true,
  technologyReady: true,
  salesOpen: true,
};

describe("pre-opening", () => {
  it("blocks opening until staff, suppliers, inventory, technology, and sales are ready", () => {
    const result = evaluateOpeningReadiness({
      ...READY,
      inventoryReady: false,
    });
    expect(result.ready).toBe(false);
    expect(result.missing).toEqual(["inventory"]);
  });

  it("names every outstanding item in a fixed order", () => {
    expect(
      evaluateOpeningReadiness({
        staffReady: false,
        suppliersReady: false,
        inventoryReady: false,
        technologyReady: false,
        salesOpen: false,
      }).missing,
    ).toEqual(["staff", "suppliers", "inventory", "technology", "sales"]);
    expect(OPENING_CHECKLIST).toEqual([
      "staff",
      "suppliers",
      "inventory",
      "technology",
      "sales",
    ]);
  });

  it("opens only when nothing is outstanding", () => {
    expect(evaluateOpeningReadiness(READY)).toEqual({
      ready: true,
      missing: [],
    });
  });

  it("starts a project with nothing done and completes it item by item", () => {
    let project = createPreOpening("dev.munich.1", "1992-03-01");
    expect(evaluateOpeningReadiness(project.readiness).missing).toEqual([
      "staff",
      "suppliers",
      "inventory",
      "technology",
      "sales",
    ]);
    for (const task of OPENING_CHECKLIST)
      project = markPreOpeningTask(project, task);
    expect(evaluateOpeningReadiness(project.readiness).ready).toBe(true);
  });

  it("refuses an unknown checklist item rather than silently ignoring it", () => {
    const project = createPreOpening("dev.munich.1", "1992-03-01");
    expect(() =>
      markPreOpeningTask(
        project,
        "catering" as (typeof OPENING_CHECKLIST)[number],
      ),
    ).toThrow(/checklist/);
  });

  it("refuses to open a hotel that is not ready, and names what is missing", () => {
    let project = createPreOpening("dev.munich.1", "1992-03-01");
    project = markPreOpeningTask(project, "staff");
    expect(() => openHotel(project, "1992-03-01")).toThrow(/suppliers/);
  });

  it("opens a ready project once and records the opening date", () => {
    let project = createPreOpening("dev.munich.1", "1992-03-01");
    for (const task of OPENING_CHECKLIST)
      project = markPreOpeningTask(project, task);
    const opened = openHotel(project, "1992-03-05");
    expect(opened.openedDateKey).toBe("1992-03-05");
    expect(opened.status).toBe("open");
    expect(() => openHotel(opened, "1992-03-06")).toThrow(/already open/);
  });
});
