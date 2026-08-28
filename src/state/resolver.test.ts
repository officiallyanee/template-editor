import { expect, it } from "vitest";
import { command, freshState } from "../test/fixtures";
import { dispatchCommand } from "./pipeline";
import {
  applyPatchToElement,
  orderWithProposal,
  resolved,
  resolvedWithProposal,
} from "./resolver";
import type { PendingProposal } from "./types";
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

it("applyPatchToElement: reorder returns element with new order", () => {
  const state = freshState();
  const el = state.elements.headline;
  const result = applyPatchToElement(el, { op: "reorder", order: 99 }, "all");
  expect(result.order).toBe(99);
  expect(result.base).toEqual(el.base);
});

it("applyPatchToElement: replace-layer all replaces base entirely", () => {
  const state = freshState();
  const el = state.elements.headline;
  const newBase = { fontSize: 32, fontWeight: 400 };
  const result = applyPatchToElement(
    el,
    { op: "replace-layer", values: newBase },
    "all",
  );
  expect(result.base).toEqual(newBase);
  expect(result.overrides).toEqual(el.overrides);
});

it("applyPatchToElement: replace-layer viewport sets the override", () => {
  const state = freshState();
  const el = state.elements.headline;
  const result = applyPatchToElement(
    el,
    { op: "replace-layer", values: { fontSize: 20 } },
    "tablet",
  );
  expect(result.overrides.tablet).toEqual({ fontSize: 20 });
  expect(result.base).toEqual(el.base);
});

it("applyPatchToElement: replace-layer viewport with empty values deletes override", () => {
  const state = freshState();
  const el = state.elements.headline;
  const withOverride = applyPatchToElement(
    el,
    { op: "replace-layer", values: { fontSize: 20 } },
    "tablet",
  );
  const cleared = applyPatchToElement(
    withOverride,
    { op: "replace-layer", values: {} },
    "tablet",
  );
  expect(cleared.overrides.tablet).toBeUndefined();
});

it("applyPatchToElement: set viewport merges into existing override", () => {
  const state = freshState();
  const el = state.elements.headline;
  const result = applyPatchToElement(
    el,
    { op: "set", values: { fontWeight: 800 } },
    "mobile",
  );
  expect(result.overrides.mobile?.fontWeight).toBe(800);
  expect(result.overrides.mobile?.fontSize).toBe(35);
});

it("resolvedWithProposal: no proposal returns base resolved", () => {
  const state = freshState();
  const el = state.elements.headline;
  expect(resolvedWithProposal(el, "desktop", undefined)).toEqual(
    resolved(el, "desktop"),
  );
});

it("resolvedWithProposal: non-pending proposal returns base resolved", () => {
  const state = freshState();
  const el = state.elements.headline;
  const accepted: PendingProposal = {
    id: "p1",
    selectionSnapshot: [el.id],
    before: el.base,
    after: { fontSize: 60 },
    status: "accepted",
    command: {
      commandId: "c1",
      source: "ai",
      targetIds: [el.id],
      viewportScope: "all",
      baseRevision: 1,
      changes: { [el.id]: { op: "set", values: { fontSize: 60 } } },
    },
  };
  expect(resolvedWithProposal(el, "desktop", accepted)).toEqual(
    resolved(el, "desktop"),
  );
});

it("resolvedWithProposal: pending reorder proposal returns base resolved (order not a property)", () => {
  const state = freshState();
  const el = state.elements.headline;
  const reorderProposal: PendingProposal = {
    id: "p2",
    selectionSnapshot: [el.id],
    before: el.base,
    after: {},
    status: "pending",
    command: {
      commandId: "c2",
      source: "ai",
      targetIds: [el.id],
      viewportScope: "all",
      baseRevision: 1,
      changes: { [el.id]: { op: "reorder", order: 5 } },
    },
  };
  expect(resolvedWithProposal(el, "desktop", reorderProposal)).toEqual(
    resolved(el, "desktop"),
  );
});

it("resolvedWithProposal: pending properties proposal returns simulated values", () => {
  const state = freshState();
  const el = state.elements.headline;
  const proposal: PendingProposal = {
    id: "p3",
    selectionSnapshot: [el.id],
    before: el.base,
    after: { fontSize: 72 },
    status: "pending",
    command: {
      commandId: "c3",
      source: "ai",
      targetIds: [el.id],
      viewportScope: "all",
      baseRevision: 1,
      changes: { [el.id]: { op: "set", values: { fontSize: 72 } } },
    },
  };
  expect(resolvedWithProposal(el, "desktop", proposal).fontSize).toBe(72);
});

it("orderWithProposal: no proposal returns element order", () => {
  const state = freshState();
  const el = state.elements.headline;
  expect(orderWithProposal(el, undefined)).toBe(el.order);
});

it("orderWithProposal: non-pending proposal returns element order", () => {
  const state = freshState();
  const el = state.elements.headline;
  const accepted: PendingProposal = {
    id: "p4",
    selectionSnapshot: [el.id],
    before: el.base,
    after: {},
    status: "accepted",
    command: {
      commandId: "c4",
      source: "ai",
      targetIds: [el.id],
      viewportScope: "all",
      baseRevision: 1,
      changes: { [el.id]: { op: "reorder", order: 10 } },
    },
  };
  expect(orderWithProposal(el, accepted)).toBe(el.order);
});

it("orderWithProposal: pending reorder proposal returns proposed order", () => {
  const state = freshState();
  const el = state.elements.headline;
  const proposal: PendingProposal = {
    id: "p5",
    selectionSnapshot: [el.id],
    before: el.base,
    after: {},
    status: "pending",
    command: {
      commandId: "c5",
      source: "ai",
      targetIds: [el.id],
      viewportScope: "all",
      baseRevision: 1,
      changes: { [el.id]: { op: "reorder", order: 10 } },
    },
  };
  expect(orderWithProposal(el, proposal)).toBe(10);
});
