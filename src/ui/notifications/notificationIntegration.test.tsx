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
  causes: ["Cash less payables is negative"],
  actionTarget: { label: "Open finance", entityId: "finance" },
  read: false,
  acknowledged: false,
  groupId: "cash",
  message: "Liquidity critical",
};
describe("NotificationCenter", () => {
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
    fireEvent.click(screen.getByRole("button", { name: "Open finance" }));
    expect(action).toHaveBeenCalledWith("finance");
    expect(screen.getByRole("status").textContent).toContain("pending");
  });
});
