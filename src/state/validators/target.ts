import type { EditCommand, PipelineError, TemplateState } from "../types";
export function validateTargets(
  state: TemplateState,
  command: EditCommand,
): PipelineError | null {
  const missing = command.targetIds.filter((id) => !state.elements[id]);
  return missing.length
    ? {
        code: "UNKNOWN_TARGET",
        detail: `Unknown element: ${missing.join(", ")}. Refresh your selection.`,
      }
    : null;
}
