import type { GameState } from "../../game/simulation/initialState";

export interface BalancingMetrics {
  hotelRooms: number;
  occupancyBasisPoints: number;
  adrMinor: number;
  revparMinor: number;
  insolvencies: number;
  wageIndex: number;
  landPriceMinor: number;
  technologyAdoptionBasisPoints: number;
  wealthMinor: number;
  demandRoomNights: number;
}

const percent = (basisPoints: number) => `${Math.round(basisPoints / 100)}%`;

export function BalancingDashboard({ metrics }: { metrics: BalancingMetrics }) {
  const rows = [
    ["Hotel rooms", metrics.hotelRooms],
    ["Occupancy", percent(metrics.occupancyBasisPoints)],
    ["ADR (minor)", metrics.adrMinor],
    ["RevPAR (minor)", metrics.revparMinor],
    ["Insolvencies", metrics.insolvencies],
    ["Wage index", metrics.wageIndex],
    ["Land price (minor)", metrics.landPriceMinor],
    ["Technology adoption", percent(metrics.technologyAdoptionBasisPoints)],
    ["Wealth (minor)", metrics.wealthMinor],
    ["Demand room nights", metrics.demandRoomNights],
  ] as const;
  return (
    <main>
      <h1>Balancing dashboard</h1>
      <table aria-label="Balancing dashboard">
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label}>
              <th scope="row">{label}</th>
              <td>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}

export function balancingMetricsFromSnapshot(
  state: GameState,
): BalancingMetrics {
  return {
    hotelRooms:
      state.hotel.rooms.length +
      state.company.managedHotels.reduce((sum, hotel) => sum + hotel.rooms, 0),
    occupancyBasisPoints: state.metrics.occupancyBasisPoints,
    adrMinor: state.metrics.adrMinor,
    revparMinor: state.metrics.revParMinor,
    insolvencies: state.competitors.filter(
      (competitor) => competitor.status !== "operate",
    ).length,
    wageIndex: Math.round(state.cityMarket.wagePressureBp / 100),
    landPriceMinor: state.cityMarket.landPriceMinor,
    technologyAdoptionBasisPoints: Math.max(
      ...state.world.technologies.map((technology) => technology.adoptionBp),
    ),
    wealthMinor: state.finance.cashMinor - state.finance.payableMinor,
    demandRoomNights: Object.values(state.cityMarket.demand).reduce(
      (sum, roomNights) => sum + roomNights,
      0,
    ),
  };
}
