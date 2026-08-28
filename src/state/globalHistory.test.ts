import { expect, it } from "vitest";
import { command, freshState } from "../test/fixtures";
import {
  buildGlobalTimeline,
  createGlobalCheckpoint,
  hasUnsavedVersion,
} from "./globalHistory";
import { dispatchCommand } from "./pipeline";

it("groups every element changed by one command into one global commit", () => {
  const state = freshState();
  const result = dispatchCommand(state, {
    commandId: "bulk-style",
    source: "canvas",
    targetIds: ["headline", "intro"],
    viewportScope: "all",
    baseRevision: state.version,
    changes: {
      headline: { op: "set", values: { fontWeight: 600 } },
      intro: { op: "set", values: { fontWeight: 600 } },
    },
  });
  if (!result.ok) throw new Error(result.error.detail);

  expect(buildGlobalTimeline(result.state.elements)).toEqual([
    expect.objectContaining({
      commandId: "bulk-style",
      templateVersion: 2,
      entries: [
        expect.objectContaining({ elementId: "headline" }),
        expect.objectContaining({ elementId: "intro" }),
      ],
    }),
  ]);
});

it("sorts commits newest first and excludes no-op commands", () => {
  const state = freshState();
  const first = dispatchCommand(
    state,
    command(state, "headline", { fontSize: 60 }),
  );
  if (!first.ok) throw new Error(first.error.detail);
  const noOp = dispatchCommand(
    first.state,
    command(first.state, "headline", { fontSize: 60 }),
  );
  if (!noOp.ok) throw new Error(noOp.error.detail);
  const second = dispatchCommand(
    noOp.state,
    command(noOp.state, "intro", { fontSize: 20 }),
  );
  if (!second.ok) throw new Error(second.error.detail);

  expect(
    buildGlobalTimeline(second.state.elements).map(
      (item) => item.templateVersion,
    ),
  ).toEqual([3, 2]);
});

it("round-trips a derived timeline through JSON", () => {
  const state = freshState();
  const changed = dispatchCommand(state, command(state, "cta", { width: 200 }));
  if (!changed.ok) throw new Error(changed.error.detail);
  const timeline = buildGlobalTimeline(changed.state.elements);
  expect(JSON.parse(JSON.stringify(timeline))).toEqual(timeline);
});

it("groups every edit since the previous save into one checkpoint", () => {
  const state = freshState();
  const first = dispatchCommand(
    state,
    command(state, "headline", { fontSize: 60 }),
  );
  if (!first.ok) throw new Error(first.error.detail);
  const second = dispatchCommand(
    first.state,
    command(first.state, "intro", { fontSize: 20 }),
  );
  if (!second.ok) throw new Error(second.error.detail);

  const checkpoint = createGlobalCheckpoint(second.state, [], "manual", 1000);
  expect(checkpoint).toEqual(
    expect.objectContaining({
      schemaVersion: 1,
      savedAt: 1000,
      fromTemplateVersion: 1,
      toTemplateVersion: 3,
      commandCount: 2,
      entries: [
        expect.objectContaining({ elementId: "headline" }),
        expect.objectContaining({ elementId: "intro" }),
      ],
    }),
  );
  expect(hasUnsavedVersion(second.state.version, [checkpoint!])).toBe(false);
  expect(createGlobalCheckpoint(second.state, [checkpoint!], "manual")).toBe(
    null,
  );
});

it("creates a later checkpoint only from edits after the previous save", () => {
  const state = freshState();
  const first = dispatchCommand(
    state,
    command(state, "headline", { fontSize: 60 }),
  );
  if (!first.ok) throw new Error(first.error.detail);
  const saved = createGlobalCheckpoint(first.state, [], "manual", 1000)!;
  const second = dispatchCommand(
    first.state,
    command(first.state, "intro", { fontSize: 20 }),
  );
  if (!second.ok) throw new Error(second.error.detail);

  const next = createGlobalCheckpoint(
    second.state,
    [saved],
    "session-end",
    2000,
  );
  expect(next).toEqual(
    expect.objectContaining({
      reason: "session-end",
      fromTemplateVersion: 2,
      toTemplateVersion: 3,
      commandCount: 1,
      entries: [expect.objectContaining({ elementId: "intro" })],
    }),
  );
});
