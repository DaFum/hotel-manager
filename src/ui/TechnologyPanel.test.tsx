import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { TechnologyPanel } from "./TechnologyPanel";

it("offers a DOM-accessible technology adoption action", () => {
  const onAdopt = vi.fn();
  render(
    <TechnologyPanel
      technologies={[
        {
          id: "internet",
          adoptionBp: 3000,
          peakAdoptionBp: 3000,
          obsolete: false,
        },
      ]}
      projects={[]}
      implementations={[]}
      onAdopt={onAdopt}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Adopt internet" }));
  expect(onAdopt).toHaveBeenCalledWith("internet");
});
