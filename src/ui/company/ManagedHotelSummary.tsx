import { formatBasisPoints, formatDm } from "../money";

export interface ManagedHotelSummaryRow {
  id: string;
  name: string;
  cityName: string;
  occupancyBasisPoints: number;
  monthlyProfitMinor: number;
  cashNeedMinor: number;
  renovationNeedMinor: number;
  managerName: string;
}

/** Aggregate hotel-level facts for houses without minute-by-minute state. */
export function ManagedHotelSummary(props: { hotel: ManagedHotelSummaryRow }) {
  const hotel = props.hotel;
  return (
    <section aria-label={`${hotel.name} summary`}>
      <h2>{hotel.name}</h2>
      <p>{hotel.cityName}</p>
      <p>This hotel is managed as a monthly aggregate, not minute by minute.</p>
      <dl>
        <dt>Occupancy</dt>
        <dd>{formatBasisPoints(hotel.occupancyBasisPoints)}</dd>
        <dt>Profit</dt>
        <dd>{formatDm(hotel.monthlyProfitMinor)}</dd>
        <dt>Cash need</dt>
        <dd>{formatDm(hotel.cashNeedMinor)}</dd>
        <dt>Renovation need</dt>
        <dd>{formatDm(hotel.renovationNeedMinor)}</dd>
        <dt>Manager</dt>
        <dd>{hotel.managerName}</dd>
      </dl>
    </section>
  );
}

export function ManagedHotelUnavailable(props: {
  hotelName: string;
  level: "department" | "room";
}) {
  return (
    <section aria-label={`${props.hotelName} ${props.level} unavailable`}>
      <h2>{props.hotelName}</h2>
      <p>
        {props.level === "room"
          ? "No per-room state exists for this managed hotel."
          : "Department detail is unavailable because this managed hotel has no staff or department state."}
      </p>
      <p>This hotel is managed as a monthly aggregate, not minute by minute.</p>
    </section>
  );
}
