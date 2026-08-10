import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TechnologyEditor } from "./TechnologyEditor";

describe("TechnologyEditor", () => {
  it("edits every technology balancing parameter", () => {
    const onChange = vi.fn();
    const value = {
      id: "tech.wifi",
      kind: "technology" as const,
      runtimeId: "wifi",
      simulationOrder: 0,
      nameKey: "tech.wifi.name",
      prerequisiteIds: [],
      competingStandardIds: [],
      emergenceThresholdBasisPoints: 5000,
      initialAdoptionBasisPoints: 0,
      implementationCostMinor: 1,
    };
    render(<TechnologyEditor value={value} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText(/Emergence threshold/), {
      target: { value: "6500" },
    });
    expect(onChange).toHaveBeenCalledWith({
      ...value,
      emergenceThresholdBasisPoints: 6500,
    });
    fireEvent.change(screen.getByLabelText("Competing standards"), {
      target: { value: "tech.bluetooth, tech.wifi" },
    });
    expect(onChange).toHaveBeenCalledWith({
      ...value,
      competingStandardIds: ["tech.bluetooth", "tech.wifi"],
    });
    fireEvent.change(screen.getByLabelText(/Initial adoption/), {
      target: { value: "250" },
    });
    expect(onChange).toHaveBeenCalledWith({
      ...value,
      initialAdoptionBasisPoints: 250,
    });
    fireEvent.change(screen.getByLabelText(/Implementation cost/), {
      target: { value: "120000" },
    });
    expect(onChange).toHaveBeenCalledWith({
      ...value,
      implementationCostMinor: 120_000,
    });
    expect(screen.getByLabelText("Runtime ID")).toHaveProperty(
      "readOnly",
      true,
    );
  });
});
