import { expect, it } from "vitest";
import { freshState } from "../../test/fixtures";
import { dispatchCommand } from "../../state/pipeline";
import { runDemo } from "./runDemo";
import { buildProposal } from "./proposalBuilder";
it("is deterministic for the same input and state", () => {
  const state = freshState();
  const a = runDemo("Make it more prominent", ["cta"], "all", "desktop", state);
  const b = runDemo("Make it more prominent", ["cta"], "all", "desktop", state);
  expect(a).toEqual(b);
  expect(JSON.stringify(a)).toBe(JSON.stringify(b));
});
it("fails safely on a stale revision", () => {
  const state = freshState();
  const result = runDemo(
    "Make it bigger",
    ["cta"],
    "all",
    "desktop",
    state,
    state.version - 1,
  );
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.error.code).toBe("STALE_REVISION");
});
it("fails safely with no selection", () => {
  const result = runDemo("Make it bigger", [], "all", "desktop", freshState());
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.error.code).toBe("NO_SELECTION");
});
it("builds one independently reviewable proposal per selected element", () => {
  const result = runDemo(
    "Make selected items compact",
    ["headline", "intro"],
    "all",
    "desktop",
    freshState(),
  );
  expect(result.ok).toBe(true);
  if (result.ok) expect(result.proposals).toHaveLength(2);
});

it("offers three independently previewable prominence strategies", () => {
  const result = runDemo(
    "Make it more prominent",
    ["headline"],
    "all",
    "desktop",
    freshState(),
  );
  if (!result.ok) throw new Error();
  expect(result.strategyGroups.map((group) => group.strategyId)).toEqual([
    "typography-hierarchy",
    "accessible-contrast",
    "spatial-emphasis",
  ]);
});

it("applies an explicit color request when its source precondition matches", () => {
  const result = runDemo(
    "Change text color from #005bab to #0075de",
    ["headline"],
    "all",
    "desktop",
    freshState(),
  );
  if (!result.ok) throw new Error();
  expect(result.proposals[0].after).toEqual({ color: "#0075de" });
  expect(result.proposals[0].metrics?.contrastAfter).toBeGreaterThanOrEqual(3);
});

it("reports a source-color mismatch instead of proposing a change", () => {
  const result = runDemo(
    "Change text color from #1f2937 to #005bab",
    ["headline"],
    "all",
    "desktop",
    freshState(),
  );
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error();
  expect(result.proposals).toHaveLength(0);
  expect(result.strategyGroups[0].outcomes).toEqual([
    expect.objectContaining({
      targetId: "headline",
      status: "invalid",
      detail: expect.stringContaining("currently #005bab"),
    }),
  ]);
});

it("returns one independent outcome per selected element in a mixed selection", () => {
  const selectedIds = ["headline", "cta", "services"];
  const result = runDemo(
    "Make it bigger",
    selectedIds,
    "all",
    "desktop",
    freshState(),
  );
  if (!result.ok) throw new Error();
  for (const group of result.strategyGroups) {
    const representedIds = [
      ...group.proposals.map((proposal) => proposal.command.targetIds[0]),
      ...group.outcomes.map((outcome) => outcome.targetId),
    ];
    expect(representedIds.sort()).toEqual([...selectedIds].sort());
  }
  const typeScale = result.strategyGroups.find(
    (group) => group.strategyId === "type-scale",
  );
  expect(typeScale?.proposals[0].command.targetIds).toEqual(["headline"]);
  expect(typeScale?.outcomes).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ targetId: "cta", status: "unsupported" }),
      expect.objectContaining({
        targetId: "services",
        status: "unsupported",
      }),
    ]),
  );
});

it("does not let one source mismatch cancel a matching sibling", () => {
  const result = runDemo(
    "Change text color from #005bab to #0075de",
    ["headline", "intro"],
    "all",
    "desktop",
    freshState(),
  );
  if (!result.ok) throw new Error();
  expect(result.proposals).toHaveLength(1);
  expect(result.proposals[0].command.targetIds).toEqual(["headline"]);
  expect(result.strategyGroups[0].outcomes).toEqual([
    expect.objectContaining({ targetId: "intro", status: "invalid" }),
  ]);
});

it("records no-op outcomes instead of creating empty proposals", () => {
  const state = freshState();
  state.elements.headline.base.fontWeight = 900;
  const result = runDemo(
    "Make it more prominent",
    ["headline"],
    "all",
    "desktop",
    state,
  );
  if (!result.ok) throw new Error();
  const typography = result.strategyGroups.find(
    (group) => group.strategyId === "typography-hierarchy",
  );
  expect(typography?.proposals).toHaveLength(0);
  expect(typography?.outcomes).toEqual([
    expect.objectContaining({ targetId: "headline", status: "no-op" }),
  ]);
});

it("captures the original selection on every proposal", () => {
  const result = runDemo(
    "Make selected items compact",
    ["headline", "intro"],
    "all",
    "desktop",
    freshState(),
  );
  if (!result.ok) throw new Error();
  expect(
    result.proposals.every(
      (proposal) =>
        JSON.stringify(proposal.selectionSnapshot) ===
        JSON.stringify(["headline", "intro"]),
    ),
  ).toBe(true);
});

it("requires color disambiguation for elements with foreground and background", () => {
  const result = runDemo(
    "Change color from #171717 to #005bab",
    ["cta"],
    "all",
    "desktop",
    freshState(),
  );
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error();
  expect(result.proposals).toHaveLength(0);
  expect(result.strategyGroups[0].outcomes).toEqual([
    expect.objectContaining({
      targetId: "cta",
      status: "invalid",
      detail: expect.stringContaining("Specify which one to change"),
    }),
  ]);
});

it("allows an explicit user color that would fail contrast — shows warning, does not block", () => {
  const result = runDemo(
    "Change text color from #005bab to #999999",
    ["headline"],
    "all",
    "desktop",
    freshState(),
  );
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error();
  const proposal = result.proposals[0];
  expect(proposal.after).toEqual({ color: "#999999" });
  expect(proposal.metrics).toBeDefined();
  if (proposal.metrics) {
    expect(
      proposal.metrics.contrastAfter < proposal.metrics.requiredContrast,
    ).toBe(true);
  }
});

it("still rejects AI-strategy colors that fail contrast", () => {
  const state = freshState();
  const result = buildProposal(
    state,
    state.elements.headline,
    ["headline"],
    "Use a subtle color",
    "accessible-contrast",
    "all",
    "desktop",
    state.version,
    { color: "#ffffff" },
  );
  expect(result).toMatchObject({ error: { code: "CONTRAST_FAILURE" } });
});

it("records the accepted strategy identifier in element history", () => {
  const state = freshState();
  const result = runDemo(
    "Make it more prominent",
    ["headline"],
    "all",
    "desktop",
    state,
  );
  if (!result.ok) throw new Error();
  const proposal = result.strategyGroups[0].proposals[0];
  const accepted = dispatchCommand(state, proposal.command, {
    selectedIds: ["headline"],
    requestedScope: "all",
  });
  if (!accepted.ok) throw new Error();
  expect(accepted.state.elements.headline.history.at(-1)?.intent).toEqual({
    kind: "ai-strategy",
    strategyId: "typography-hierarchy",
  });
});

it("offers distinct sizing strategies for 'make it bigger'", () => {
  const state = freshState();
  const headlineResult = runDemo(
    "Make it bigger",
    ["headline"],
    "all",
    "desktop",
    state,
  );
  if (!headlineResult.ok) throw new Error();
  expect(headlineResult.strategyGroups.map((g) => g.strategyId)).toEqual([
    "type-scale",
    "weight-emphasis",
  ]);

  const buttonResult = runDemo(
    "Make it bigger",
    ["cta"],
    "all",
    "desktop",
    state,
  );
  if (!buttonResult.ok) throw new Error();
  expect(buttonResult.strategyGroups.map((g) => g.strategyId)).toEqual([
    "weight-emphasis",
    "spatial-scale",
  ]);
});

it("requires mobile scope for 'stack this on mobile'", () => {
  const state = freshState();
  const outOfScope = runDemo(
    "Stack this on mobile",
    ["services"],
    "desktop",
    "desktop",
    state,
  );
  expect(outOfScope).toMatchObject({
    ok: false,
    error: {
      code: "OUT_OF_SCOPE",
      detail: expect.stringContaining("requires the mobile edit scope"),
    },
  });

  const inScope = runDemo(
    "Stack this on mobile",
    ["services"],
    "mobile",
    "mobile",
    state,
  );
  expect(inScope.ok).toBe(true);
  if (inScope.ok) {
    expect(inScope.strategyGroups[0].strategyId).toBe("mobile-stack");
    expect(inScope.proposals[0].after).toEqual({ gap: 12 });
  }
});

it("generates element-aware friendly copy variants", () => {
  const result = runDemo(
    "Rewrite this to be friendlier",
    ["headline", "cta", "intro"],
    "all",
    "desktop",
    freshState(),
  );
  if (!result.ok) throw new Error();
  const copyByTarget = Object.fromEntries(
    result.proposals.map((p) => [p.command.targetIds[0], p.after.text]),
  );
  expect(copyByTarget.cta).toBe("Plan my next step");
  expect(copyByTarget.headline).toBe(
    "Clear ideas, thoughtfully brought to life.",
  );
  expect(copyByTarget.intro).toContain("We help teams clarify direction");
});

it("offers distinct negation strategies for 'make it smaller'", () => {
  const headlineResult = runDemo(
    "Make it smaller",
    ["headline"],
    "all",
    "desktop",
    freshState(),
  );
  if (!headlineResult.ok) throw new Error();
  expect(headlineResult.strategyGroups.map((g) => g.strategyId)).toEqual([
    "type-scale-down",
    "weight-reduce",
  ]);
  expect(headlineResult.proposals[0].after.fontSize).toBeLessThan(
    freshState().elements.headline.base.fontSize ?? 0,
  );
});

it("offers three negation strategies for 'make it less prominent'", () => {
  const result = runDemo(
    "Make it less prominent",
    ["headline"],
    "all",
    "desktop",
    freshState(),
  );
  if (!result.ok) throw new Error();
  expect(result.strategyGroups.map((g) => g.strategyId)).toEqual([
    "reduce-weight",
    "neutral-color",
    "trim-space",
  ]);
});

it("shrink strategies reduce values below original", () => {
  const state = freshState();
  const base = state.elements.headline.base;
  const result = runDemo(
    "Make it smaller",
    ["headline"],
    "all",
    "desktop",
    state,
  );
  if (!result.ok) throw new Error();
  const typeDown = result.strategyGroups.find(
    (g) => g.strategyId === "type-scale-down",
  );
  expect(typeDown).toBeDefined();
  if (typeDown) {
    const p = typeDown.proposals[0];
    expect(p.after.fontSize ?? 0).toBeLessThan(base.fontSize ?? 0);
  }
  const weightDown = result.strategyGroups.find(
    (g) => g.strategyId === "weight-reduce",
  );
  expect(weightDown).toBeDefined();
  if (weightDown) {
    const p = weightDown.proposals[0];
    expect(p.after.fontWeight ?? 0).toBeLessThan(base.fontWeight ?? 0);
  }
});

it("spatial-scale does not produce proposals for text elements", () => {
  const result = runDemo(
    "Make it bigger",
    ["headline"],
    "all",
    "desktop",
    freshState(),
  );
  if (!result.ok) throw new Error();
  const spatialGroup = result.strategyGroups.find(
    (g) => g.strategyId === "spatial-scale",
  );
  expect(spatialGroup).toBeUndefined();
});

it("spatial-scale produces proposals for container elements", () => {
  const result = runDemo(
    "Make it bigger",
    ["services"],
    "all",
    "desktop",
    freshState(),
  );
  if (!result.ok) throw new Error();
  const spatialGroup = result.strategyGroups.find(
    (g) => g.strategyId === "spatial-scale",
  );
  expect(spatialGroup).toBeDefined();
  if (spatialGroup) {
    const p = spatialGroup.proposals[0];
    expect(p.after.fontSize).toBeUndefined();
    expect(p.after.padding ?? p.after.gap).toBeDefined();
  }
});

it("creates deterministic cross-axis position proposals only for selected children", () => {
  const state = freshState();
  const result = runDemo(
    "Position this at the end",
    ["headline", "page"],
    "mobile",
    "mobile",
    state,
  );
  if (!result.ok) throw new Error();

  expect(result.strategyGroups).toHaveLength(1);
  const group = result.strategyGroups[0];
  expect(group.strategyId).toBe("cross-axis-position");
  expect(group.proposals).toHaveLength(1);
  expect(group.proposals[0].command.targetIds).toEqual(["headline"]);
  expect(group.proposals[0].after).toEqual({ alignSelf: "end" });
  expect(group.outcomes).toEqual([
    expect.objectContaining({ targetId: "page", status: "unsupported" }),
  ]);

  const accepted = dispatchCommand(state, group.proposals[0].command, {
    selectedIds: group.proposals[0].selectionSnapshot,
    requestedScope: "mobile",
  });
  if (!accepted.ok) throw new Error(accepted.error.detail);
  expect(accepted.state.elements.headline.base.alignSelf).toBeUndefined();
  expect(accepted.state.elements.headline.overrides.mobile?.alignSelf).toBe(
    "end",
  );
  expect(
    accepted.state.elements.intro.overrides.mobile?.alignSelf,
  ).toBeUndefined();
});

it.each([
  ["Move this to the beginning", "reorder-first", { op: "reorder", order: -1 }],
  ["Move this to first", "reorder-first", { op: "reorder", order: -1 }],
  ["Move this to the end", "reorder-last", { op: "reorder", order: 5 }],
  ["Move this to last", "reorder-last", { op: "reorder", order: 5 }],
  [
    "Align this right",
    "cross-axis-position",
    { op: "set", values: { alignSelf: "end" } },
  ],
  [
    "Align this to the left",
    "cross-axis-position",
    { op: "set", values: { alignSelf: "start" } },
  ],
  [
    "Position this at the end",
    "cross-axis-position",
    { op: "set", values: { alignSelf: "end" } },
  ],
])("keeps the prompt intent unambiguous: %s", (prompt, strategyId, patch) => {
  const result = runDemo(prompt, ["headline"], "all", "desktop", freshState());
  if (!result.ok) throw new Error(result.error.detail);
  expect(result.strategyGroups[0].strategyId).toBe(strategyId);
  expect(result.proposals[0].command.changes.headline).toEqual(patch);
});

it("only maps left/right alignment when the parent cross-axis is horizontal", () => {
  const state = freshState();
  const sharedRow = runDemo(
    "Align this right",
    ["service1"],
    "all",
    "desktop",
    state,
  );
  if (!sharedRow.ok) throw new Error(sharedRow.error.detail);
  expect(sharedRow.proposals).toHaveLength(0);
  expect(sharedRow.strategyGroups[0].outcomes[0]).toMatchObject({
    targetId: "service1",
    status: "unsupported",
    detail: expect.stringContaining("horizontal row"),
  });

  const mobileColumn = runDemo(
    "Align this right",
    ["service1"],
    "mobile",
    "mobile",
    state,
  );
  if (!mobileColumn.ok) throw new Error(mobileColumn.error.detail);
  expect(mobileColumn.proposals[0].after).toEqual({ alignSelf: "end" });
  expect(mobileColumn.proposals[0].command.viewportScope).toBe("mobile");
});

it("creates a deterministic structural reorder proposal for one selected element", () => {
  const state = freshState();
  const first = runDemo(
    "Move this to the end",
    ["headline"],
    "all",
    "desktop",
    state,
  );
  const second = runDemo(
    "Move this to the end",
    ["headline"],
    "all",
    "desktop",
    state,
  );
  expect(first).toEqual(second);
  if (!first.ok) throw new Error(first.error.detail);
  expect(first.strategyGroups[0].strategyId).toBe("reorder-last");
  expect(first.proposals[0].command.changes.headline).toEqual({
    op: "reorder",
    order: 5,
  });
  expect(first.proposals[0].before).toEqual({ order: 1 });
  expect(first.proposals[0].after).toEqual({ order: 5 });

  const accepted = dispatchCommand(state, first.proposals[0].command, {
    selectedIds: ["headline"],
    requestedScope: "all",
  });
  if (!accepted.ok) throw new Error(accepted.error.detail);
  expect(accepted.state.elements.headline.history.at(-1)?.afterLayer).toEqual({
    kind: "structure",
    order: 5,
  });
});

it("rejects ambiguous or viewport-scoped structural reorder requests", () => {
  const state = freshState();
  expect(
    runDemo(
      "Move this to the end",
      ["headline", "intro"],
      "all",
      "desktop",
      state,
    ),
  ).toMatchObject({ ok: false, error: { code: "OUT_OF_SCOPE" } });
  expect(
    runDemo("Move this to the end", ["headline"], "mobile", "mobile", state),
  ).toMatchObject({
    ok: false,
    error: { detail: expect.stringContaining("All Views") },
  });
});

it("reports a reorder boundary as a no-op", () => {
  const result = runDemo(
    "Move this to the end",
    ["services"],
    "all",
    "desktop",
    freshState(),
  );
  if (!result.ok) throw new Error(result.error.detail);
  expect(result.proposals).toHaveLength(0);
  expect(result.strategyGroups[0].outcomes[0]).toMatchObject({
    targetId: "services",
    status: "no-op",
  });
});
