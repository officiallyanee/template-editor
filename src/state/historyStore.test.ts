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
    command(state, "headline", { color: "#0075de" }),
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
    "#005bab",
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

it("restores from an AI-accepted revision without special-casing the source", () => {
  let state = freshState();
  const aiResult = dispatchCommand(
    state,
    {
      commandId: "ai-prominence",
      source: "ai",
      targetIds: ["headline"],
      viewportScope: "all",
      baseRevision: state.version,
      changes: { headline: { op: "set", values: { fontWeight: 800 } } },
      meta: { strategyId: "typography-hierarchy" },
    },
    { selectedIds: ["headline"], requestedScope: "all" },
  );
  if (!aiResult.ok) throw new Error();
  state = aiResult.state;
  const aiEntry = state.elements.headline.history.at(-1)!;
  expect(aiEntry.source).toBe("ai");
  expect(aiEntry.intent).toEqual({
    kind: "ai-strategy",
    strategyId: "typography-hierarchy",
  });

  const manual = dispatchCommand(
    state,
    command(state, "headline", { fontWeight: 400 }),
  );
  if (!manual.ok) throw new Error();
  state = manual.state;

  const restored = dispatchCommand(
    state,
    restoreCommand(state, "headline", aiEntry),
  );
  if (!restored.ok) throw new Error();
  expect(restored.state.elements.headline.base.fontWeight).toBe(800);
  expect(restored.state.elements.headline.history.at(-1)?.source).toBe(
    "restore",
  );
  expect(restored.state.elements.headline.history.at(-1)?.intent).toEqual({
    kind: "restore",
    restoredFromRevisionId: aiEntry.revisionId,
  });
});

it("applies a multi-element canvas command atomically", () => {
  const state = freshState();
  const result = dispatchCommand(state, {
    commandId: "multi-canvas",
    source: "canvas",
    targetIds: ["headline", "intro", "cta"],
    viewportScope: "all",
    baseRevision: state.version,
    changes: {
      headline: { op: "set", values: { fontWeight: 800 } },
      intro: { op: "set", values: { fontSize: 20 } },
      cta: { op: "set", values: { width: 200 } },
    },
  });
  if (!result.ok) throw new Error();
  expect(result.state.version).toBe(2);
  expect(result.state.elements.headline.base.fontWeight).toBe(800);
  expect(result.state.elements.intro.base.fontSize).toBe(20);
  expect(result.state.elements.cta.base.width).toBe(200);
  const ids = ["headline", "intro", "cta"].map(
    (id) => result.state.elements[id].history.at(-1)?.commandId,
  );
  expect(new Set(ids)).toEqual(new Set(["multi-canvas"]));
});

it("restoreWouldChange: returns true when a reorder entry differs from current order", () => {
  const state = freshState();
  const result = dispatchCommand(state, {
    commandId: "reorder-1",
    source: "canvas",
    targetIds: ["headline"],
    viewportScope: "all",
    baseRevision: state.version,
    changes: { headline: { op: "reorder", order: 9 } },
  });
  if (!result.ok) throw new Error();
  const entry = result.state.elements.headline.history.at(-1)!;
  const reorderBack = dispatchCommand(result.state, {
    commandId: "reorder-2",
    source: "canvas",
    targetIds: ["headline"],
    viewportScope: "all",
    baseRevision: result.state.version,
    changes: { headline: { op: "reorder", order: 3 } },
  });
  if (!reorderBack.ok) throw new Error();
  expect(restoreWouldChange(reorderBack.state.elements.headline, entry)).toBe(
    true,
  );
});

it("restoreWouldChange: returns false when reorder entry matches current order", () => {
  const state = freshState();
  const result = dispatchCommand(state, {
    commandId: "reorder-3",
    source: "canvas",
    targetIds: ["headline"],
    viewportScope: "all",
    baseRevision: state.version,
    changes: { headline: { op: "reorder", order: 9 } },
  });
  if (!result.ok) throw new Error();
  const entry = result.state.elements.headline.history.at(-1)!;
  expect(restoreWouldChange(result.state.elements.headline, entry)).toBe(false);
});
