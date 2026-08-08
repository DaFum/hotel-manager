import { createRngStreams } from "../domain/rng";
export function createInitialGameState(seed: number) {
  const streams = createRngStreams(seed);
  return {
    calendar: { dateKey: "1991-01-01", minuteOfDay: 0 },
    hotel: {
      id: "hotel.frankfurt.1",
      rooms: Array.from({ length: 24 }, (_, i) => ({
        id: `room.${101 + i}`,
        category: i < 12 ? "single" : "double",
        state: "VacantClean",
        cleanliness: 100,
      })),
    },
    finance: { cashMinor: 40_000_000 },
    rngState: Object.fromEntries(
      Object.entries(streams).map(([k, v]) => [k, v.state]),
    ),
  };
}
