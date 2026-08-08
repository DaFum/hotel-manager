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
  const expected = Math.min(available, booked + historicPickup);
  const band = Math.ceil(historicPickup * 0.4);
  return {
    expected,
    low: Math.max(booked, expected - band),
    high: Math.min(available, expected + band),
  };
}
