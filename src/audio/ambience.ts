export interface AmbienceInput {
  visibleGuests: number;
  receptionQueue: number;
  restaurantGuests: number;
  occupancyBasisPoints?: number;
  minuteOfDay?: number;
  activeAreas?: readonly ("lobby" | "restaurant")[];
}
export interface AmbienceMix {
  lobby: number;
  restaurant: number;
  hotel: number;
  night: number;
}
const clamp = (value: number) => Math.max(0, Math.min(1, value));
export function ambienceMix(input: AmbienceInput): AmbienceMix {
  const active = new Set(input.activeAreas ?? ["lobby", "restaurant"]);
  const minute = Math.max(0, Math.min(1439, input.minuteOfDay ?? 720));
  return {
    lobby: active.has("lobby")
      ? clamp(
          Math.max(0, input.visibleGuests) / 120 +
            Math.max(0, input.receptionQueue) / 50,
        )
      : 0,
    restaurant: active.has("restaurant")
      ? clamp(Math.max(0, input.restaurantGuests) / 80)
      : 0,
    hotel: clamp((input.occupancyBasisPoints ?? 0) / 10_000),
    night: minute < 360 || minute >= 1320 ? 1 : 0,
  };
}
