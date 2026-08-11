import { translateGame, type GameLocale } from "../../i18n";
import { groupByFloor } from "../../render/sceneLayout";

export interface SemanticRoom {
  id: string;
  label?: string;
  category?: string;
  state: string;
  cleanliness?: number;
}
/**
 * The house as a list. This is not a fallback for the canvas — it is the
 * accessible half of the same view, and it is grouped by floor for the same
 * reason the world is: a hotel is read floor by floor, by anyone reading it.
 */
export function SemanticHotelTree({
  rooms,
  onInspect,
  floorByRoomId,
  locale = "en-GB",
}: {
  rooms: readonly SemanticRoom[];
  onInspect: (id: string) => void;
  floorByRoomId?: Readonly<Record<string, number>>;
  locale?: GameLocale;
}) {
  const floors = groupByFloor(rooms, floorByRoomId);
  return (
    <section aria-label={translateGame(locale, "hotel.status")}>
      <h2>{translateGame(locale, "hotel.status")}</h2>
      {/* One scrolling frame around the whole house: a cap per floor would
          clip every storey's last room instead of bounding the list. */}
      <div className="hm-register">
        {floors.map(([floor, floorRooms]) => (
          <div key={floor}>
            {floorByRoomId === undefined ? null : (
              <h3>{translateGame(locale, "room.floor", { value: floor })}</h3>
            )}
            <ul>
              {floorRooms.map((room) => {
                const label =
                  room.label ??
                  `${room.id} ${room.category ?? translateGame(locale, "room.fallback")}`;
                const state = translateGame(
                  locale,
                  `room.states.${room.state}`,
                );
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
          </div>
        ))}
      </div>
    </section>
  );
}

