import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PropertyStepper } from "./PropertyStepper";

describe("PropertyStepper", () => {
  it("renders label, value, unit, and override label", () => {
    render(
      <PropertyStepper
        label="Padding"
        value={24}
        unit="px"
        min={0}
        max={100}
        step={4}
        overrideLabel="Mobile override"
        onChange={vi.fn()}
      />
    );
    expect(screen.getByText("Padding")).toBeInTheDocument();
    expect(screen.getByText("24 px")).toBeInTheDocument();
    expect(screen.getByText("Mobile override")).toBeInTheDocument();
  });

  it("decreases and increases value within min and max bounds", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    const { rerender } = render(
      <PropertyStepper
        label="Size"
        value={20}
        min={10}
        max={30}
        step={5}
        onChange={handleChange}
      />
    );

    await user.click(screen.getByRole("button", { name: "Decrease size" }));
    expect(handleChange).toHaveBeenCalledWith(15);

    await user.click(screen.getByRole("button", { name: "Increase size" }));
    expect(handleChange).toHaveBeenCalledWith(25);

    rerender(
      <PropertyStepper
        label="Size"
        value={10}
        min={10}
        max={30}
        step={5}
        onChange={handleChange}
      />
    );
    expect(screen.getByRole("button", { name: "Decrease size" })).toBeDisabled();

    rerender(
      <PropertyStepper
        label="Size"
        value={30}
        min={10}
        max={30}
        step={5}
        onChange={handleChange}
      />
    );
    expect(screen.getByRole("button", { name: "Increase size" })).toBeDisabled();
  });
});
