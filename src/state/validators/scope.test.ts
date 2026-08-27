import { describe, expect, it } from "vitest";
import { command, freshState } from "../../test/fixtures";
import { validateScope } from "./scope";
describe("scope validator", () => {
  it("rejects an AI target outside the original selection", () => {
    const state = freshState();
    expect(
      validateScope(state, command(state, "cta", { width: 200 }, "all", "ai"), {
        selectedIds: ["headline"],
        requestedScope: "all",
      })?.code,
    ).toBe("OUT_OF_SCOPE");
  });
  it("rejects forbidden fields", () => {
    const state = freshState();
    const unsafe = command(state, "cta", { zIndex: 9 } as never, "all", "ai");
    expect(
      validateScope(state, unsafe, {
        selectedIds: ["cta"],
        requestedScope: "all",
      })?.code,
    ).toBe("OUT_OF_SCOPE");
  });
  it("rejects a viewport mismatch", () => {
    const state = freshState();
    expect(
      validateScope(
        state,
        command(state, "cta", { width: 200 }, "mobile", "ai"),
        { selectedIds: ["cta"], requestedScope: "desktop" },
      )?.code,
    ).toBe("OUT_OF_SCOPE");
  });
  it("accepts selected IDs, allowed fields, and the requested scope", () => {
    const state = freshState();
    expect(
      validateScope(
        state,
        command(state, "cta", { width: 200 }, "mobile", "ai"),
        { selectedIds: ["cta", "headline"], requestedScope: "mobile" },
      ),
    ).toBeNull();
  });
});
