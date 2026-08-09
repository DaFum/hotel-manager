/** A single lift trip, door to door. */
export const ELEVATOR_TRIP_MINUTES = 2;
/** Waiting for a lift that is not running, in minutes: everyone takes stairs. */
export const NO_LIFT_WAIT_MINUTES = 60;
/** No queue is modelled as worse than an hour. */
export const MAX_WAIT_MINUTES = 60;

/** Vertical movement the house generates: guests both ways plus service runs. */
export function elevatorTrips(i: {
  arrivals: number;
  departures: number;
  serviceRuns: number;
}): number {
  return (
    Math.max(0, i.arrivals) +
    Math.max(0, i.departures) +
    Math.max(0, i.serviceRuns)
  );
}

/**
 * Average wait for a car. Two people share a trip, so a car clears roughly two
 * trips' worth of demand in the time one takes.
 */
export function elevatorWaitMinutes(trips: number, cars: number): number {
  if (cars <= 0) return NO_LIFT_WAIT_MINUTES;
  return Math.min(
    MAX_WAIT_MINUTES,
    Math.round((Math.max(0, trips) * ELEVATOR_TRIP_MINUTES) / (2 * cars)),
  );
}
