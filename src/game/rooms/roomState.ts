export type RoomState =
  | "VacantClean"
  | "VacantDirty"
  | "Occupied"
  | "Reserved"
  | "Inspected"
  | "OutOfOrder"
  | "Blocked";

export interface Room {
  state: RoomState;
  cleanliness: number;
}
