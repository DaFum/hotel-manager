import { Room } from "./roomState";

export function cleanRoom(
  room: Room,
  input: { minutes: number; cleaningUnits: number },
): { room: Room; cleaningUnitsLeft: number } {
  if (room.state !== "VacantDirty") throw new Error("room not dirty");
  if (input.minutes < 30) throw new Error("not enough time");
  if (input.cleaningUnits < 1) throw new Error("missing supplies");

  return {
    room: { ...room, state: "Inspected", cleanliness: 100 },
    cleaningUnitsLeft: input.cleaningUnits - 1,
  };
}
