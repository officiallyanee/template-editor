import { describe, expect, it } from "vitest";
import { command, freshState } from "../../test/fixtures";
import { validateFields } from "./field";
import { validateScope } from "./scope";
import { validateStructural } from "./structural";
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

describe("structural validator", () => {
  it("rejects a command missing required shape fields", () => {
    const result = validateStructural({} as never);
    expect(result?.code).toBe("INVALID_SHAPE");
  });

  it("rejects when targetIds contains an id with no matching change", () => {
    const state = freshState();
    const result = validateStructural({
      commandId: "bad",
      source: "canvas",
      targetIds: ["headline", "cta"],
      viewportScope: "all",
      baseRevision: state.version,
      changes: { headline: { op: "set", values: { fontSize: 20 } } },
    });
    expect(result?.code).toBe("INVALID_SHAPE");
  });

  it("rejects replace-layer on a non-restore source", () => {
    const state = freshState();
    const result = validateStructural({
      commandId: "bad-replace",
      source: "canvas",
      targetIds: ["headline"],
      viewportScope: "all",
      baseRevision: state.version,
      changes: {
        headline: { op: "replace-layer", values: { fontSize: 20 } },
      },
    });
    expect(result?.code).toBe("INVALID_SHAPE");
  });

  it("accepts a valid canvas command", () => {
    const state = freshState();
    expect(validateStructural(command(state, "headline", { fontSize: 20 }))).toBeNull();
  });
});

describe("field validator", () => {
  it("rejects non-finite order in reorder operation", () => {
    const state = freshState();
    const result = validateFields(state, {
      commandId: "bad-order",
      source: "canvas",
      targetIds: ["headline"],
      viewportScope: "all",
      baseRevision: state.version,
      changes: { headline: { op: "reorder", order: NaN } },
    });
    expect(result?.code).toBe("INVALID_FIELD");
    expect(result?.detail).toContain("finite number");
  });

  it("accepts valid reorder and property edits", () => {
    const state = freshState();
    const reorderResult = validateFields(state, {
      commandId: "good-order",
      source: "canvas",
      targetIds: ["headline"],
      viewportScope: "all",
      baseRevision: state.version,
      changes: { headline: { op: "reorder", order: 5 } },
    });
    expect(reorderResult).toBeNull();

    const setFieldResult = validateFields(
      state,
      command(state, "headline", { fontSize: 40 }),
    );
    expect(setFieldResult).toBeNull();
  });
});
