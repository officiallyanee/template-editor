import { expect, it, vi } from "vitest";
import { command, freshState } from "../test/fixtures";
import { buildGlobalTimeline, createGlobalCheckpoint } from "./globalHistory";
import { planGlobalRestore, restoreGlobalCheckpoint } from "./globalRestore";
import { dispatchAtomicRestore, dispatchCommand } from "./pipeline";
import { resolved } from "./resolver";

function commit(
  state: ReturnType<typeof freshState>,
  edit: ReturnType<typeof command>,
) {
  const result = dispatchCommand(state, edit);
  if (!result.ok) throw new Error(result.error.detail);
  return result.state;
}

function savedState() {
  const initial = freshState();
  const saved = commit(initial, command(initial, "headline", { fontSize: 58 }));
  return {
    saved,
    checkpoint: createGlobalCheckpoint(saved, [], "manual", 1000)!,
  };
}

it("plans without mutation and restores base, viewport, and order in one version", () => {
  vi.spyOn(Date, "now").mockReturnValue(5000);
  const { saved, checkpoint } = savedState();
  let current = commit(saved, command(saved, "headline", { color: "#111111" }));
  current = commit(
    current,
    command(current, "headline", { fontSize: 32 }, "mobile"),
  );
  current = commit(current, {
    commandId: "move-headline",
    source: "canvas",
    targetIds: ["headline"],
    viewportScope: "all",
    baseRevision: current.version,
    changes: { headline: { op: "reorder", order: 99 } },
  });
  const before = structuredClone(current);

  const plan = planGlobalRestore(current, checkpoint, "restore-checkpoint");
  expect(plan.ok).toBe(true);
  if (!plan.ok) return;
  expect(current).toEqual(before);
  expect(plan.changes).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ elementId: "headline", viewportScope: "all" }),
      expect.objectContaining({
        elementId: "headline",
        viewportScope: "mobile",
      }),
      expect.objectContaining({
        elementId: "headline",
        afterLayer: { kind: "structure", order: saved.elements.headline.order },
      }),
    ]),
  );

  const outcome = dispatchAtomicRestore(current, plan.transaction);
  expect(outcome.ok).toBe(true);
  if (!outcome.ok) return;
  expect(outcome.state.version).toBe(current.version + 1);
  expect(outcome.state.elements.headline.base).toEqual(
    saved.elements.headline.base,
  );
  expect(outcome.state.elements.headline.overrides.mobile).toEqual(
    saved.elements.headline.overrides.mobile,
  );
  expect(outcome.state.elements.headline.order).toBe(
    saved.elements.headline.order,
  );
  const appended = outcome.state.elements.headline.history.slice(
    current.elements.headline.history.length,
  );
  expect(new Set(appended.map((entry) => entry.commandId))).toEqual(
    new Set(["restore-checkpoint"]),
  );
  expect(new Set(appended.map((entry) => entry.templateVersion))).toEqual(
    new Set([current.version + 1]),
  );
  expect(new Set(appended.map((entry) => entry.committedAt))).toEqual(
    new Set([5000]),
  );
  expect(
    appended.every(
      (entry) =>
        entry.intent.kind === "global-restore" &&
        entry.intent.restoredFromCheckpointId === checkpoint.checkpointId,
    ),
  ).toBe(true);
  expect(buildGlobalTimeline(outcome.state.elements)[0].viewportScopes).toEqual(
    ["all", "mobile"],
  );
  vi.restoreAllMocks();
});

it("restores override absence so later base edits propagate", () => {
  const { saved, checkpoint } = savedState();
  let current = commit(
    saved,
    command(saved, "intro", { fontSize: 30 }, "mobile"),
  );
  current = commit(current, command(current, "intro", { fontSize: 24 }, "all"));
  const plan = planGlobalRestore(current, checkpoint);
  if (!plan.ok) throw new Error(plan.detail);
  const restored = dispatchAtomicRestore(current, plan.transaction);
  if (!restored.ok) throw new Error(restored.error.detail);
  expect(restored.state.elements.intro.overrides.mobile).toBeUndefined();

  const edited = commit(
    restored.state,
    command(restored.state, "intro", { fontSize: 22 }, "all"),
  );
  expect(resolved(edited.elements.intro, "mobile").fontSize).toBe(22);
});

it("returns a no-op plan and creates no new version", () => {
  const { saved, checkpoint } = savedState();
  const plan = planGlobalRestore(saved, checkpoint);
  if (!plan.ok) throw new Error(plan.detail);
  expect(plan.changes).toEqual([]);
  const outcome = dispatchAtomicRestore(saved, plan.transaction);
  expect(outcome).toEqual({ ok: true, state: saved });
});

it("rejects the whole transaction when one layer is invalid", () => {
  const { saved, checkpoint } = savedState();
  const current = commit(
    saved,
    command(saved, "headline", { color: "#111111" }),
  );
  const plan = planGlobalRestore(current, checkpoint);
  if (!plan.ok) throw new Error(plan.detail);
  plan.transaction.commands.push({
    ...plan.transaction.commands[0],
    targetIds: ["missing"],
    changes: {
      missing: { op: "replace-layer", values: { color: "#000000" } },
    },
  });

  const outcome = dispatchAtomicRestore(current, plan.transaction);
  expect(outcome.ok).toBe(false);
  expect(current.elements.headline.base.color).toBe("#111111");
  expect(current.version).toBe(3);
});

it("fails closed when immutable structure or the element set differs", () => {
  const { saved, checkpoint } = savedState();
  const renamed = structuredClone(saved);
  renamed.elements.headline.label = "Changed identity";
  expect(planGlobalRestore(renamed, checkpoint)).toEqual(
    expect.objectContaining({ ok: false }),
  );

  const missing = structuredClone(saved);
  delete missing.elements.intro;
  expect(planGlobalRestore(missing, checkpoint)).toEqual(
    expect.objectContaining({ ok: false }),
  );
});

it("rejects a stale restore transaction before applying any layer", () => {
  const { saved, checkpoint } = savedState();
  const current = commit(
    saved,
    command(saved, "headline", { color: "#111111" }),
  );
  const plan = planGlobalRestore(current, checkpoint);
  if (!plan.ok) throw new Error(plan.detail);
  plan.transaction.baseRevision -= 1;
  const outcome = dispatchAtomicRestore(current, plan.transaction);
  expect(outcome).toEqual(
    expect.objectContaining({
      ok: false,
      error: expect.objectContaining({ code: "STALE_REVISION" }),
    }),
  );
});

it("records a successful global restore as a linked checkpoint", () => {
  const { saved, checkpoint } = savedState();
  const current = commit(
    saved,
    command(saved, "headline", { color: "#111111" }),
  );
  const result = restoreGlobalCheckpoint(
    current,
    [checkpoint],
    checkpoint.checkpointId,
    9000,
  );
  if (!result.ok) throw new Error(result.detail);

  expect(result.changed).toBe(true);
  expect(result.template.version).toBe(current.version + 1);
  expect(result.checkpoints.at(-1)).toEqual(
    expect.objectContaining({
      schemaVersion: 2,
      reason: "global-restore",
      savedAt: 9000,
      restoredFromCheckpointId: checkpoint.checkpointId,
      toTemplateVersion: current.version + 1,
    }),
  );
});
