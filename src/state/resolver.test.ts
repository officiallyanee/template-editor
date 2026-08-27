import { expect, it } from "vitest";
import { command, freshState } from "../test/fixtures";
import { dispatchCommand } from "./pipeline";
import { resolved } from "./resolver";
it("isolates a mobile edit from desktop and tablet", () => {
  const state = freshState();
  const desktop = resolved(state.elements.cta, "desktop");
  const tablet = resolved(state.elements.cta, "tablet");
  const result = dispatchCommand(
    state,
    command(state, "cta", { width: 140 }, "mobile"),
  );
  expect(result.ok).toBe(true);
  if (result.ok) {
    expect(resolved(result.state.elements.cta, "mobile").width).toBe(140);
    expect(resolved(result.state.elements.cta, "desktop")).toEqual(desktop);
    expect(resolved(result.state.elements.cta, "tablet")).toEqual(tablet);
  }
});
it("shared edits propagate without clobbering an existing override", () => {
  let state = freshState();
  const mobile = dispatchCommand(
    state,
    command(state, "cta", { color: "#000000" }, "mobile"),
  );
  if (!mobile.ok) throw new Error();
  state = mobile.state;
  const shared = dispatchCommand(
    state,
    command(state, "cta", { color: "#0075de" }, "all"),
  );
  expect(shared.ok).toBe(true);
  if (shared.ok) {
    expect(resolved(shared.state.elements.cta, "desktop").color).toBe(
      "#0075de",
    );
    expect(resolved(shared.state.elements.cta, "mobile").color).toBe("#000000");
  }
});
