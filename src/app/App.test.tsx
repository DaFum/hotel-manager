import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DEFAULT_PLAYER_PREFERENCES } from "../game/settings/playerPreferences";
import { createInitialGameState } from "../game/simulation/initialState";
import { translateGame } from "../i18n";
import { AREA_ORDER } from "../ui/ManagementShell";
import { useGameStore, type GameStore } from "./gameStore";
import { App } from "./App";

vi.mock("./gameStore", () => ({ useGameStore: vi.fn() }));

const noop = vi.fn();
const gameStore: GameStore = {
  snapshot: createInitialGameState(424242),
  speed: 0,
  errors: [],
  savedCount: 0,
  slots: [],
  recoveredFrom: null,
  validationFailure: null,
  workerFailure: null,
  recoverFromWorkerFailure: async () => false,
  commandStatus: "idle",
  pauseStatus: "idle",
  preferences: structuredClone(DEFAULT_PLAYER_PREFERENCES),
  setPreferences: noop,
  requestPause: noop,
  requestResume: noop,
  observeTutorialAction: noop,
  setSpeed: noop,
  send: noop,
  save: noop,
  load: async () => {},
  restart: noop,
};

describe("App", () => {
  it("opens a notification's alert and moves focus to its semantic room", () => {
    const snapshot = createInitialGameState(424242);
    const room = snapshot.hotel.rooms[12];
    snapshot.alerts = [
      {
        id: "alert.room-focus",
        severity: "warning",
        title: "alert.housekeeping-backlog.title",
        cause: "alert.housekeeping-backlog.cause",
        causeValues: { rooms: 1 },
        target: { entityId: room.id, kind: "room" },
      },
    ];
    vi.mocked(useGameStore).mockReturnValue({ ...gameStore, snapshot });
    render(<App />);

    const notifications = screen.getByRole("region", {
      name: "Benachrichtigungszentrale",
    });
    fireEvent.click(
      within(notifications).getByRole("button", {
        name: /reinigungsrückstand öffnen/i,
      }),
    );

    expect(
      screen.getByRole("status", { name: "View state" }).textContent,
    ).toContain("Floor 2");
    expect(screen.getByText(/alert\.room-focus · warning/)).toBeTruthy();
    expect(document.activeElement).toBe(
      screen.getByRole("button", {
        name: new RegExp(`prüfen.*${room.id}`, "i"),
      }),
    );
  });

  it("renders the hotel manager shell", () => {
    vi.mocked(useGameStore).mockReturnValue(gameStore);
    const { container } = render(<App />);
    // The default locale is German, so the shell's landmark is too.
    expect(screen.getAllByRole("main")).toHaveLength(1);
    const main = screen.getByRole("main", { name: "Hotelverwaltung" });
    expect(main).toBeTruthy();

    for (const label of [
      "Statusleiste",
      "Darstellungseinstellungen",
      "Benachrichtigungszentrale",
      "Alerts",
    ]) {
      const chrome = container.querySelector(`[aria-label="${label}"]`);
      expect(chrome).not.toBeNull();
      expect(chrome ? main.contains(chrome) : true).toBe(false);
    }
    expect(main.contains(screen.getByRole("heading", { level: 1 }))).toBe(
      false,
    );

    const expectedContent: Record<(typeof AREA_ORDER)[number], string[]> = {
      mainView: ["Hotel view", "World controls"],
      hotel: [
        "Facilities",
        "Speisen und Getränke",
        "Commercial spaces",
        "Classification",
        "Build",
        "Technology",
      ],
      staff: ["Staff"],
      finance: ["Finance", "Purchasing"],
      revenue: ["Revenue", "Competitors"],
      marketing: ["Commercial"],
      market: ["City market", "Competitors"],
      company: [
        "Hotel portfolio",
        "Selected hotel",
        "Brands",
        "Development pipeline",
        "Manager governance",
      ],
      campaign: ["Campaign setup", "Story inbox", "Company chronicle"],
    };

    for (const id of AREA_ORDER) {
      fireEvent.click(
        screen.getByRole("tab", {
          name: translateGame("de-DE", `management.${id}`),
        }),
      );
      const panel = container.querySelector(`#management-${id}`);
      expect(container.querySelectorAll('[role="tabpanel"]')).toHaveLength(1);
      expect(panel).not.toBeNull();
      for (const label of expectedContent[id])
        expect(panel?.querySelector(`[aria-label="${label}"]`)).not.toBeNull();
      expect(
        container.querySelectorAll('[aria-label="Competitors"]'),
      ).toHaveLength(id === "revenue" || id === "market" ? 1 : 0);
    }
  });
});
