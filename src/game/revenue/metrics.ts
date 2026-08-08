export function adrMinor(
  roomRevenueMinor: number,
  soldRoomNights: number,
): number {
  return soldRoomNights ? Math.round(roomRevenueMinor / soldRoomNights) : 0;
}

export function revParMinor(
  roomRevenueMinor: number,
  availableRoomNights: number,
): number {
  return availableRoomNights
    ? Math.round(roomRevenueMinor / availableRoomNights)
    : 0;
}

export function occupancyBasisPoints(
  soldRoomNights: number,
  availableRoomNights: number,
): number {
  return availableRoomNights
    ? Math.round((soldRoomNights * 10000) / availableRoomNights)
    : 0;
}

export interface RoomsForecast {
  expected: number;
  low: number;
  high: number;
}

export function forecastRooms(
  booked: number,
  historicPickup: number,
  available: number,
): RoomsForecast {
  for (const [label, value] of [
    ["booked", booked],
    ["historic pickup", historicPickup],
    ["available", available],
  ] as const)
    if (!Number.isSafeInteger(value) || value < 0)
      throw new Error(`invalid ${label}`);

  const expected = Math.min(available, booked + historicPickup);
  const band = Math.ceil(historicPickup * 0.4);
  // Clamp so an overbooked position can never invert the interval.
  const low = Math.min(expected, Math.max(booked, expected - band));
  return {
    expected,
    low,
    high: Math.max(low, Math.min(available, expected + band)),
  };
}
