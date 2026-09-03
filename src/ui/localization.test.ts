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
    expect(facilityCauseKey("regulatory closure")).toBe("facility.cause.closed");
    expect(facilityCauseKey("compliance restriction")).toBe(
      "facility.cause.complianceRestriction",
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
    expect(
      localizeReputationCause("resignation: morale at 37", "de-DE"),
    ).toBe("Kündigung durch Mitarbeiter: Moral bei 37");
    expect(
      localizeReputationCause("dismissal: restructuring", "de-DE"),
    ).toBe("Entlassung: Restrukturierung");
    expect(
      localizeReputationCause(
        "training completed: customer_service_101",
        "de-DE",
      ),
    ).toBe("Schulung abgeschlossen: Grundlagen Kundenservice");
    expect(
      localizeReputationCause("supply choice sustainable", "de-DE"),
    ).toBe("Lieferantenwahl (Nachhaltig)");
    expect(
      localizeReputationCause(
        "regulatory noncompliance: regulation.de.labor.tariff_wage",
        "de-DE",
      ),
    ).toBe("Regulatorische Nichteinhaltung: Tariflohnvereinbarung");

    expect(localizeReputationCause("diluting equity injection", "en-GB")).toBe(
      "Diluting equity injection",
    );
    expect(
      localizeReputationCause("resignation: morale at 37", "en-GB"),
    ).toBe("Resignation: morale at 37");
    expect(
      localizeReputationCause("dismissal: restructuring", "en-GB"),
    ).toBe("Dismissal: restructuring");
    expect(
      localizeReputationCause(
        "training completed: customer_service_101",
        "en-GB",
      ),
    ).toBe("Training completed: Customer Service Basics");
    expect(
      localizeReputationCause("supply choice sustainable", "en-GB"),
    ).toBe("Supply choice (sustainable)");
    expect(
      localizeReputationCause(
        "regulatory noncompliance: regulation.de.labor.tariff_wage",
        "en-GB",
      ),
    ).toBe("Regulatory noncompliance: Tariff wage agreement");
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
