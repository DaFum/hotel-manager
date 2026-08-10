import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ValidationSummary } from "./ValidationSummary";

describe("ValidationSummary", () => {
  it("shows blocking reference errors", () => {
    render(
      <ValidationSummary
        errors={[
          {
            sourceId: "facility.smart",
            targetId: "tech.none",
            field: "requiredTechnologyIds",
            reason: "missing",
          },
        ]}
      />,
    );
    expect(screen.getByText(/facility.smart.*tech.none/)).toBeTruthy();
  });
});
