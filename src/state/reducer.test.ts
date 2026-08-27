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
