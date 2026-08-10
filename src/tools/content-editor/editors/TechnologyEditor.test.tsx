import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TechnologyEditor } from "./TechnologyEditor";

describe("TechnologyEditor", () => {
  it("edits emergence threshold in explicit basis points", () => {
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
  });
});
