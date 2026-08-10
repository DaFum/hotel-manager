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
}: {
  rooms: readonly SemanticRoom[];
  onInspect: (id: string) => void;
}) {
  return (
    <section aria-label="Hotel status">
      <h2>Hotel status</h2>
      <ul>
        {rooms.map((room) => {
          const label =
            room.label ??
            `${room.id} ${room.category ?? "room"} ${humanRoomState(room.state)}`;
          return (
            <li key={room.id}>
              <span>
                {label}: {humanRoomState(room.state)}
                {room.cleanliness === undefined
                  ? ""
                  : `, cleanliness ${room.cleanliness}`}
              </span>{" "}
              <button
                type="button"
                onClick={() => onInspect(room.id)}
                aria-label={`Inspect ${label}`}
              >
                Inspect
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
