import { EDITABLE_FIELDS } from "../allowedFields";
import type {
  EditCommand,
  PipelineError,
  ScopeContext,
  TemplateState,
} from "../types";

export function validateScope(
  state: TemplateState,
  command: EditCommand,
  context: ScopeContext = {},
): PipelineError | null {
  if (command.source === "ai") {
    if (
      !context.selectedIds ||
      command.targetIds.some((id) => !context.selectedIds!.includes(id))
    )
      return {
        code: "OUT_OF_SCOPE",
        detail:
          "The AI proposal references an element outside the original selection.",
      };
    if (
      context.requestedScope &&
      context.requestedScope !== command.viewportScope
    )
      return {
        code: "OUT_OF_SCOPE",
        detail: "The AI proposal changed the requested viewport scope.",
      };
  }
  for (const id of command.targetIds) {
    const patch = command.changes[id];
    if (patch.op === "reorder") continue;
    const allowed = EDITABLE_FIELDS[state.elements[id].type];
    const invalid = Object.keys(patch.values).find(
      (field) => !allowed.includes(field),
    );
    if (invalid)
      return {
        code: "OUT_OF_SCOPE",
        detail: `${invalid} is locked for ${state.elements[id].type} elements.`,
      };
  }
  return null;
}
