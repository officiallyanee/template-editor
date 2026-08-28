import { elementSchemas } from "../../features/code-editor/elementSchemas";
import type { EditCommand, PipelineError, TemplateState } from "../types";
export function validateFields(
  state: TemplateState,
  command: EditCommand,
): PipelineError | null {
  for (const id of command.targetIds) {
    const patch = command.changes[id];
    if (patch.op === "reorder") {
      if (!Number.isFinite(patch.order))
        return {
          code: "INVALID_FIELD",
          detail: "Order must be a finite number.",
        };
      continue;
    }
    const result = elementSchemas[state.elements[id].type].safeParse(
      patch.values,
    );
    if (!result.success)
      return {
        code: "INVALID_FIELD",
        detail:
          result.error.issues[0]?.message ?? "One or more values are invalid.",
      };
  }
  return null;
}
