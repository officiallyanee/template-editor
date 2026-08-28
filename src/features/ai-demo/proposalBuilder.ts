import { validateCommand } from "../../state/pipeline";
import { resolved } from "../../state/resolver";
import type {
  EditCommand,
  ElementProperties,
  PendingProposal,
  TemplateElement,
  TemplateState,
  Viewport,
  ViewportScope,
} from "../../state/types";
import { deterministicId } from "../../utils/deterministicId";
import { contrastRatio, meetsContrast, requiredTextContrast } from "./contrast";

function contextualBackground(
  state: TemplateState,
  element: TemplateElement,
  viewport: Viewport,
  values: Partial<ElementProperties>,
): string {
  if (values.backgroundColor) return values.backgroundColor;
  const current = resolved(element, viewport);
  if (current.backgroundColor) return current.backgroundColor;
  const parent = element.parentId
    ? state.elements[element.parentId]
    : undefined;
  return parent
    ? (resolved(parent, viewport).backgroundColor ?? "#ffffff")
    : "#ffffff";
}

function contrastMetrics(
  state: TemplateState,
  element: TemplateElement,
  viewport: Viewport,
  before: ElementProperties,
  after: Partial<ElementProperties>,
): PendingProposal["metrics"] {
  if (!after.color && !after.backgroundColor) return undefined;
  const beforeForeground = before.color;
  const afterForeground = after.color ?? beforeForeground;
  if (!beforeForeground || !afterForeground) return undefined;
  const beforeBackground = contextualBackground(state, element, viewport, {});
  const afterBackground = contextualBackground(state, element, viewport, after);
  const required = requiredTextContrast(before.fontSize, before.fontWeight);
  return {
    contrastBefore: contrastRatio(beforeForeground, beforeBackground),
    contrastAfter: contrastRatio(afterForeground, afterBackground),
    requiredContrast: required,
  };
}

export function buildProposal(
  state: TemplateState,
  element: TemplateElement,
  selectedIds: string[],
  instruction: string,
  strategyId: string,
  scope: ViewportScope,
  viewport: Viewport,
  baseRevision: number,
  after: Partial<ElementProperties>,
): PendingProposal | { error: { code: string; detail: string } } | null {
  const current = scope === "all" ? element.base : resolved(element, scope);
  const changedValues = Object.fromEntries(
    Object.entries(after).filter(
      ([field, value]) => current[field as keyof ElementProperties] !== value,
    ),
  ) as Partial<ElementProperties>;
  if (!Object.keys(changedValues).length) return null;
  const metrics = contrastMetrics(
    state,
    element,
    viewport,
    current,
    changedValues,
  );
  const isExplicitUserChoice = strategyId === "explicit-color-change";
  if (
    !isExplicitUserChoice &&
    metrics &&
    !meetsContrast(metrics.contrastAfter, metrics.requiredContrast)
  )
    return {
      error: {
        code: "CONTRAST_FAILURE",
        detail: `${element.label} would have ${metrics.contrastAfter.toFixed(2)}:1 contrast; ${metrics.requiredContrast}:1 is required.`,
      },
    };
  const seed = `${instruction}|${strategyId}|${element.id}|${scope}|${baseRevision}`;
  const command: EditCommand = {
    commandId: deterministicId("ai", seed),
    source: "ai",
    targetIds: [element.id],
    viewportScope: scope,
    baseRevision,
    changes: { [element.id]: { op: "set", values: changedValues } },
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
    before: Object.fromEntries(
      Object.keys(changedValues).map((key) => [
        key,
        current[key as keyof ElementProperties],
      ]),
    ),
    after: changedValues,
    status: "pending",
    metrics,
  };
}
