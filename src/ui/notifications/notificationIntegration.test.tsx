import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DEFAULT_PLAYER_PREFERENCES } from "../../game/settings/playerPreferences";
import { NotificationCenter } from "./NotificationCenter";
import type { NotificationRecord } from "./notificationPreferences";
const item: NotificationRecord = {
  id: "alert.cash",
  type: "LIQUIDITY_CRITICAL",
  category: "finance",
  severity: "critical",
  gameTime: "1991-01-01:0",
  source: {
    companyId: "company.player",
    hotelId: "hotel.starter",
    regionId: "region.de",
  },
  causes: [{ key: "notifications.causes.negativeLiquidity" }],
  actionTarget: {
    label: { key: "notifications.open", values: { title: "Finanzen" } },
    entityId: "finance",
  },
  read: false,
  acknowledged: false,
  groupId: "cash",
  message: { key: "alerts.liquidityCritical" },
};
describe("NotificationCenter", () => {
  it.each([
    ["en-GB" as const, "Notice"],
    ["de-DE" as const, "Hinweis"],
  ])(
    "renders notice with its diamond and localized label in %s",
    (locale, label) => {
      render(
        <NotificationCenter
          notifications={[{ ...item, severity: "notice" }]}
          preferences={DEFAULT_PLAYER_PREFERENCES.notifications}
          locale={locale}
        />,
      );
      expect(screen.getByText("◆")).toBeTruthy();
      expect(screen.getByText(label)).toBeTruthy();
    },
  );
  it("exposes non-audio severity, live state, cause, and action", () => {
    const action = vi.fn();
    render(
      <NotificationCenter
        notifications={[item]}
        preferences={DEFAULT_PLAYER_PREFERENCES.notifications}
        pauseState="pending"
        onAction={action}
      />,
    );
    expect(screen.getByRole("log").getAttribute("aria-live")).toBe("polite");
    expect(screen.getByText("Critical")).toBeTruthy();
    expect(screen.getByText("Immediate attention required")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Open Finanzen" }));
    expect(action).toHaveBeenCalledWith("finance", "alert.cash");
    expect(screen.getByRole("status").textContent).toContain("pending");
  });
  it("localizes message, cause, and action in German", () => {
    render(
      <NotificationCenter
        notifications={[item]}
        preferences={DEFAULT_PLAYER_PREFERENCES.notifications}
        locale="de-DE"
      />,
    );
    expect(
      screen.getByRole("heading", {
        name: "Kritisch: Liquidität ist kritisch",
      }),
    ).toBeTruthy();
    expect(
      screen.getByText("Bargeld abzüglich Verbindlichkeiten ist negativ"),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Finanzen öffnen" }),
    ).toBeTruthy();
  });

  it("does not submit a surrounding form when an action is opened", () => {
    const submit = vi.fn((event: React.FormEvent) => event.preventDefault());
    render(
      <form onSubmit={submit}>
        <NotificationCenter
          notifications={[item]}
          preferences={DEFAULT_PLAYER_PREFERENCES.notifications}
        />
      </form>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Open Finanzen" }));
    expect(submit).not.toHaveBeenCalled();
  });
});
