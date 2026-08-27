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
    "Change text color from #171717 to #005bab",
    ["headline"],
    "all",
    "desktop",
    freshState(),
  );
  if (!result.ok) throw new Error();
  expect(result.proposals[0].after).toEqual({ color: "#005bab" });
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
  expect(result).toMatchObject({
    ok: false,
    error: { code: "SOURCE_MISMATCH" },
  });
});

it("requires color disambiguation for elements with foreground and background", () => {
  const result = runDemo(
    "Change color from #171717 to #005bab",
    ["cta"],
    "all",
    "desktop",
    freshState(),
  );
  expect(result).toMatchObject({
    ok: false,
    error: { code: "AMBIGUOUS_COLOR" },
  });
});

it("allows an explicit user color that would fail contrast — shows warning, does not block", () => {
  // Regression: explicit 'Change text color from X to Y' used to be blocked by
  // CONTRAST_FAILURE when the chosen color dipped below WCAG threshold.
  // User-chosen colors are intentional — they should pass through with metrics set.
  const result = runDemo(
    "Change text color from #171717 to #999999",
    ["headline"],
    "all",
    "desktop",
    freshState(),
  );
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error();
  const proposal = result.proposals[0];
  expect(proposal.after).toEqual({ color: "#999999" });
  // Metrics are still computed so the ProposalCard can display the warning
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
  // Regression: 'make it smaller' had no corresponding negation strategies.
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
  // Type scale down reduces fontSize
  expect(headlineResult.proposals[0].after.fontSize).toBeLessThan(
    freshState().elements.headline.base.fontSize ?? 0,
  );
});

it("offers three negation strategies for 'make it less prominent'", () => {
  // Regression: 'less prominent' had no matching strategies.
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
  // type-scale-down: fontSize should decrease
  const typeDown = result.strategyGroups.find(
    (g) => g.strategyId === "type-scale-down",
  );
  expect(typeDown).toBeDefined();
  if (typeDown) {
    const p = typeDown.proposals[0];
    expect(p.after.fontSize ?? 0).toBeLessThan(base.fontSize ?? 0);
  }
  // weight-reduce: fontWeight should decrease
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
  // Regression: spatial-scale was incorrectly producing fontSize changes for text elements
  // making it indistinguishable from type-scale. Now it should return null for heading/paragraph.
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
  // spatial-scale should produce NO proposals for text elements (only containers/buttons)
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
    // Should change padding and/or gap, not fontSize
    expect(p.after.fontSize).toBeUndefined();
    expect(p.after.padding ?? p.after.gap).toBeDefined();
  }
});
