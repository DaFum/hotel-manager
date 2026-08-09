import { useState } from "react";
import {
  autosaveSlot,
  describeSlot,
  orderSlots,
  recoverySlot,
  type SlotDescriptor,
} from "../game/persistence/savePolicy";

export interface SaveManagerProps {
  /** Every slot that currently holds something, in any order. */
  slots: readonly string[];
  /** Where the last load actually came from, when it was not the slot asked for. */
  recoveredFrom: string | null;
  /** Why a load was refused, in the player's words. */
  validationFailure: string | null;
  onSave: (slot: string) => void;
  onLoad: (slot: string) => void;
}

const KIND_LABEL: Record<SlotDescriptor["kind"], string> = {
  manual: "Manual save",
  autosave: "Autosave",
  recovery: "Recovery",
};

const AUTOSAVE_LABEL: Record<string, string> = {
  month: "end of month",
  year: "end of year",
  "major-action": "before a major decision",
};

function slotTitle(slot: SlotDescriptor): string {
  if (slot.kind === "manual") return slot.label;
  if (slot.kind === "autosave") return AUTOSAVE_LABEL[slot.label] ?? slot.label;
  return `generation ${slot.label}`;
}

/**
 * The save surface. It owns no rules: the policy decides what a slot is and
 * the worker decides whether a save can be loaded. What this adds is the
 * choice — which slot, and whether to fall back to a recovery generation —
 * being the player's rather than being made silently on their behalf.
 */
export function SaveManager(props: SaveManagerProps) {
  const [name, setName] = useState("");
  const slots = orderSlots(props.slots);
  const recovery = Array.from({ length: 3 }, (_, i) => recoverySlot(i)).filter(
    (id) => props.slots.includes(id),
  );

  return (
    <section aria-labelledby="save-manager-heading">
      <h2 id="save-manager-heading">Saved games</h2>

      <label htmlFor="save-slot-name">Name this save</label>
      <input
        id="save-slot-name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="before the refit"
      />
      <button
        type="button"
        disabled={name.trim().length === 0}
        onClick={() => {
          props.onSave(`manual:${name.trim()}`);
          setName("");
        }}
      >
        Save to a new slot
      </button>

      {props.validationFailure ? (
        <p role="alert">
          That save could not be loaded: {props.validationFailure}. The game you
          are playing has not been changed.
        </p>
      ) : null}

      {props.recoveredFrom ? (
        <p role="status">
          Loaded from {slotTitle(describeSlot(props.recoveredFrom))} instead of
          the slot you chose.
        </p>
      ) : null}

      {slots.length === 0 ? (
        <p>No saved games yet.</p>
      ) : (
        <ul>
          {slots.map((slot) => (
            <li key={slot.id}>
              {/* The kind is named in words, never by colour alone. */}
              <span>{KIND_LABEL[slot.kind]}</span>:{" "}
              <span>{slotTitle(slot)}</span>
              <button type="button" onClick={() => props.onLoad(slot.id)}>
                Load {slotTitle(slot)}
              </button>
            </li>
          ))}
        </ul>
      )}

      {recovery.length > 0 ? (
        <div>
          <h3>Recovery</h3>
          <p>
            Automatic copies kept in case a save cannot be read. Choosing one is
            deliberate: it will be older than your last save.
          </p>
          {recovery.map((id) => (
            <button key={id} type="button" onClick={() => props.onLoad(id)}>
              Recover {slotTitle(describeSlot(id))}
            </button>
          ))}
        </div>
      ) : null}

      <p>
        The game also saves itself at the {AUTOSAVE_LABEL.month} and{" "}
        {AUTOSAVE_LABEL.year}, and {AUTOSAVE_LABEL["major-action"]}.
      </p>
      <button
        type="button"
        onClick={() => props.onLoad(autosaveSlot("month"))}
        disabled={!props.slots.includes(autosaveSlot("month"))}
      >
        Load the last monthly autosave
      </button>
    </section>
  );
}
