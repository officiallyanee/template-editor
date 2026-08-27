import { expect, it } from "vitest";
import { contrastRatio, meetsContrast } from "./contrast";

it("uses contrast thresholds without rounding borderline failures", () => {
  expect(meetsContrast(2.999, 3)).toBe(false);
  expect(meetsContrast(3, 3)).toBe(true);
});

it("calculates the WCAG black and white maximum contrast", () => {
  expect(contrastRatio("#000000", "#ffffff")).toBe(21);
});
