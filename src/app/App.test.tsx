import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DEFAULT_PLAYER_PREFERENCES } from "../game/settings/playerPreferences";
import { createInitialGameState } from "../game/simulation/initialState";
import { translateGame } from "../i18n";
import { entityLabel } from "../ui/entityNames";
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
  acknowledgeAlert: noop,
  observeTutorialAction: noop,
  setSpeed: noop,
  send: noop,
  save: noop,
  load: async () => {},
  restart: noop,
};

describe("App", () => {
  it("still requests auto-pause from the consolidated notification flow", () => {
    const requestPause = vi.fn();
    const snapshot = createInitialGameState(424242);
    snapshot.alerts = [
      {
        id: "alert.critical.test",
        severity: "critical",
        title: "alert.test",
        cause: "alert.test",
        category: "critical",
        groupId: `${snapshot.hotel.id}:critical`,
        source: { companyId: snapshot.company.companyId },
        gameTime: "1991-01-01:0",
        acknowledged: false,
      },
    ];
    vi.mocked(useGameStore).mockReturnValue({
      ...gameStore,
      snapshot,
      requestPause,
    });
    render(<App />);
    expect(requestPause).toHaveBeenCalled();
  });

  it("shares portfolio hotel selection with the aggregate room view", () => {
    const snapshot = createInitialGameState(424242);
    const managedId = "hotel.offenbach.1";
    snapshot.company.portfolio.hotelIds.push(managedId);
    snapshot.company.managedHotels.push({
      hotelId: managedId,
      name: "Hafenhaus",
      cityId: snapshot.hotel.cityId,
      rooms: 42,
      adrMinor: 12_000,
      occupancyBasisPoints: 6500,
      gopMarginBasisPoints: 3200,
      openedDateKey: "1987-01-01",
    });
    snapshot.company.hotelResults[managedId] = {
      hotelId: managedId,
      periodKey: "1991-01",
      roomRevenueMinor: 1_000_000,
      eventRevenueMinor: 0,
      otherRevenueMinor: 200_000,
      operatingExpenseMinor: 800_000,
      grossOperatingProfitMinor: 400_000,
      occupancyBasisPoints: 6500,
      soldRoomNights: 846,
      availableRoomNights: 1302,
      qualityStars: 3,
      cashNeedMinor: 0,
      renovationNeedMinor: 2_000_000,
    };
    vi.mocked(useGameStore).mockReturnValue({ ...gameStore, snapshot });
    render(<App />);

    fireEvent.click(screen.getByRole("tab", { name: "Unternehmen" }));
    fireEvent.click(screen.getByRole("button", { name: /open hafenhaus/i }));
    expect(screen.getByLabelText("Selected hotel").textContent).toContain(
      "Hafenhaus",
    );

    fireEvent.click(screen.getByRole("tab", { name: "Hauptansicht" }));
    expect(
      screen.getByText("No per-room state exists for this managed hotel."),
    ).toBeTruthy();
    expect(
      screen.queryByRole("button", {
        name: new RegExp(entityLabel("room.101", "de-DE"), "i"),
      }),
    ).toBeNull();
  });

  it("keeps an authoritative alert in the single notification center", () => {
    const snapshot = createInitialGameState(424242);
    snapshot.alerts = [
      {
        category: "test",
        groupId: `${snapshot.hotel.id}:test`,
        source: { companyId: snapshot.company.companyId },
        gameTime: "1991-01-01:0",
        acknowledged: false,
        actionEntityId: "alert.unresolvable",
        id: "alert.unresolvable",
        severity: "warning",
        title: "alert.test",
        cause: "alert.test",
        target: { entityId: "missing.entity", kind: "facility" },
      },
    ];
    vi.mocked(useGameStore).mockReturnValue({ ...gameStore, snapshot });
    render(<App />);

    const notifications = screen.getByRole("region", {
      name: "Benachrichtigungszentrale",
    });
    expect(
      within(notifications).getByRole("button", { name: /öffnen/i }),
    ).toBeTruthy();
    expect(screen.queryByRole("region", { name: "Alerts" })).toBeNull();
  });

  it("renders actionTarget for an alert if its target position is resolvable", () => {
    const snapshot = createInitialGameState(424242);
    snapshot.alerts = [
      {
        category: "test",
        groupId: `${snapshot.hotel.id}:test`,
        source: { companyId: snapshot.company.companyId },
        gameTime: "1991-01-01:0",
        acknowledged: false,
        actionEntityId: "alert.resolvable",
        id: "alert.resolvable",
        severity: "warning",
        title: "alert.test",
        cause: "alert.test",
        target: { entityId: "facility.reception", kind: "facility" },
      },
    ];
    vi.mocked(useGameStore).mockReturnValue({ ...gameStore, snapshot });
    render(<App />);

    const notifications = screen.getByRole("region", {
      name: "Benachrichtigungszentrale",
    });
    expect(
      within(notifications).getByRole("button", { name: /öffnen/i }),
    ).toBeTruthy();
  });

  it("opens a notification's alert and moves focus to its semantic room", () => {
    const snapshot = createInitialGameState(424242);
    const room = snapshot.hotel.rooms[12];
    snapshot.alerts = [
      {
        category: "housekeeping-backlog",
        groupId: `${snapshot.hotel.id}:housekeeping-backlog`,
        source: { companyId: snapshot.company.companyId },
        gameTime: "1991-01-01:0",
        acknowledged: false,
        actionEntityId: "alert.room-focus",
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

    // The app renders in German by default, and the view now says so.
    expect(
      screen.getByRole("status", {
        name: translateGame("de-DE", "world.viewStateLabel"),
      }).textContent,
    ).toContain(`Etage ${snapshot.renderDescriptors.floorByRoomId[room.id]}`);
    expect(
      within(notifications).getByRole("heading", {
        name: /warnung: reinigungsrückstand/i,
      }),
    ).toBeTruthy();
    expect(document.activeElement).toBe(
      screen.getByRole("button", {
        name: new RegExp(`prüfen.*${entityLabel(room.id, "de-DE")}`, "i"),
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
    ]) {
      const chrome = container.querySelector(`[aria-label="${label}"]`);
      expect(chrome).not.toBeNull();
      expect(chrome ? main.contains(chrome) : true).toBe(false);
    }
    expect(main.contains(screen.getByRole("heading", { level: 1 }))).toBe(
      false,
    );

    const expectedContent: Record<(typeof AREA_ORDER)[number], string[]> = {
      mainView: ["Hotel view", translateGame("de-DE", "world.region")],
      hotel: [
        translateGame("de-DE", "panels.facilities.title"),
        "Speisen und Getränke",
        translateGame("de-DE", "panels.commercial.title"),
        translateGame("de-DE", "panels.classification.title"),
        translateGame("de-DE", "panels.build.title"),
        translateGame("de-DE", "panels.technology.title"),
      ],
      guests: ["Gäste"],
      staff: ["Personal"],
      finance: ["Finanzen", translateGame("de-DE", "panels.purchasing.title")],
      revenue: ["Umsatz", translateGame("de-DE", "competitors.title")],
      marketing: [
        "Vertriebspipeline",
        "CRM und Einwilligung",
        "Zielgruppen und Reichweite",
        "Commercial",
      ],
      market: [
        "Stadtwirtschaft",
        "Stadtaktivität",
        "Weltlage",
        "City market",
        translateGame("de-DE", "competitors.title"),
      ],
      company: [
        "Konzernfinanzen",
        "Fusionen und Übernahmen",
        "Konzernzentrale",
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
        container.querySelectorAll(`[aria-label="${translateGame("de-DE", "competitors.title")}"]`),
      ).toHaveLength(id === "revenue" || id === "market" ? 1 : 0);
    }
  });
});
