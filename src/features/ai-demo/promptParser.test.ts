import { describe, expect, it } from "vitest";
import { parseColorPrompt } from "./promptParser";

describe.each([
  [
    "Change text color from #1f2937 to #005fb8",
    { field: "color", from: "#1f2937", to: "#005fb8" },
  ],
  [
    "Change the background color from white to navy",
    { field: "backgroundColor", from: "#ffffff", to: "#005bab" },
  ],
  [
    "Change color from black to blue",
    { field: null, from: "#000000", to: "#0075de" },
  ],
])("parses %s", (instruction, expected) => {
  it("normalizes the requested transformation", () => {
    const result = parseColorPrompt(instruction);
    expect(result).toMatchObject({ matched: true, ok: true, ...expected });
  });
});

it("rejects malformed colors with an actionable example", () => {
  const result = parseColorPrompt("Change text color from red-ish to brighter");
  expect(result).toMatchObject({
    matched: true,
    ok: false,
    error: { code: "INVALID_COLOR" },
  });
});
