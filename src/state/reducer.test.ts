import { expect, it } from "vitest";
import { parseAndDiff } from "../features/code-editor/parseAndDiff";
import { restoreCommand } from "../features/history/useRestore";
import { command, freshState } from "../test/fixtures";
import { dispatchCommand } from "./pipeline";
import { resolved } from "./resolver";
it("canvas and equivalent code edits converge", () => {
  const state = freshState();
  const canvas = dispatchCommand(state, command(state, "cta", { width: 200 }));
  const json = JSON.stringify({
    ...resolved(state.elements.cta, "desktop"),
    width: 200,
  });
  const parsed = parseAndDiff(
    json,
    state.elements.cta,
    "desktop",
    "all",
    state,
  );
  expect(parsed.ok).toBe(true);
  if (!canvas.ok || !parsed.ok) throw new Error();
  const code = dispatchCommand(state, parsed.command);
  if (!code.ok) throw new Error();
  expect(resolved(canvas.state.elements.cta, "desktop")).toEqual(
    resolved(code.state.elements.cta, "desktop"),
  );
});
it("an unedited code round-trip produces an empty patch", () => {
  const state = freshState();
  const parsed = parseAndDiff(
    JSON.stringify(resolved(state.elements.cta, "desktop")),
    state.elements.cta,
    "desktop",
    "all",
    state,
  );
  expect(parsed.ok).toBe(true);
  if (parsed.ok && parsed.command.changes.cta.op === "set")
    expect(parsed.command.changes.cta.values).toEqual({});
});
it("rejects stale commands before mutating state", () => {
  const state = freshState();
  const stale = { ...command(state), baseRevision: 0 };
  const result = dispatchCommand(state, stale);
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.error.code).toBe("STALE_REVISION");
  expect(state.version).toBe(1);
});

it("records and restores structural reorder revisions", () => {
  const state = freshState();
  const reordered = dispatchCommand(state, {
    commandId: "reorder-headline",
    source: "canvas",
    targetIds: ["headline"],
    viewportScope: "all",
    baseRevision: state.version,
    changes: { headline: { op: "reorder", order: 6 } },
  });
  if (!reordered.ok) throw new Error();
  const entry = reordered.state.elements.headline.history.at(-1);
  expect(entry?.beforeLayer).toEqual({ kind: "structure", order: 1 });
  expect(entry?.afterLayer).toEqual({ kind: "structure", order: 6 });

  const movedAgain = dispatchCommand(reordered.state, {
    commandId: "reorder-headline-again",
    source: "canvas",
    targetIds: ["headline"],
    viewportScope: "all",
    baseRevision: reordered.state.version,
    changes: { headline: { op: "reorder", order: 3 } },
  });
  if (!movedAgain.ok || !entry) throw new Error();
  const restored = dispatchCommand(
    movedAgain.state,
    restoreCommand(movedAgain.state, "headline", entry),
  );
  if (!restored.ok) throw new Error();
  expect(restored.state.elements.headline.order).toBe(6);
});

it("shares command metadata across multi-element revision entries", () => {
  const state = freshState();
  const result = dispatchCommand(state, {
    commandId: "multi-command",
    source: "canvas",
    targetIds: ["headline", "intro"],
    viewportScope: "all",
    baseRevision: state.version,
    changes: {
      headline: { op: "set", values: { fontWeight: 600 } },
      intro: { op: "set", values: { fontWeight: 600 } },
    },
  });
  if (!result.ok) throw new Error();
  const headline = result.state.elements.headline.history.at(-1);
  const intro = result.state.elements.intro.history.at(-1);
  expect(headline?.commandId).toBe("multi-command");
  expect(headline?.schemaVersion).toBe(1);
  expect(headline?.elementId).toBe("headline");
  expect(headline?.intent).toEqual({ kind: "manual" });
  expect(intro?.commandId).toBe("multi-command");
  expect(headline?.templateVersion).toBe(intro?.templateVersion);
  expect(headline?.committedAt).toBe(intro?.committedAt);
});

it("code editor dispatches from a mobile-scoped override without promoting base values", () => {
  const state = freshState();
  const mobileResolved = resolved(state.elements.headline, "mobile");
  const edited = { ...mobileResolved, fontSize: 28 };
  const parsed = parseAndDiff(
    JSON.stringify(edited),
    state.elements.headline,
    "mobile",
    "mobile",
    state,
  );
  expect(parsed.ok).toBe(true);
  if (!parsed.ok) throw new Error();
  expect(parsed.command.viewportScope).toBe("mobile");
  expect(parsed.command.changes.headline).toEqual({
    op: "set",
    values: { fontSize: 28 },
  });

  const result = dispatchCommand(state, parsed.command);
  if (!result.ok) throw new Error();
  expect(result.state.elements.headline.overrides.mobile?.fontSize).toBe(28);
  expect(result.state.elements.headline.base.fontSize).toBe(54);
  expect(resolved(result.state.elements.headline, "desktop").fontSize).toBe(54);
});

it("tablet viewport edits are isolated from desktop and mobile", () => {
  const state = freshState();
  const result = dispatchCommand(
    state,
    command(state, "headline", { fontSize: 42 }, "tablet"),
  );
  if (!result.ok) throw new Error();
  expect(result.state.elements.headline.overrides.tablet?.fontSize).toBe(42);
  expect(resolved(result.state.elements.headline, "desktop").fontSize).toBe(54);
  expect(resolved(result.state.elements.headline, "mobile").fontSize).toBe(35);
});

it("rejects a command with a non-existent target as UNKNOWN_TARGET", () => {
  const state = freshState();
  const result = dispatchCommand(state, {
    commandId: "bad-target",
    source: "canvas",
    targetIds: ["nonexistent-element"],
    viewportScope: "all",
    baseRevision: state.version,
    changes: {
      "nonexistent-element": { op: "set", values: { fontSize: 20 } },
    },
  });
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.error.code).toBe("UNKNOWN_TARGET");
  expect(state.version).toBe(1);
});

it("rejects out-of-range field values as INVALID_FIELD", () => {
  const state = freshState();
  const negativeWidth = dispatchCommand(
    state,
    command(state, "cta", { width: -10 }),
  );
  expect(negativeWidth.ok).toBe(false);
  if (!negativeWidth.ok) expect(negativeWidth.error.code).toBe("INVALID_FIELD");

  const hugeFont = dispatchCommand(
    state,
    command(state, "headline", { fontSize: 200 }),
  );
  expect(hugeFont.ok).toBe(false);
  if (!hugeFont.ok) expect(hugeFont.error.code).toBe("INVALID_FIELD");

  expect(state.version).toBe(1);
});

it("code editor returns a friendly error for malformed JSON", () => {
  const state = freshState();
  const broken = parseAndDiff(
    '{ "fontSize": 54, }',
    state.elements.headline,
    "desktop",
    "all",
    state,
  );
  expect(broken.ok).toBe(false);
  if (!broken.ok) expect(broken.error).toContain("valid JSON");

  const garbage = parseAndDiff(
    "not json at all",
    state.elements.headline,
    "desktop",
    "all",
    state,
  );
  expect(garbage.ok).toBe(false);
  if (!garbage.ok) expect(garbage.error).toContain("valid JSON");
});

it("code editor rejects schema-invalid values with a descriptive error", () => {
  const state = freshState();
  const badSchema = parseAndDiff(
    JSON.stringify({
      ...resolved(state.elements.headline, "desktop"),
      fontSize: 5,
    }),
    state.elements.headline,
    "desktop",
    "all",
    state,
  );
  expect(badSchema.ok).toBe(false);
  if (!badSchema.ok) expect(badSchema.error.length).toBeGreaterThan(0);

  const unknownField = parseAndDiff(
    JSON.stringify({
      ...resolved(state.elements.headline, "desktop"),
      zIndex: 10,
    }),
    state.elements.headline,
    "desktop",
    "all",
    state,
  );
  expect(unknownField.ok).toBe(false);
});
