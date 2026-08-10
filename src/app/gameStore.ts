import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { GameClient } from "./GameClient";
import type { GameState } from "../game/simulation/initialState";
import type { GameCommand } from "../game/domain/commands";
import { IndexedDbSaveRepository } from "../game/persistence/indexedDbSaveRepository";
import type { SaveEnvelope } from "../game/persistence/saveSchema";
import {
  autosaveReason,
  autosaveSlot,
  DEFAULT_MANUAL_SLOT,
  isMajorAction,
} from "../game/persistence/savePolicy";
import {
  isRecovered,
  loadWithRecovery,
  rotateRecovery,
} from "../game/persistence/recovery";
import type { Speed } from "../ui/TopBar";
import {
  DEFAULT_PLAYER_PREFERENCES,
  normalizePlayerPreferences,
  type PlayerPreferences,
} from "../game/settings/playerPreferences";
import {
  completeTutorialStep,
  type TutorialObservation,
  type TutorialStep,
} from "../ui/onboarding/tutorialState";

/** The slot the plain Save button writes to. */
export const DEFAULT_SLOT = DEFAULT_MANUAL_SLOT;

export interface GameStore {
  snapshot: GameState | null;
  speed: Speed;
  errors: string[];
  savedCount: number;
  /** Every slot that currently holds a save, for the save surface. */
  slots: string[];
  /** Where the last load actually came from, if not the slot asked for. */
  recoveredFrom: string | null;
  /** Why the last load was refused, if it was. */
  validationFailure: string | null;
  /**
   * Set when the worker itself has stopped. Nothing else will arrive, so the
   * UI shows the failure instead of a hotel that has quietly frozen.
   */
  workerFailure: string | null;
  /**
   * Replaces the stopped worker and puts the newest trustworthy save back in
   * it. Resolves to false when there was no save to go back to, which leaves
   * reloading the page as the only way out.
   */
  recoverFromWorkerFailure: () => Promise<boolean>;
  commandStatus: "idle" | "pending" | "accepted" | "rejected";
  pauseStatus: "idle" | "pending" | "accepted" | "rejected";
  preferences: PlayerPreferences;
  setPreferences: (preferences: PlayerPreferences) => void;
  requestPause: () => void;
  requestResume: () => void;
  observeTutorialAction: (
    action: Extract<TutorialObservation, "OPEN_BOOKINGS">,
  ) => void;
  setSpeed: (speed: Speed) => void;
  send: (command: GameCommand) => void;
  save: (slot?: string) => void;
  load: (slot?: string) => Promise<void>;
  /**
   * Starts the career again from 1 January 1991. A restart replaces the game
   * rather than changing it, so it goes through `INIT_GAME` — the worker's own
   * entry point — and not through a command, which exists to mutate the game
   * that is running.
   */
  restart: () => void;
}

function createWorker(): Worker | null {
  // Environments without Worker (unit tests, SSR) keep the loading shell.
  if (typeof Worker === "undefined") return null;
  return new Worker(
    new URL("../game/simulation/simulation.worker.ts", import.meta.url),
    { type: "module" },
  );
}

/**
 * The store owns no rules either: it mirrors the latest worker snapshot and
 * forwards player intent as commands. What it does own is the save policy —
 * which slot a save goes to, when the game saves itself, and how a load falls
 * back — because none of that is a rule about the hotel.
 */
export function useGameStore(seed: number): GameStore {
  const clientRef = useRef<GameClient | null>(null);
  const repoRef = useRef(new IndexedDbSaveRepository("hotel-manager"));
  /**
   * The slot each in-flight save request asked for, by request id. Two saves
   * can be in flight at once, and the second must not steal the first's slot.
   */
  const pendingSlotsRef = useRef(new Map<string, string>());
  /** The last calendar position seen, for deciding month and year autosaves. */
  const lastPointRef = useRef<{ dateKey: string; minuteOfDay: number } | null>(
    null,
  );
  /** Set while a load is in flight, so its snapshot is not read as a tick. */
  const loadingRef = useRef(false);
  const loadCompletionRef = useRef<{
    resolve: () => void;
    reject: (error: Error) => void;
  } | null>(null);
  const commandStatesRef = useRef(
    new Map<string, GameStore["commandStatus"]>(),
  );
  const currentCommandRequestRef = useRef<string | null>(null);
  const controlRequestRef = useRef<{
    requestId: string;
    type: "pause" | "resume";
  } | null>(null);
  const tutorialCommandRef = useRef(
    new Map<string, Extract<TutorialObservation, `${string}_ACCEPTED`>>(),
  );
  const [snapshot, setSnapshot] = useState<GameState | null>(null);
  const [speed, setSpeedState] = useState<Speed>(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [slots, setSlots] = useState<string[]>([]);
  const [recoveredFrom, setRecoveredFrom] = useState<string | null>(null);
  const [validationFailure, setValidationFailure] = useState<string | null>(
    null,
  );
  const [workerFailure, setWorkerFailure] = useState<string | null>(null);
  /** Bumped to build a fresh worker after the previous one stopped. */
  const [workerGeneration, setWorkerGeneration] = useState(0);
  /** The save the next worker is started from, when recovering from a stop. */
  const pendingRecoveryRef = useRef<SaveEnvelope | null>(null);
  const [commandStatus, setCommandStatus] =
    useState<GameStore["commandStatus"]>("idle");
  const [pauseStatus, setPauseStatus] =
    useState<GameStore["pauseStatus"]>("idle");
  const [preferences, setPreferencesState] = useState<PlayerPreferences>(() =>
    structuredClone(DEFAULT_PLAYER_PREFERENCES),
  );
  const preferencesRef = useRef(preferences);
  useLayoutEffect(() => {
    preferencesRef.current = preferences;
  }, [preferences]);
  /** Increments once each save has actually committed to IndexedDB. */
  const [savedAt, setSavedAt] = useState(0);

  const refreshSlots = useCallback(() => {
    void repoRef.current
      .listSlots()
      .then(setSlots)
      .catch(() => setSlots([]));
  }, []);

  useEffect(() => {
    const worker = createWorker();
    if (!worker) return;
    const client = new GameClient(worker);
    clientRef.current = client;

    client.onSnapshot((s) => {
      const next = s as GameState;
      setSnapshot(next);
      // The game saves itself on the calendar, not on a timer: a loaded game
      // and an uninterrupted one autosave on exactly the same days.
      const previous = lastPointRef.current;
      lastPointRef.current = next.calendar;
      // A load is not time passing. Restoring an older game moves the
      // calendar backwards, and reading that as a month roll would overwrite
      // the monthly autosave with the historical state it just restored.
      if (loadingRef.current) {
        loadingRef.current = false;
        loadCompletionRef.current?.resolve();
        loadCompletionRef.current = null;
        return;
      }
      if (!previous) return;
      const reason = autosaveReason(previous, next.calendar);
      if (!reason) return;
      pendingSlotsRef.current.set(
        client.requestSave(preferencesRef.current),
        autosaveSlot(reason),
      );
    });
    client.onError((message) => setErrors((prev) => [...prev, message]));
    client.onWorkerFailure((message) => setWorkerFailure(message));
    client.onCommandRejected(({ requestId, reason }) => {
      tutorialCommandRef.current.delete(requestId);
      if (controlRequestRef.current?.requestId === requestId) {
        controlRequestRef.current = null;
        setPauseStatus("rejected");
        return;
      }
      commandStatesRef.current.set(requestId, "rejected");
      if (currentCommandRequestRef.current === requestId)
        setCommandStatus("rejected");
      setErrors((prev) => [...prev, `command rejected: ${reason}`]);
    });
    client.onCommandAccepted(({ requestId }) => {
      if (controlRequestRef.current?.requestId === requestId) {
        const control = controlRequestRef.current;
        controlRequestRef.current = null;
        setSpeedState(control.type === "pause" ? 0 : 1);
        setPauseStatus("accepted");
        return;
      }
      commandStatesRef.current.set(requestId, "accepted");
      if (currentCommandRequestRef.current === requestId)
        setCommandStatus("accepted");
      const tutorialAction = tutorialCommandRef.current.get(requestId);
      tutorialCommandRef.current.delete(requestId);
      if (tutorialAction)
        setPreferencesState((current) =>
          advanceTutorial(current, tutorialAction),
        );
    });
    client.onSimulationError((error) => {
      if (!loadingRef.current || !loadCompletionRef.current) return;
      loadingRef.current = false;
      loadCompletionRef.current.reject(new Error(error.message));
      loadCompletionRef.current = null;
    });
    client.onSaveData((saveData, requestId) => {
      const envelope = saveData as SaveEnvelope;
      const slot = pendingSlotsRef.current.get(requestId) ?? DEFAULT_SLOT;
      pendingSlotsRef.current.delete(requestId);
      void repoRef.current
        .save(slot, envelope)
        // Every save also refreshes the safety net, so a corrupted slot is
        // never the only copy of the campaign.
        .then(() => rotateRecovery(repoRef.current, envelope))
        .then(() => {
          setSavedAt((n) => n + 1);
          refreshSlots();
        })
        .catch((error: Error) =>
          setErrors((prev) => [...prev, `save failed: ${error.message}`]),
        );
    });
    client.init(seed);
    // A worker built to recover starts from the save the player was offered,
    // not from 1991.
    const recovered = pendingRecoveryRef.current;
    pendingRecoveryRef.current = null;
    if (recovered) {
      setPreferencesState(normalizePlayerPreferences(recovered.preferences));
      client.loadGame(recovered);
    }
    refreshSlots();
    return () => {
      clientRef.current = null;
      lastPointRef.current = null;
      client.dispose();
    };
  }, [seed, refreshSlots, workerGeneration]);

  return {
    snapshot,
    speed,
    errors,
    savedCount: savedAt,
    slots,
    recoveredFrom,
    validationFailure,
    workerFailure,
    commandStatus,
    pauseStatus,
    preferences,
    setPreferences: (next) =>
      setPreferencesState(normalizePlayerPreferences(next)),
    requestPause: () => {
      if (controlRequestRef.current) return;
      const requestId = clientRef.current?.pause();
      if (!requestId) return;
      controlRequestRef.current = { requestId, type: "pause" };
      setPauseStatus("pending");
    },
    requestResume: () => {
      if (controlRequestRef.current) return;
      const requestId = clientRef.current?.resume();
      if (!requestId) return;
      controlRequestRef.current = { requestId, type: "resume" };
      setPauseStatus("pending");
    },
    observeTutorialAction: (action) => {
      setPreferencesState((current) => advanceTutorial(current, action));
    },
    setSpeed: (next) => {
      setSpeedState(next);
      clientRef.current?.setSpeed(next);
    },
    send: (command) => {
      // A decision that cannot be undone by issuing the opposite command gets
      // a save of its own first.
      if (isMajorAction(command.type)) {
        const requestId = clientRef.current?.requestSave(
          preferencesRef.current,
        );
        if (requestId)
          pendingSlotsRef.current.set(requestId, autosaveSlot("major-action"));
      }
      const requestId = clientRef.current?.sendCommand(command);
      if (requestId) {
        if (command.type === "SET_RATE")
          tutorialCommandRef.current.set(requestId, "SET_RATE_ACCEPTED");
        if (command.type === "HIRE")
          tutorialCommandRef.current.set(requestId, "HIRE_ACCEPTED");
        currentCommandRequestRef.current = requestId;
        commandStatesRef.current.set(requestId, "pending");
        setCommandStatus("pending");
      }
    },
    recoverFromWorkerFailure: async () => {
      const outcome = await loadWithRecovery(repoRef.current, DEFAULT_SLOT);
      if (!isRecovered(outcome)) return false;
      pendingRecoveryRef.current = outcome.envelope;
      if (outcome.slot !== DEFAULT_SLOT) setRecoveredFrom(outcome.slot);
      setSnapshot(null);
      setSpeedState(0);
      setWorkerFailure(null);
      setWorkerGeneration((generation) => generation + 1);
      return true;
    },
    restart: () => {
      setSnapshot(null);
      setSpeedState(0);
      clientRef.current?.init(seed);
    },
    save: (slot = DEFAULT_SLOT) => {
      const requestId = clientRef.current?.requestSave(preferencesRef.current);
      if (requestId) pendingSlotsRef.current.set(requestId, slot);
    },
    load: async (slot = DEFAULT_SLOT) => {
      setRecoveredFrom(null);
      setValidationFailure(null);
      try {
        const outcome = await loadWithRecovery(repoRef.current, slot);
        if (!isRecovered(outcome)) {
          const reason =
            outcome.rejected.find((r) => r.slot === slot)?.reason ??
            "no save could be read";
          throw new Error(reason);
        }
        if (outcome.slot !== slot) setRecoveredFrom(outcome.slot);
        setPreferencesState(
          normalizePlayerPreferences(outcome.envelope.preferences),
        );
        await new Promise<void>((resolve, reject) => {
          loadingRef.current = true;
          loadCompletionRef.current = { resolve, reject };
          clientRef.current?.loadGame(outcome.envelope);
        });
      } catch (error) {
        const failure = error as Error;
        setValidationFailure(failure.message);
        setErrors((prev) => [...prev, `load failed: ${failure.message}`]);
        throw failure;
      }
    },
  };
}

function tutorialStep(completed: readonly string[]): TutorialStep {
  if (!completed.includes("set-room-price")) return "set-room-price";
  if (!completed.includes("inspect-bookings")) return "inspect-bookings";
  if (!completed.includes("hire-housekeeping")) return "hire-housekeeping";
  return "complete";
}

function advanceTutorial(
  preferences: PlayerPreferences,
  action: TutorialObservation,
): PlayerPreferences {
  const tutorial = completeTutorialStep(
    {
      step: tutorialStep(preferences.tutorialCompleted),
      completed: preferences.tutorialCompleted,
    },
    action,
  );
  return tutorial.completed === preferences.tutorialCompleted
    ? preferences
    : { ...preferences, tutorialCompleted: tutorial.completed };
}
