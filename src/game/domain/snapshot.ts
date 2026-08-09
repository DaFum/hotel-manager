export type { GameState as GameSnapshot } from "../simulation/initialState";
/**
 * The read-only shapes the UI and the renderer are allowed to depend on. They
 * travel in the snapshot; nothing outside the worker may construct them.
 */
export type {
  AlertRecord,
  EventRecord,
  FacilityRecord,
  RoomRecord,
  StaffRecord,
} from "../simulation/initialState";
