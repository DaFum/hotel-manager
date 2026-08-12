import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { DEFAULT_PLAYER_PREFERENCES } from "../../game/settings/playerPreferences";
import { NotificationFilters } from "./NotificationFilters";
import { NotificationCenter } from "./NotificationCenter";
import type { NotificationRecord } from "./notificationPreferences";

const value = DEFAULT_PLAYER_PREFERENCES.notifications;

describe("NotificationFilters", () => {
  it("updates every filter dimension without mutating the source", () => {
    const onChange = vi.fn();
    render(
      <NotificationFilters
        value={value}
        categories={["finance"]}
        hotelIds={["hotel.1"]}
        regionIds={["region.1"]}
        onChange={onChange}
      />,
    );
    for (const label of ["Notice", "finance", "hotel.1", "region.1"])
      fireEvent.click(screen.getByLabelText(new RegExp(label, "i")));
    expect(onChange.mock.calls.map(([next]) => next)).toEqual([
      { ...value, severities: ["notice"] },
      { ...value, categories: ["finance"] },
      { ...value, hotelIds: ["hotel.1"] },
      { ...value, regionIds: ["region.1"] },
    ]);
    fireEvent.change(screen.getByLabelText("Responsibility"), {
      target: { value: "delegated" },
    });
    expect(onChange).toHaveBeenLastCalledWith({
      ...value,
      delegated: "delegated",
    });
    fireEvent.change(screen.getByLabelText("Automatically pause at"), {
      target: { value: "warning" },
    });
    expect(onChange).toHaveBeenLastCalledWith({
      ...value,
      autoPauseAt: "warning",
    });
    fireEvent.click(screen.getByLabelText("Group repeated notifications"));
    expect(onChange).toHaveBeenLastCalledWith({
      ...value,
      groupRepeated: false,
    });
  });

  it("localizes its accessible grouping in German", () => {
    render(
      <NotificationFilters
        value={value}
        locale="de-DE"
        categories={[]}
        hotelIds={[]}
        regionIds={[]}
        onChange={() => {}}
      />,
    );
    expect(
      screen.getByRole("group", { name: "Benachrichtigungsfilter" }),
    ).toBeTruthy();
    expect(screen.getByLabelText("Automatisch pausieren ab")).toBeTruthy();
  });

  it("removes notifications from the log when a filter changes", () => {
    const items: NotificationRecord[] = [
      {
        id: "finance.1",
        type: "finance",
        category: "finance",
        severity: "warning",
        gameTime: "1991-01-01:0",
        source: { companyId: "c" },
        causes: [],
        read: false,
        acknowledged: false,
        groupId: "finance",
        message: { key: "topbar.cash" },
      },
    ];
    function Harness() {
      const [preferences, setPreferences] = useState(value);
      return (
        <>
          <NotificationFilters
            value={preferences}
            categories={["operations"]}
            hotelIds={[]}
            regionIds={[]}
            onChange={setPreferences}
          />
          <NotificationCenter notifications={items} preferences={preferences} />
        </>
      );
    }
    render(<Harness />);
    expect(screen.getByRole("log").querySelector("article")).toBeTruthy();
    fireEvent.click(screen.getByLabelText("operations"));
    expect(screen.getByRole("log").querySelector("article")).toBeNull();
  });
});
