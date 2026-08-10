// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import {
  BalancingDashboard,
  balancingMetricsFromSnapshot,
} from "./BalancingDashboard";
import { createInitialGameState } from "../../game/simulation/initialState";

it("shows every long-run balancing measure", () => {
  render(
    <BalancingDashboard
      metrics={{
        hotelRooms: 1_000,
        occupancyBasisPoints: 7_300,
        adrMinor: 15_000,
        revparMinor: 11_000,
        insolvencies: 2,
        wageIndex: 105,
        landPriceMinor: 12_000_000,
        technologyAdoptionBasisPoints: 4_500,
        wealthMinor: 99_000_000,
        demandRoomNights: 20_000,
      }}
    />,
  );
  expect(screen.getByText("1000")).toBeTruthy();
  expect(screen.getByText("45%")).toBeTruthy();
  expect(screen.getByText("73%")).toBeTruthy();
});

it("derives its values from an authoritative snapshot", () => {
  const state = createInitialGameState(4);
  state.finance.cashMinor = 123_000;
  state.finance.payableMinor = 23_000;
  expect(balancingMetricsFromSnapshot(state)).toMatchObject({
    hotelRooms: state.hotel.rooms.length,
    wealthMinor: 100_000,
    landPriceMinor: state.cityMarket.landPriceMinor,
  });
});
