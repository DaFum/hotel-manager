import { describe, expect, it } from "vitest";
import { createGameI18n, translateGame } from "./index";
import { de } from "./resources/de";
import { en } from "./resources/en";

function leaves(
  branch: Record<string, unknown>,
  prefix = "",
): Map<string, string> {
  const result = new Map<string, string>();
  for (const [name, value] of Object.entries(branch)) {
    const path = prefix ? `${prefix}.${name}` : name;
    if (typeof value === "string") result.set(path, value);
    else if (value && typeof value === "object")
      for (const [leaf, text] of leaves(value as Record<string, unknown>, path))
        result.set(leaf, text);
  }
  return result;
}

function placeholders(template: string): string[] {
  return [...template.matchAll(/\{([A-Za-z0-9_]+)\}/g)]
    .map((match) => match[1])
    .sort();
}

describe("i18n", () => {
  it("switches semantic keys", async () => {
    const i18n = await createGameI18n("de");
    expect(i18n.t("topbar.cash")).toBe("Bargeld");
    await i18n.changeLanguage("en");
    expect(i18n.t("topbar.cash")).toBe("Cash");
  });
  it("resolves nested keys, interpolation, and missing-key fallback", () => {
    expect(translateGame("de-DE", "topbar.cash")).toBe("Bargeld");
    expect(translateGame("en-GB", "notifications.grouped", { count: 3 })).toBe(
      "3 grouped notifications",
    );
    expect(translateGame("en-GB", "missing.key")).toBe("missing.key");
  });

  it("keeps every catalogue leaf and placeholder present in both locales", () => {
    const english = leaves(en);
    const german = leaves(de);
    expect([...english.keys()].sort()).toEqual([...german.keys()].sort());
    for (const [key, englishText] of english)
      expect(placeholders(german.get(key)!)).toEqual(placeholders(englishText));

    for (const id of [
      "mainView",
      "revenue",
      "marketing",
      "market",
      "campaign",
    ] as const) {
      const key = `management.${id}`;
      expect(translateGame("en-GB", key)).not.toBe(key);
      expect(translateGame("de-DE", key)).not.toBe(key);
    }
  });

  it("localizes telemetry and formats alert money before interpolation", () => {
    expect(
      translateGame("en-GB", "app.telemetry.command", { status: "idle" }),
    ).toBe("Command: idle");
    expect(translateGame("de-DE", "app.telemetry.saves", { count: 2 })).toBe(
      "Gespeicherte Spielstände: 2",
    );
    expect(
      translateGame("de-DE", "alert.recovery.insufficientCash", {
        cashMinor: 450_000,
        costMinor: 12_345,
      }),
    ).toMatch(/4\.500,00\sDM/);
    expect(
      translateGame("de-DE", "alert.recovery-escalated.cause", {
        bookingId: "booking.1",
        expenseMinor: 450_000,
      }),
    ).toMatch(/4\.500,00\sDM/);
  });

  it("resolves an insolvency expense key at the presentation edge", () => {
    expect(
      translateGame("de-DE", "alert.insolvent.cause", {
        expense: "expense.operating",
      }),
    ).toBe("Die Betriebsausgabe konnte nicht vollständig bezahlt werden.");
  });

  it("localizes the shared F&B wait alert in both locales", () => {
    const values = {
      outletId: "breakfastRoom",
      demand: 20,
      capacity: 10,
      waitlisted: 10,
      averageWaitMinutes: 30,
    };
    for (const locale of ["en-GB", "de-DE"] as const) {
      expect(translateGame(locale, "alert.fnb-wait.title")).not.toBe(
        "alert.fnb-wait.title",
      );
      const cause = translateGame(locale, "alert.fnb-wait.cause", values);
      expect(cause).not.toBe("alert.fnb-wait.cause");
      expect(cause).toContain("breakfastRoom");
      expect(cause).toContain("10");
      expect(cause).toContain("30");
    }
  });
});
