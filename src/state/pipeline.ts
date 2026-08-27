import { applyEditCommand } from "./reducer";
import type {
  EditCommand,
  PipelineError,
  PipelineResult,
  ScopeContext,
  TemplateState,
} from "./types";
import { validateFields } from "./validators/field";
import { validateRevision } from "./validators/revision";
import { validateScope } from "./validators/scope";
import { validateStructural } from "./validators/structural";
import { validateTargets } from "./validators/target";

export function validateCommand(
  state: TemplateState,
  command: EditCommand,
  context: ScopeContext = {},
): PipelineError | null {
  return (
    validateStructural(command) ??
    validateRevision(state, command) ??
    validateTargets(state, command) ??
    validateScope(state, command, context) ??
    validateFields(state, command)
  );
}
export function dispatchCommand(
  state: TemplateState,
  command: EditCommand,
  context: ScopeContext = {},
): PipelineResult {
  const error = validateCommand(state, command, context);
  return error
    ? { ok: false, error }
    : { ok: true, state: applyEditCommand(state, command) };
}
