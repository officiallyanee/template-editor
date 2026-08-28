import { revisionFields } from "./historyStore";
import type {
  AtomicRestoreTransaction,
  EditSource,
  ElementId,
  ElementLayerSnapshot,
  ElementProperties,
  TemplateElement,
  Viewport,
  ViewportScope,
  TemplateState,
} from "./types";

export interface GlobalCommitEntry {
  elementId: ElementId;
  revisionId: string;
  fields: string[];
}

export interface GlobalCommitSummary {
  commandId: string;
  templateVersion: number;
  committedAt: number;
  source: EditSource;
  viewportScopes: ViewportScope[];
  entries: GlobalCommitEntry[];
}

export interface GlobalCheckpointEntry {
  elementId: ElementId;
  revisionIds: string[];
  fields: string[];
}

export interface GlobalCheckpoint {
  schemaVersion: 1 | 2;
  checkpointId: string;
  savedAt: number;
  reason: "manual" | "session-end" | "global-restore";
  fromTemplateVersion: number;
  toTemplateVersion: number;
  commandCount: number;
  entries: GlobalCheckpointEntry[];
  templateSnapshot?: GlobalTemplateSnapshot;
  restoredFromCheckpointId?: string;
}

export interface SavedElementSnapshot {
  id: ElementId;
  type: TemplateElement["type"];
  label: string;
  parentId: ElementId | null;
  order: number;
  base: ElementProperties;
  overrides: Partial<Record<Viewport, Partial<ElementProperties>>>;
}

export interface GlobalTemplateSnapshot {
  templateId: string;
  rootId: ElementId;
  elements: Record<ElementId, SavedElementSnapshot>;
}

export type GlobalRestorePlan =
  | {
      ok: true;
      transaction: AtomicRestoreTransaction;
      changes: GlobalRestoreChange[];
    }
  | { ok: false; detail: string };

export interface GlobalRestoreChange {
  elementId: ElementId;
  viewportScope: ViewportScope;
  beforeLayer: ElementLayerSnapshot;
  afterLayer: ElementLayerSnapshot;
  fields: string[];
}

export function buildGlobalTimeline(
  elements: Record<ElementId, TemplateElement>,
): GlobalCommitSummary[] {
  const commits = new Map<string, GlobalCommitSummary>();
  for (const element of Object.values(elements)) {
    for (const revision of element.history) {
      const existing = commits.get(revision.commandId);
      const entry = {
        elementId: revision.elementId,
        revisionId: revision.revisionId,
        fields: revisionFields(revision),
      };
      if (existing) {
        existing.entries.push(entry);
        if (!existing.viewportScopes.includes(revision.viewportScope))
          existing.viewportScopes.push(revision.viewportScope);
        continue;
      }
      commits.set(revision.commandId, {
        commandId: revision.commandId,
        templateVersion: revision.templateVersion,
        committedAt: revision.committedAt,
        source: revision.source,
        viewportScopes: [revision.viewportScope],
        entries: [entry],
      });
    }
  }
  return [...commits.values()]
    .map((commit) => ({
      ...commit,
      entries: [...commit.entries].sort((left, right) =>
        left.elementId.localeCompare(right.elementId),
      ),
      viewportScopes: [...commit.viewportScopes].sort(),
    }))
    .sort(
      (left, right) =>
        right.templateVersion - left.templateVersion ||
        right.committedAt - left.committedAt,
    );
}

export function latestCheckpointVersion(
  checkpoints: GlobalCheckpoint[],
): number {
  return checkpoints.reduce(
    (latest, checkpoint) => Math.max(latest, checkpoint.toTemplateVersion),
    1,
  );
}

export function hasUnsavedVersion(
  templateVersion: number,
  checkpoints: GlobalCheckpoint[],
): boolean {
  return templateVersion > latestCheckpointVersion(checkpoints);
}

export function createGlobalCheckpoint(
  template: TemplateState,
  checkpoints: GlobalCheckpoint[],
  reason: GlobalCheckpoint["reason"],
  savedAt = Date.now(),
  restoredFromCheckpointId?: string,
): GlobalCheckpoint | null {
  const fromTemplateVersion = latestCheckpointVersion(checkpoints);
  if (template.version <= fromTemplateVersion) return null;

  const commits = buildGlobalTimeline(template.elements).filter(
    (commit) =>
      commit.templateVersion > fromTemplateVersion &&
      commit.templateVersion <= template.version,
  );
  if (!commits.length) return null;

  const byElement = new Map<ElementId, GlobalCheckpointEntry>();
  for (const commit of commits) {
    for (const entry of commit.entries) {
      const existing = byElement.get(entry.elementId);
      if (existing) {
        existing.revisionIds.push(entry.revisionId);
        existing.fields = [...new Set([...existing.fields, ...entry.fields])];
      } else {
        byElement.set(entry.elementId, {
          elementId: entry.elementId,
          revisionIds: [entry.revisionId],
          fields: [...entry.fields],
        });
      }
    }
  }

  return {
    schemaVersion: 2,
    checkpointId: `checkpoint-${template.version}-${savedAt}`,
    savedAt,
    reason,
    fromTemplateVersion,
    toTemplateVersion: template.version,
    commandCount: commits.length,
    entries: [...byElement.values()].sort((left, right) =>
      left.elementId.localeCompare(right.elementId),
    ),
    templateSnapshot: snapshotTemplate(template),
    restoredFromCheckpointId,
  };
}

export function snapshotTemplate(
  template: TemplateState,
): GlobalTemplateSnapshot {
  return {
    templateId: template.templateId,
    rootId: template.rootId,
    elements: Object.fromEntries(
      Object.entries(template.elements).map(([id, element]) => [
        id,
        {
          id: element.id,
          type: element.type,
          label: element.label,
          parentId: element.parentId,
          order: element.order,
          base: { ...element.base },
          overrides: Object.fromEntries(
            Object.entries(element.overrides).map(([scope, values]) => [
              scope,
              { ...values },
            ]),
          ),
        },
      ]),
    ),
  };
}
