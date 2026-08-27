import { expect, it } from "vitest";
import { restoreCommand } from "../features/history/useRestore";
import { command, freshState } from "../test/fixtures";
import { dispatchCommand } from "./pipeline";
import { resolved } from "./resolver";
import { restoreWouldChange } from "./historyStore";
it("restores one element by appending history without changing its sibling", () => {
  let state = freshState();
  const first = dispatchCommand(
    state,
    command(state, "headline", { fontSize: 60 }),
  );
  if (!first.ok) throw new Error();
  state = first.state;
  const entry = state.elements.headline.history[0];
  const laterHeadline = dispatchCommand(
    state,
    command(state, "headline", { color: "#005bab" }),
  );
  if (!laterHeadline.ok) throw new Error();
  state = laterHeadline.state;
  const second = dispatchCommand(
    state,
    command(state, "intro", { fontSize: 20 }),
  );
  if (!second.ok) throw new Error();
  state = second.state;
  const siblingBefore = resolved(state.elements.intro, "desktop");
  const length = state.elements.headline.history.length;
  const restored = dispatchCommand(
    state,
    restoreCommand(state, "headline", entry),
  );
  if (!restored.ok) throw new Error();
  expect(restoreWouldChange(state.elements.headline, entry)).toBe(true);
  expect(restored.state.elements.headline.history).toHaveLength(length + 1);
  expect(restored.state.elements.headline.history.at(-1)?.source).toBe(
    "restore",
  );
  expect(restored.state.elements.headline.history.at(-1)?.intent).toEqual({
    kind: "restore",
    restoredFromRevisionId: entry.revisionId,
  });
  expect(resolved(restored.state.elements.headline, "desktop").fontSize).toBe(
    60,
  );
  expect(resolved(restored.state.elements.headline, "desktop").color).toBe(
    "#171717",
  );
  expect(restoreWouldChange(restored.state.elements.headline, entry)).toBe(
    false,
  );
  expect(resolved(restored.state.elements.intro, "desktop")).toEqual(
    siblingBefore,
  );
});
it("mobile restore leaves desktop unchanged", () => {
  let state = freshState();
  const first = dispatchCommand(
    state,
    command(state, "cta", { width: 140 }, "mobile"),
  );
  if (!first.ok) throw new Error();
  state = first.state;
  const second = dispatchCommand(
    state,
    command(state, "cta", { width: 180 }, "mobile"),
  );
  if (!second.ok) throw new Error();
  state = second.state;
  const entry = state.elements.cta.history.at(-2);
  if (!entry) throw new Error();
  const desktop = resolved(state.elements.cta, "desktop");
  const result = dispatchCommand(state, restoreCommand(state, "cta", entry));
  if (!result.ok) throw new Error();
  expect(resolved(result.state.elements.cta, "mobile").width).toBe(140);
  expect(resolved(result.state.elements.cta, "desktop")).toEqual(desktop);
});

it("restores the absence of a viewport override so later base edits propagate", () => {
  let state = freshState();
  delete state.elements.intro.overrides.mobile;
  const mobileEdit = dispatchCommand(
    state,
    command(state, "intro", { fontSize: 22 }, "mobile"),
  );
  if (!mobileEdit.ok) throw new Error();
  state = mobileEdit.state;
  const mobileVersion = state.elements.intro.history.at(-1);
  if (!mobileVersion || mobileVersion.beforeLayer.kind !== "properties")
    throw new Error();
  expect(mobileVersion.beforeLayer.values).toEqual({});
  const cleared = dispatchCommand(state, {
    commandId: "clear-mobile-layer",
    source: "restore",
    targetIds: ["intro"],
    viewportScope: "mobile",
    baseRevision: state.version,
    changes: { intro: { op: "replace-layer", values: {} } },
    meta: { restoredFromRevisionId: mobileVersion.revisionId },
  });
  if (!cleared.ok) throw new Error();
  state = cleared.state;
  const emptyLayerVersion = state.elements.intro.history.at(-1);
  if (!emptyLayerVersion) throw new Error();
  expect(emptyLayerVersion.afterLayer).toEqual({
    kind: "properties",
    values: {},
  });

  const secondMobileEdit = dispatchCommand(
    state,
    command(state, "intro", { fontSize: 24 }, "mobile"),
  );
  if (!secondMobileEdit.ok) throw new Error();
  state = secondMobileEdit.state;

  const restored = dispatchCommand(
    state,
    restoreCommand(state, "intro", emptyLayerVersion),
  );
  if (!restored.ok) throw new Error();
  expect(restored.state.elements.intro.overrides.mobile).toBeUndefined();

  const baseEdit = dispatchCommand(
    restored.state,
    command(restored.state, "intro", { fontSize: 20 }, "all"),
  );
  if (!baseEdit.ok) throw new Error();
  expect(resolved(baseEdit.state.elements.intro, "mobile").fontSize).toBe(20);
});

it("serializes revision entries without losing layer presence", () => {
  const state = freshState();
  const result = dispatchCommand(
    state,
    command(state, "intro", { fontSize: 22 }, "mobile"),
  );
  if (!result.ok) throw new Error();
  const entry = result.state.elements.intro.history.at(-1);
  expect(JSON.parse(JSON.stringify(entry))).toEqual(entry);
});

it("does not create a version for an exact no-op command", () => {
  const state = freshState();
  const result = dispatchCommand(
    state,
    command(state, "headline", { fontSize: 54 }),
  );
  if (!result.ok) throw new Error();
  expect(result.state).toBe(state);
  expect(result.state.version).toBe(state.version);
});
