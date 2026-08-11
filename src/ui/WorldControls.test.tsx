import { render, screen } from "@testing-library/react";
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
