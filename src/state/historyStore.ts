import type { RevisionEntry, TemplateElement, ViewportScope } from "./types";
export function historyForScope(
  element: TemplateElement,
  scope?: ViewportScope,
): RevisionEntry[] {
  const filtered = element.history.filter(
    (entry) => !scope || entry.viewportScope === scope,
  );
  if (filtered.length === 0) return [];

  const firstRev = filtered[0];
  if (!firstRev.beforeLayer?.kind) return [...filtered].reverse();

  const initialEntry: RevisionEntry = {
    schemaVersion: 1,
    revisionId: `initial-${element.id}`,
    commandId: `cmd-initial-${element.id}`,
    elementId: element.id,
    committedAt: firstRev.committedAt - 60000,
    source: "initial",
    viewportScope: firstRev.viewportScope,
    beforeLayer: firstRev.beforeLayer,
    afterLayer: firstRev.beforeLayer,
    templateVersion: 1,
    intent: { kind: "manual" },
  };

  return [initialEntry, ...filtered].reverse();
}

export function restoreWouldChange(
  element: TemplateElement,
  entry: RevisionEntry,
): boolean {
  if (entry.afterLayer.kind === "structure")
    return element.order !== entry.afterLayer.order;
  const current =
    entry.viewportScope === "all"
      ? element.base
      : (element.overrides[entry.viewportScope] ?? {});
  const target = entry.afterLayer.values;
  const keys = new Set([...Object.keys(current), ...Object.keys(target)]);
  return [...keys].some(
    (field) =>
      current[field as keyof typeof current] !==
      target[field as keyof typeof target],
  );
}

export function revisionFields(entry: RevisionEntry): string[] {
  if (
    entry.beforeLayer.kind === "structure" ||
    entry.afterLayer.kind === "structure"
  )
    return ["order"];
  if (entry.source === "initial") {
    return ["initial template state"];
  }
  const before = entry.beforeLayer.values;
  const after = entry.afterLayer.values;
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  return [...keys].filter(
    (field) =>
      before[field as keyof typeof before] !==
      after[field as keyof typeof after],
  );
}
