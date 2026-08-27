import type { EditCommand, PipelineError, TemplateState } from "../types";
export function validateRevision(
  state: TemplateState,
  command: EditCommand,
): PipelineError | null {
  return command.baseRevision === state.version
    ? null
    : {
        code: "STALE_REVISION",
        detail: `This edit targets version ${command.baseRevision}, but the page is now version ${state.version}. Re-run the edit.`,
      };
}
