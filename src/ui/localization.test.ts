import { describe, expect, it } from "vitest";
import { facilityCauseKey, localizeReputationCause } from "./localization";

describe("localization helpers", () => {
  it("maps facility causes correctly", () => {
    expect(facilityCauseKey("therapists on duty")).toBe(
      "facility.cause.serviceStaff",
    );
    expect(facilityCauseKey("treatment rooms")).toBe("facility.cause.space");
    expect(facilityCauseKey("seating")).toBe("facility.cause.seating");
    expect(facilityCauseKey("facility.cause.stock")).toBe(
      "facility.cause.stock",
    );
  });

  it("localizes reputation causes in German and English", () => {
    expect(localizeReputationCause("diluting equity injection", "de-DE")).toBe(
      "Verwässerte Eigenkapitalzufuhr",
    );
    expect(localizeReputationCause("debt turnaround", "de-DE")).toBe(
      "Schuldenrestrukturierung",
    );
    expect(
      localizeReputationCause("sale of hotel.frankfurt.1: 50 jobs", "de-DE"),
    ).toBe("Verkauf von hotel.frankfurt.1: 50 Stellen");
    expect(
      localizeReputationCause(
        "closure of hotel.frankfurt.1 in city.frankfurt",
        "de-DE",
      ),
    ).toBe("Schließung von hotel.frankfurt.1 in Frankfurt");
    expect(
      localizeReputationCause("guest satisfaction 75 at the close", "de-DE"),
    ).toBe("Gästezufriedenheit zum Monatsende: 75%");

    expect(localizeReputationCause("diluting equity injection", "en-GB")).toBe(
      "Diluting equity injection",
    );
    expect(
      localizeReputationCause("sale of hotel.frankfurt.1: 50 jobs", "en-GB"),
    ).toBe("Sale of hotel.frankfurt.1: 50 jobs");
    expect(
      localizeReputationCause(
        "closure of hotel.frankfurt.1 in city.frankfurt",
        "en-GB",
      ),
    ).toBe("Closure of hotel.frankfurt.1 in Frankfurt");
    expect(
      localizeReputationCause("guest satisfaction 75 at the close", "en-GB"),
    ).toBe("Guest satisfaction 75% at close");
  });
});
