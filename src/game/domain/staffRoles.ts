/**
 * The roster the hotel can hire against. It lives in the domain rather than in
 * the simulation module so the UI can offer the roles without pulling the
 * whole authoritative simulation into the main thread bundle.
 */
export type StaffRole =
  | "reception"
  | "housekeeping"
  | "kitchen"
  | "technician"
  | "fnb"
  | "laundry"
  | "wellness"
  | "security";

export const STAFF_ROLES: readonly StaffRole[] = [
  "reception",
  "housekeeping",
  "kitchen",
  "technician",
  "fnb",
  "laundry",
  "wellness",
  "security",
];
