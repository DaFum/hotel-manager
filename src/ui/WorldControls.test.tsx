import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { createCamera } from "../render/camera";
import { WorldControls } from "./WorldControls";

it("localizes a problem's camera action accessible name", () => {
  render(
    <WorldControls
      camera={createCamera()}
      floors={[0]}
      minuteOfDay={600}
      elevator={{ queue: 0, waitMinutes: 0, cause: "clear" }}
      problems={[
        {
          id: "alert.housekeeping",
          entityId: "facility.housekeeping",
          title: "alert.housekeeping-backlog.title",
          cause: "alert.housekeeping-backlog.cause",
          causeValues: { rooms: 6 },
          floor: 0,
          x: 0,
          y: 0,
          kind: "problem",
        },
      ]}
      onCamera={() => {}}
      locale="de-DE"
    />,
  );

  expect(
    screen.getByRole("button", {
      name: "Gehe zu Reinigungsrückstand: 6 Zimmer warten auf Reinigung",
    }),
  ).toBeTruthy();
});

it("offers a keyboard-accessible service-area overlay toggle", () => {
  let next = createCamera();
  render(
    <WorldControls
      camera={next}
      floors={[0]}
      minuteOfDay={600}
      elevator={{
        queue: 2,
        waitMinutes: 4,
        cause: "available",
        cars: [
          {
            id: "asset.lift.car.1",
            currentFloor: 1,
            targetFloor: 1,
            direction: "idle",
            failed: false,
            waitingGuestIds: [],
          },
        ],
      }}
      problems={[]}
      onCamera={(camera) => {
        next = camera;
      }}
      locale="de-DE"
    />,
  );

  const toggle = screen.getByRole("button", {
    name: "Servicebereiche anzeigen",
  });
  expect(toggle.getAttribute("aria-pressed")).toBe("false");
  fireEvent.click(toggle);
  expect(next.showServiceAreas).toBe(true);
  expect(screen.getByText(/2 Wartende, 4 Minuten, verfügbar/)).toBeTruthy();
  expect(
    screen.getByText(/Aufzug 1: Etage 1, wartet, betriebsbereit/),
  ).toBeTruthy();
});
