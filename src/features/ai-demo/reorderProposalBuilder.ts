import { validateCommand } from "../../state/pipeline";
import { orderForPosition, type ReorderPosition } from "../../state/reorder";
import type {
  EditCommand,
  PendingProposal,
  TemplateState,
  ViewportScope,
} from "../../state/types";
import { deterministicId } from "../../utils/deterministicId";

type ReorderProposalResult =
  PendingProposal | { error: { code: string; detail: string } } | null;

export function buildReorderProposal(
  state: TemplateState,
  selectedIds: string[],
  instruction: string,
  position: Extract<ReorderPosition, "first" | "last">,
  scope: ViewportScope,
  baseRevision: number,
): ReorderProposalResult {
  if (selectedIds.length !== 1)
    return {
      error: {
        code: "OUT_OF_SCOPE",
        detail:
          "Reorder one element at a time so the destination is unambiguous.",
      },
    };
  if (scope !== "all")
    return {
      error: {
        code: "OUT_OF_SCOPE",
        detail:
          "Order is shared across viewports. Switch Edit Scope to All Views.",
      },
    };
  const elementId = selectedIds[0];
  const element = state.elements[elementId];
  if (!element || element.parentId === null)
    return {
      error: {
        code: "UNSUPPORTED",
        detail: "The Page root cannot be reordered.",
      },
    };
  const order = orderForPosition(state, elementId, position);
  if (order === null) return null;

  const strategyId = position === "first" ? "reorder-first" : "reorder-last";
  const seed = `${instruction}|${strategyId}|${elementId}|all|${baseRevision}`;
  const command: EditCommand = {
    commandId: deterministicId("ai", seed),
    source: "ai",
    targetIds: [elementId],
    viewportScope: "all",
    baseRevision,
    changes: { [elementId]: { op: "reorder", order } },
    meta: { instruction, strategyId },
  };
  const error = validateCommand(state, command, {
    selectedIds,
    requestedScope: scope,
  });
  if (error) return { error };
  return {
    id: deterministicId("proposal", seed),
    selectionSnapshot: [...selectedIds],
    command,
    before: { order: element.order },
    after: { order },
    status: "pending",
  };
}
