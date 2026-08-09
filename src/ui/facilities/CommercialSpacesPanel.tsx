import { formatDm } from "../money";

export interface CommercialSpaceRow {
  id: string;
  kind: string;
  capacity: number;
  openMinute: number;
  closeMinute: number;
  /** How the space is run: self-operated, let, or on a concession. */
  operator: string;
  /** What the hotel actually takes from it, given how it is run. */
  hotelShareMinor: number;
  unitsSold: number;
  fitBp: number;
}

export interface LobbyRow {
  served: number;
  unserved: number;
  cause: string;
  automation: readonly string[];
}

/** Midnight at the end of the day reads as 24:00, not as 00:00 again. */
const clock = (minute: number) =>
  `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;

/**
 * Design intent (AGENTS §13)
 * - Purpose: show the parts of the hotel that are not bedrooms as a business,
 *   so letting a shop and running it are visibly different decisions.
 * - Tone: a letting schedule — hours, capacity and terms on one line, the way
 *   a property manager reads a building.
 * - Constraints: DOM-only, every constraint written in words, hours spelled
 *   out rather than implied by a bar.
 * - Differentiator: the operator model sits next to what the hotel actually
 *   takes, which is the whole trade the player is making.
 */
export function CommercialSpacesPanel(props: {
  spaces: readonly CommercialSpaceRow[];
  lobby: LobbyRow;
}) {
  return (
    <section aria-label="Commercial spaces">
      <h2>Commercial spaces</h2>

      <h3>Lobby</h3>
      <p aria-label="Lobby load">
        {props.lobby.served} served, {props.lobby.unserved} waiting —{" "}
        {props.lobby.cause}
      </p>
      {props.lobby.automation.length === 0 ? (
        <p>Everything goes through the desk.</p>
      ) : (
        <ul>
          {props.lobby.automation.map((mode) => (
            <li key={mode}>{mode}</li>
          ))}
        </ul>
      )}

      <h3>Spaces</h3>
      {props.spaces.length === 0 ? (
        <p>The hotel trades from no commercial space.</p>
      ) : (
        <ul>
          {props.spaces.map((space) => (
            <li key={space.id}>
              {space.id} ({space.kind}): {space.capacity} at a time,{" "}
              {clock(space.openMinute)}–{clock(space.closeMinute)},{" "}
              {space.operator} — {space.unitsSold} sold this month,{" "}
              {formatDm(space.hotelShareMinor)} to the hotel, fit{" "}
              {space.fitBp / 100}
              /100
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
