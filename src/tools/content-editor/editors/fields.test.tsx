import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NumberField } from "./fields";

describe("NumberField", () => {
  it("keeps an empty draft without emitting zero", () => {
    const onChange = vi.fn();
    render(<NumberField label="Cost" value={12} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Cost"), { target: { value: "" } });
    expect(screen.getByLabelText("Cost")).toHaveProperty("value", "");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("does not emit non-finite intermediate input", () => {
    const onChange = vi.fn();
    render(<NumberField label="Cost" value={12} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Cost"), {
      target: { value: "1e999" },
    });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("emits finite numeric updates", () => {
    const onChange = vi.fn();
    render(<NumberField label="Cost" value={12} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Cost"), {
      target: { value: "42" },
    });
    expect(onChange).toHaveBeenCalledWith(42);
  });
});
