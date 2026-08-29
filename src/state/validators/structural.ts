import type { EditCommand, PipelineError } from "../types";

export function validateStructural(command: EditCommand): PipelineError | null {
  if (
    !command ||
    typeof command.commandId !== "string" ||
    !Array.isArray(command.targetIds) ||
    command.targetIds.length === 0 ||
    !command.changes ||
    typeof command.baseRevision !== "number"
  ) {
    return {
      code: "INVALID_SHAPE",
      detail:
        "The edit command is incomplete. Refresh the editor and try again.",
    };
  }
  if (command.targetIds.some((id) => !command.changes[id]))
    return {
      code: "INVALID_SHAPE",
      detail: "Every target needs a matching change.",
    };
  if (
    command.source !== "restore" &&
    command.targetIds.some((id) => command.changes[id].op === "replace-layer")
  )
    return {
      code: "INVALID_SHAPE",
      detail: "Only recovery commands may replace an exact element layer.",
    };
  return null;
}
