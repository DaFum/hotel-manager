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
      elevator={{ queue: 0, waitMinutes: 0, cause: "clear" }}
      problems={[]}
      onCamera={(camera) => {
        next = camera;
      }}
    />,
  );

  const toggle = screen.getByRole("button", { name: /service areas/i });
  expect(toggle.getAttribute("aria-pressed")).toBe("false");
  fireEvent.click(toggle);
  expect(next.showServiceAreas).toBe(true);
});
