import type { FacilityRecord } from "../simulation/initialState";

export interface FacilityConstraint {
  /** What the player would call this limit. */
  label: string;
  value: number;
}

export interface FacilityInputs {
  id: string;
  name: string;
  demand: number;
  constraints: readonly FacilityConstraint[];
}

/**
 * Turns a facility's competing limits into one board row. The capacity is the
 * tightest constraint and the cause names it, so an overloaded area always
 * explains itself instead of just showing red.
 */
export function facilityRow(i: FacilityInputs): FacilityRecord {
  if (i.constraints.length === 0)
    return {
      id: i.id,
      name: i.name,
      demand: i.demand,
      capacity: 0,
      cause: "closed",
    };
  // First declared wins a tie: the cause must not depend on iteration luck.
  let binding = i.constraints[0];
  for (const c of i.constraints) if (c.value < binding.value) binding = c;
  return {
    id: i.id,
    name: i.name,
    demand: i.demand,
    capacity: Math.max(0, binding.value),
    cause: binding.label,
  };
}
