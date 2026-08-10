import { translateGame, type GameLocale } from "../../i18n";

export interface SemanticRoom {
  id: string;
  label?: string;
  category?: string;
  state: string;
  cleanliness?: number;
}
export function SemanticHotelTree({
  rooms,
  onInspect,
  locale = "en-GB",
}: {
  rooms: readonly SemanticRoom[];
  onInspect: (id: string) => void;
  locale?: GameLocale;
}) {
  return (
    <section aria-label={translateGame(locale, "hotel.status")}>
      <h2>{translateGame(locale, "hotel.status")}</h2>
      <ul className="hm-register">
        {rooms.map((room) => {
          const label =
            room.label ??
            `${room.id} ${room.category ?? translateGame(locale, "room.fallback")}`;
          const state = translateGame(locale, `room.states.${room.state}`);
          return (
            // The state marker lets the eye find the dirty and the out-of-order
            // rooms; the state is written out in words on the same line.
            <li key={room.id} data-room-state={room.state}>
              <span>
                {label}: {state}
                {room.cleanliness === undefined
                  ? ""
                  : `, ${translateGame(locale, "room.cleanliness", { value: room.cleanliness })}`}
              </span>{" "}
              <button
                type="button"
                onClick={() => onInspect(room.id)}
                aria-label={`${translateGame(locale, "hotel.inspect")} ${label} ${state}`}
              >
                {translateGame(locale, "hotel.inspect")}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
