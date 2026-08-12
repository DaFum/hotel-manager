import { describe, expect, it } from "vitest";
import {
  groupNotifications,
  matchesNotificationFilters,
  shouldPauseForAlert,
  type NotificationRecord,
} from "./notificationPreferences";
describe("notification preferences", () => {
  it("uses severity thresholds", () => {
    expect(shouldPauseForAlert("info", "info")).toBe(true);
    expect(shouldPauseForAlert("notice", "warning")).toBe(false);
    expect(shouldPauseForAlert("notice", "critical")).toBe(false);
    expect(shouldPauseForAlert("warning", "warning")).toBe(true);
    expect(shouldPauseForAlert("critical", "critical")).toBe(true);
    expect(shouldPauseForAlert("critical", "never")).toBe(false);
    expect(
      shouldPauseForAlert("warning", "warning", "finance", ["finance"]),
    ).toBe(true);
    expect(
      shouldPauseForAlert("critical", "warning", "operations", ["finance"]),
    ).toBe(false);
  });
  it("groups deterministically but escalates critical items", () => {
    const base = {
      type: "cash",
      category: "finance",
      gameTime: "1991-01-01",
      source: { companyId: "c" },
      causes: [],
      read: false,
      acknowledged: false,
      groupId: "cash",
      message: { key: "topbar.cash" },
    };
    const items: NotificationRecord[] = [
      { ...base, id: "1", severity: "warning" },
      { ...base, id: "2", severity: "warning" },
      { ...base, id: "3", severity: "critical" },
    ];
    expect(groupNotifications(items)).toHaveLength(2);
    expect(groupNotifications(items)[0].count).toBe(2);
  });
  it("matches every filter dimension independently", () => {
    const item: NotificationRecord = {
      id: "1",
      type: "x",
      category: "finance",
      severity: "notice",
      gameTime: "1991-01-01",
      source: { companyId: "c", hotelId: "h", regionId: "r" },
      causes: [],
      delegate: "Anna",
      read: false,
      acknowledged: false,
      groupId: "g",
      message: { key: "topbar.cash" },
    };
    const base = {
      categories: [],
      severities: [],
      hotelIds: [],
      regionIds: [],
      delegated: "all" as const,
      autoPauseAt: "never" as const,
      autoPauseTypes: [],
      groupRepeated: true,
    };
    expect(
      matchesNotificationFilters(item, { ...base, categories: ["finance"] }),
    ).toBe(true);
    expect(
      matchesNotificationFilters(item, { ...base, severities: ["warning"] }),
    ).toBe(false);
    expect(matchesNotificationFilters(item, { ...base, hotelIds: ["h"] })).toBe(
      true,
    );
    expect(
      matchesNotificationFilters(item, { ...base, regionIds: ["other"] }),
    ).toBe(false);
    expect(
      matchesNotificationFilters(item, { ...base, delegated: "delegated" }),
    ).toBe(true);
    expect(
      matchesNotificationFilters(item, { ...base, delegated: "mine" }),
    ).toBe(false);
  });
});
