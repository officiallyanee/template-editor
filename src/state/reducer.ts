import { makeId } from "../utils/id";
import type {
  AtomicRestoreTransaction,
  EditCommand,
  ElementProperties,
  RevisionEntry,
  RevisionIntent,
  TemplateElement,
  TemplateState,
} from "./types";

function applySet(
  element: TemplateElement,
  values: Partial<ElementProperties>,
  scope: EditCommand["viewportScope"],
): TemplateElement {
  if (scope === "all")
    return { ...element, base: { ...element.base, ...values } };
  return {
    ...element,
    overrides: {
      ...element.overrides,
      [scope]: { ...(element.overrides[scope] ?? {}), ...values },
    },
  };
}

function replaceLayer(
  element: TemplateElement,
  values: ElementProperties,
  scope: EditCommand["viewportScope"],
): TemplateElement {
  if (scope === "all") return { ...element, base: { ...values } };
  const overrides = { ...element.overrides };
  if (Object.keys(values).length === 0) delete overrides[scope];
  else overrides[scope] = { ...values };
  return { ...element, overrides };
}

function propertiesLayer(
  element: TemplateElement,
  scope: EditCommand["viewportScope"],
): ElementProperties {
  return scope === "all"
    ? { ...element.base }
    : { ...(element.overrides[scope] ?? {}) };
}

function revisionIntent(command: EditCommand): RevisionIntent {
  if (command.source === "restore")
    return {
      kind: "restore",
      restoredFromRevisionId: command.meta?.restoredFromRevisionId ?? "unknown",
    };
  if (command.source === "ai")
    return {
      kind: "ai-strategy",
      strategyId: command.meta?.strategyId ?? "deterministic-demo",
    };
  return { kind: "manual" };
}

function sameProperties(
  left: ElementProperties,
  right: ElementProperties,
): boolean {
  const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
  return [...keys].every(
    (key) =>
      left[key as keyof ElementProperties] ===
      right[key as keyof ElementProperties],
  );
}

export function applyEditCommand(
  state: TemplateState,
  command: EditCommand,
): TemplateState {
  const nextVersion = state.version + 1;
  const committedAt = Date.now();
  const elements = { ...state.elements };
  let changed = false;
  for (const id of command.targetIds) {
    const current = elements[id];
    const patch = command.changes[id];
    let updated: TemplateElement;
    let beforeLayer: RevisionEntry["beforeLayer"];
    let afterLayer: RevisionEntry["afterLayer"];
    if (patch.op === "reorder") {
      if (current.order === patch.order) continue;
      updated = { ...current, order: patch.order };
      beforeLayer = { kind: "structure", order: current.order };
      afterLayer = { kind: "structure", order: patch.order };
    } else {
      const before = propertiesLayer(current, command.viewportScope);
      updated =
        patch.op === "replace-layer"
          ? replaceLayer(current, patch.values, command.viewportScope)
          : applySet(current, patch.values, command.viewportScope);
      const after = propertiesLayer(updated, command.viewportScope);
      if (sameProperties(before, after)) continue;
      beforeLayer = { kind: "properties", values: before };
      afterLayer = { kind: "properties", values: after };
    }
    const entry: RevisionEntry = {
      schemaVersion: 1,
      revisionId: makeId("rev"),
      commandId: command.commandId,
      elementId: id,
      committedAt,
      source: command.source,
      viewportScope: command.viewportScope,
      beforeLayer,
      afterLayer,
      templateVersion: nextVersion,
      intent: revisionIntent(command),
    };
    elements[id] = { ...updated, history: [...current.history, entry] };
    changed = true;
  }
  return changed ? { ...state, version: nextVersion, elements } : state;
}

export function applyAtomicRestoreTransaction(
  state: TemplateState,
  transaction: AtomicRestoreTransaction,
): TemplateState {
  if (!transaction.commands.length) return state;
  const nextVersion = state.version + 1;
  const committedAt = Date.now();
  const elements = { ...state.elements };

  for (const command of transaction.commands) {
    const id = command.targetIds[0];
    const current = elements[id];
    const patch = command.changes[id];
    let updated: TemplateElement;
    let beforeLayer: RevisionEntry["beforeLayer"];
    let afterLayer: RevisionEntry["afterLayer"];

    if (patch.op === "reorder") {
      updated = { ...current, order: patch.order };
      beforeLayer = { kind: "structure", order: current.order };
      afterLayer = { kind: "structure", order: patch.order };
    } else {
      const before = propertiesLayer(current, command.viewportScope);
      updated = replaceLayer(current, patch.values, command.viewportScope);
      const after = propertiesLayer(updated, command.viewportScope);
      beforeLayer = { kind: "properties", values: before };
      afterLayer = { kind: "properties", values: after };
    }

    const entry: RevisionEntry = {
      schemaVersion: 1,
      revisionId: makeId("rev"),
      commandId: transaction.transactionId,
      elementId: id,
      committedAt,
      source: "restore",
      viewportScope: command.viewportScope,
      beforeLayer,
      afterLayer,
      templateVersion: nextVersion,
      intent: {
        kind: "global-restore",
        restoredFromCheckpointId: transaction.restoredFromCheckpointId,
      },
    };
    elements[id] = { ...updated, history: [...current.history, entry] };
  }

  return { ...state, version: nextVersion, elements };
}
