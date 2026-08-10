import { describe, expect, it } from "vitest";
import {
  groupNotifications,
  shouldPauseForAlert,
  type NotificationRecord,
} from "./notificationPreferences";
describe("notification preferences", () => {
  it("uses severity thresholds", () => {
    expect(shouldPauseForAlert("warning", "critical")).toBe(false);
    expect(shouldPauseForAlert("critical", "critical")).toBe(true);
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
      message: "Cash",
    };
    const items: NotificationRecord[] = [
      { ...base, id: "1", severity: "warning" },
      { ...base, id: "2", severity: "warning" },
      { ...base, id: "3", severity: "critical" },
    ];
    expect(groupNotifications(items)).toHaveLength(2);
    expect(groupNotifications(items)[0].count).toBe(2);
  });
});
