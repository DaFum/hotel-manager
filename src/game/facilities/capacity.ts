export interface CapacityInputs {
  space: number;
  equipment: number;
  staffed: number;
}
function assertCount(value: number, label: string) {
  if (!Number.isSafeInteger(value) || value < 0)
    throw new Error(`invalid ${label}`);
}

export function availableThroughput(i: CapacityInputs) {
  assertCount(i.space, "space");
  assertCount(i.equipment, "equipment");
  assertCount(i.staffed, "staffed");
  return Math.max(0, Math.min(i.space, i.equipment, i.staffed));
}
export function utilizationBp(demand: number, capacity: number) {
  assertCount(demand, "demand");
  assertCount(capacity, "capacity");
  return capacity <= 0
    ? demand > 0
      ? 10000
      : 0
    : Math.min(20000, Math.round((demand * 10000) / capacity));
}
