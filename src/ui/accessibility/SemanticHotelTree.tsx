import { translateGame, type GameLocale } from "../../i18n";

const humanRoomState = (state: string) =>
  state.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
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
      <ul>
        {rooms.map((room) => {
          const label =
            room.label ??
            `${room.id} ${room.category ?? translateGame(locale, "room.fallback")}`;
          const state = humanRoomState(room.state);
          return (
            <li key={room.id}>
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
