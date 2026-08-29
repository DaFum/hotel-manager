import { translateGame, type GameLocale } from "../i18n";

/**
 * Entity identifiers, said out loud.
 *
 * The simulation names things the way a database does — `room.101`,
 * `staff.reception.1`, `space.carpark`, `asset.lift.car.1` — and those strings
 * were reaching the player verbatim: a workforce roster whose employees were
 * called `staff.housekeeping.2`, a floor of rooms called `room.101`, a lift
 * called `asset.lift.car.1`. An identifier is how the program refers to a
 * thing; it is not what the thing is called.
 *
 * This is the edge that turns one into the other. It lives in `src/ui`, reads
 * nothing but the identifier, and never travels back into game state: the
 * worker keeps naming things its own way.
 *
 * `translateGame` returns the key it was given when a catalogue has no entry,
 * which is what let the identifiers through in the first place. So every
 * lookup here is checked against the key it asked for, and anything the
 * catalogues do not know falls through to `humanize`, which at worst produces
 * "Breakfast room" from `fnb.breakfastRoom` — still a name, never a key.
 */

/** Whether the catalogue actually answered, rather than echoing the key. */
function lookup(
  locale: GameLocale,
  key: string,
  values?: Record<string, string | number>,
): string | undefined {
  const text = translateGame(locale, key, values);
  return text === key ? undefined : text;
}

/**
 * The last resort: `breakfast_room` and `breakfastRoom` both become
 * "Breakfast room". Not a translation, but a name rather than an identifier.
 */
export function humanize(segment: string): string {
  const words = segment
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim()
    .toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * A player-facing name for any entity the simulation can hand the UI.
 *
 * Unknown shapes degrade to the humanised final segment rather than to the
 * identifier, so a new entity kind reads as an ordinary noun on the day it is
 * added and only loses its translation, never its legibility.
 */
export function entityLabel(id: string, locale: GameLocale): string {
  if (!id) return "";
  const parts = id.split(".");

  // room.101 — the number is the name a hotel actually uses.
  if (parts[0] === "room" && parts.length === 2)
    return (
      lookup(locale, "entity.room", { number: parts[1] }) ?? humanize(parts[1])
    );

  // staff.reception.1 — the role, then which of them.
  if (parts[0] === "staff" && parts.length === 3) {
    const role = lookup(locale, `staff.role.${parts[1]}`) ?? humanize(parts[1]);
    return `${role} ${parts[2]}`;
  }

  // asset.lift.car.1 — a lift car, numbered.
  if (parts[0] === "asset" && parts[1] === "lift")
    return (
      lookup(locale, "entity.lift", { number: parts.at(-1) ?? "1" }) ??
      `${humanize("lift")} ${parts.at(-1)}`
    );

  // Everything the catalogues do name: outlets, spaces, facilities, loans.
  const known =
    lookup(locale, `fnb.outlets.${parts.at(-1)}`) ??
    lookup(locale, `entity.${parts[0]}.${parts.at(-1)}`) ??
    lookup(locale, `staff.role.${parts.at(-1)}`);
  if (known) return known;

  return humanize(parts.at(-1) ?? id);
}
