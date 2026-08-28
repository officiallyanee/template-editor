import { applyAtomicRestoreTransaction, applyEditCommand } from "./reducer";
import type {
  AtomicRestoreTransaction,
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

export function dispatchAtomicRestore(
  state: TemplateState,
  transaction: AtomicRestoreTransaction,
): PipelineResult {
  if (
    !transaction.transactionId ||
    !transaction.restoredFromCheckpointId ||
    !Array.isArray(transaction.commands)
  )
    return {
      ok: false,
      error: {
        code: "INVALID_SHAPE",
        detail: "The saved-version restore transaction is incomplete.",
      },
    };
  if (transaction.baseRevision !== state.version)
    return {
      ok: false,
      error: {
        code: "STALE_REVISION",
        detail: `This restore targets version ${transaction.baseRevision}, but the template is now version ${state.version}. Preview it again.`,
      },
    };

  const scopes = new Set<string>();
  for (const command of transaction.commands) {
    const id = command.targetIds[0];
    const patch = command.changes[id];
    const key = `${id}:${patch?.op === "reorder" ? "structure" : command.viewportScope}`;
    if (
      command.commandId !== transaction.transactionId ||
      command.source !== "restore" ||
      command.baseRevision !== transaction.baseRevision ||
      command.targetIds.length !== 1 ||
      (patch?.op !== "replace-layer" && patch?.op !== "reorder") ||
      (patch.op === "reorder" && command.viewportScope !== "all") ||
      scopes.has(key)
    )
      return {
        ok: false,
        error: {
          code: "INVALID_SHAPE",
          detail:
            "The saved-version restore contains an invalid or duplicate layer operation.",
        },
      };
    scopes.add(key);
    const error = validateCommand(state, command);
    if (error) return { ok: false, error };
  }

  return {
    ok: true,
    state: applyAtomicRestoreTransaction(state, transaction),
  };
}
