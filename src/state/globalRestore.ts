import type {
  EditCommand,
  ElementProperties,
  TemplateElement,
  TemplateState,
  Viewport,
  ViewportScope,
} from "./types";
import type {
  GlobalCheckpoint,
  GlobalRestoreChange,
  GlobalRestorePlan,
  GlobalTemplateSnapshot,
} from "./globalHistory";
import { createGlobalCheckpoint } from "./globalHistory";
import { dispatchAtomicRestore } from "./pipeline";
import { makeId } from "../utils/id";

const VIEWPORTS: Viewport[] = ["desktop", "tablet", "mobile"];

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

function changedFields(
  before: ElementProperties,
  after: ElementProperties,
): string[] {
  return [...new Set([...Object.keys(before), ...Object.keys(after)])]
    .filter(
      (key) =>
        before[key as keyof ElementProperties] !==
        after[key as keyof ElementProperties],
    )
    .sort();
}

function identityError(
  current: TemplateState,
  snapshot: GlobalTemplateSnapshot,
): string | null {
  if (
    current.templateId !== snapshot.templateId ||
    current.rootId !== snapshot.rootId
  )
    return "This saved version belongs to a different template.";
  const currentIds = Object.keys(current.elements).sort();
  const savedIds = Object.keys(snapshot.elements).sort();
  if (currentIds.join("\0") !== savedIds.join("\0"))
    return "This saved version has a different element set. Creating and deleting elements is not restorable yet.";
  for (const id of currentIds) {
    const element = current.elements[id];
    const saved = snapshot.elements[id];
    if (
      element.id !== saved.id ||
      element.type !== saved.type ||
      element.label !== saved.label ||
      element.parentId !== saved.parentId
    )
      return `The structure of ${element.label} no longer matches this saved version.`;
  }
  return null;
}

function propertiesChange(
  elementId: string,
  viewportScope: ViewportScope,
  before: ElementProperties,
  after: ElementProperties,
): GlobalRestoreChange | null {
  if (sameProperties(before, after)) return null;
  return {
    elementId,
    viewportScope,
    beforeLayer: { kind: "properties", values: { ...before } },
    afterLayer: { kind: "properties", values: { ...after } },
    fields: changedFields(before, after),
  };
}

function changeToCommand(
  change: GlobalRestoreChange,
  transactionId: string,
  baseRevision: number,
  checkpointId: string,
): EditCommand {
  const patch =
    change.afterLayer.kind === "structure"
      ? { op: "reorder" as const, order: change.afterLayer.order }
      : { op: "replace-layer" as const, values: change.afterLayer.values };
  return {
    commandId: transactionId,
    source: "restore",
    targetIds: [change.elementId],
    viewportScope: change.viewportScope,
    baseRevision,
    changes: { [change.elementId]: patch },
    meta: { restoredFromCheckpointId: checkpointId },
  };
}

export function planGlobalRestore(
  current: TemplateState,
  checkpoint: GlobalCheckpoint,
  transactionId = `restore-${checkpoint.checkpointId}-${current.version}`,
): GlobalRestorePlan {
  const snapshot = checkpoint.templateSnapshot;
  if (!snapshot)
    return {
      ok: false,
      detail:
        "This legacy save predates full snapshots and can only be reviewed through element history.",
    };
  const incompatible = identityError(current, snapshot);
  if (incompatible) return { ok: false, detail: incompatible };

  const changes: GlobalRestoreChange[] = [];
  for (const id of Object.keys(current.elements).sort()) {
    const element = current.elements[id];
    const saved = snapshot.elements[id];
    const base = propertiesChange(id, "all", element.base, saved.base);
    if (base) changes.push(base);
    for (const viewport of VIEWPORTS) {
      const override = propertiesChange(
        id,
        viewport,
        element.overrides[viewport] ?? {},
        saved.overrides[viewport] ?? {},
      );
      if (override) changes.push(override);
    }
    if (element.order !== saved.order)
      changes.push({
        elementId: id,
        viewportScope: "all",
        beforeLayer: { kind: "structure", order: element.order },
        afterLayer: { kind: "structure", order: saved.order },
        fields: ["order"],
      });
  }
  return {
    ok: true,
    changes,
    transaction: {
      transactionId,
      baseRevision: current.version,
      restoredFromCheckpointId: checkpoint.checkpointId,
      commands: changes.map((change) =>
        changeToCommand(
          change,
          transactionId,
          current.version,
          checkpoint.checkpointId,
        ),
      ),
    },
  };
}

export function materializeSnapshot(
  current: TemplateState,
  snapshot: GlobalTemplateSnapshot,
): TemplateState {
  const elements = Object.fromEntries(
    Object.entries(snapshot.elements).map(([id, saved]) => [
      id,
      {
        ...saved,
        base: { ...saved.base },
        overrides: structuredClone(saved.overrides),
        history: current.elements[id]?.history ?? [],
      } satisfies TemplateElement,
    ]),
  );
  return { ...current, rootId: snapshot.rootId, elements };
}

export type RestoreCheckpointResult =
  | {
      ok: true;
      changed: boolean;
      template: TemplateState;
      checkpoints: GlobalCheckpoint[];
    }
  | { ok: false; detail: string };

export function restoreGlobalCheckpoint(
  template: TemplateState,
  checkpoints: GlobalCheckpoint[],
  checkpointId: string,
  savedAt = Date.now(),
): RestoreCheckpointResult {
  const checkpoint = checkpoints.find(
    (item) => item.checkpointId === checkpointId,
  );
  if (!checkpoint)
    return { ok: false, detail: "That saved version no longer exists." };
  const plan = planGlobalRestore(
    template,
    checkpoint,
    makeId("global-restore"),
  );
  if (!plan.ok) return plan;
  if (!plan.changes.length)
    return { ok: true, changed: false, template, checkpoints };

  const outcome = dispatchAtomicRestore(template, plan.transaction);
  if (!outcome.ok) return { ok: false, detail: outcome.error.detail };
  const restoredCheckpoint = createGlobalCheckpoint(
    outcome.state,
    checkpoints,
    "global-restore",
    savedAt,
    checkpointId,
  );
  return {
    ok: true,
    changed: true,
    template: outcome.state,
    checkpoints: restoredCheckpoint
      ? [...checkpoints, restoredCheckpoint]
      : checkpoints,
  };
}
