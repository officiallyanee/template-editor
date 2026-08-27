import { makeId } from "../../utils/id";
import type {
  EditCommand,
  RevisionEntry,
  TemplateState,
} from "../../state/types";
export function restoreCommand(
  state: TemplateState,
  elementId: string,
  entry: RevisionEntry,
): EditCommand {
  const change =
    entry.afterLayer.kind === "structure"
      ? { op: "reorder" as const, order: entry.afterLayer.order }
      : { op: "replace-layer" as const, values: entry.afterLayer.values };
  return {
    commandId: makeId("restore"),
    source: "restore",
    targetIds: [elementId],
    viewportScope: entry.viewportScope,
    baseRevision: state.version,
    changes: { [elementId]: change },
    meta: { restoredFromRevisionId: entry.revisionId },
  };
}
