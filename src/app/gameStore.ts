import { useEffect, useRef, useState } from "react";
import { GameClient } from "./GameClient";
import type { GameState } from "../game/simulation/initialState";
import type { GameCommand } from "../game/simulation/GameSimulation";
import { IndexedDbSaveRepository } from "../game/persistence/indexedDbSaveRepository";
import {
  CONTENT_VERSION,
  SAVE_VERSION,
  type SaveEnvelope,
} from "../game/persistence/saveSchema";
import type { Speed } from "../ui/TopBar";

const SLOT = "slot-1";

export interface GameStore {
  snapshot: GameState | null;
  speed: Speed;
  errors: string[];
  savedCount: number;
  setSpeed: (speed: Speed) => void;
  send: (command: GameCommand) => void;
  save: () => void;
  load: () => void;
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
 * forwards player intent as commands.
 */
export function useGameStore(seed: number): GameStore {
  const clientRef = useRef<GameClient | null>(null);
  const repoRef = useRef(new IndexedDbSaveRepository("hotel-manager"));
  const [snapshot, setSnapshot] = useState<GameState | null>(null);
  const [speed, setSpeedState] = useState<Speed>(0);
  const [errors, setErrors] = useState<string[]>([]);
  /** Increments once each save has actually committed to IndexedDB. */
  const [savedAt, setSavedAt] = useState(0);

  useEffect(() => {
    const worker = createWorker();
    if (!worker) return;
    const client = new GameClient(worker);
    clientRef.current = client;
    client.onSnapshot((s) => setSnapshot(s as GameState));
    client.onError((message) => setErrors((prev) => [...prev, message]));
    client.onCommandRejected(({ reason }) =>
      setErrors((prev) => [...prev, `command rejected: ${reason}`]),
    );
    client.onSaveData((saveData) => {
      const envelope: SaveEnvelope = {
        saveVersion: SAVE_VERSION,
        contentVersion: CONTENT_VERSION,
        protocolVersion: 1,
        rngState: (saveData as GameState).rngState,
        state: saveData,
      };
      void repoRef.current
        .save(SLOT, envelope)
        .then(() => setSavedAt((n) => n + 1))
        .catch((error: Error) =>
          setErrors((prev) => [...prev, `save failed: ${error.message}`]),
        );
    });
    client.init(seed);
    return () => {
      clientRef.current = null;
      client.dispose();
    };
  }, [seed]);

  return {
    snapshot,
    speed,
    errors,
    savedCount: savedAt,
    setSpeed: (next) => {
      setSpeedState(next);
      clientRef.current?.setSpeed(next);
    },
    send: (command) => clientRef.current?.sendCommand(command),
    save: () => clientRef.current?.requestSave(),
    load: () => {
      void repoRef.current
        .load(SLOT)
        .then((envelope) => {
          if (envelope) clientRef.current?.loadGame(envelope.state);
          else setErrors((prev) => [...prev, "load failed: no save in slot"]);
        })
        .catch((error: Error) =>
          setErrors((prev) => [...prev, `load failed: ${error.message}`]),
        );
    },
  };
}
