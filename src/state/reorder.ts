import type { ElementId, TemplateElement, TemplateState } from "./types";

export type ReorderPosition = "first" | "last" | "earlier" | "later";

export function orderedSiblings(
  state: TemplateState,
  element: TemplateElement,
): TemplateElement[] {
  if (element.parentId === null) return [];
  return Object.values(state.elements)
    .filter((candidate) => candidate.parentId === element.parentId)
    .sort(
      (left, right) =>
        left.order - right.order || left.id.localeCompare(right.id),
    );
}

function between(left: number, right: number): number {
  const midpoint = left + (right - left) / 2;
  return midpoint === left || midpoint === right ? left + 0.5 : midpoint;
}

export function orderForPosition(
  state: TemplateState,
  elementId: ElementId,
  position: ReorderPosition,
): number | null {
  const element = state.elements[elementId];
  if (!element || element.parentId === null) return null;
  const siblings = orderedSiblings(state, element);
  const index = siblings.findIndex((candidate) => candidate.id === elementId);
  if (index < 0 || siblings.length < 2) return null;

  if (position === "first") return index === 0 ? null : siblings[0].order - 1;
  if (position === "last")
    return index === siblings.length - 1 ? null : siblings.at(-1)!.order + 1;
  if (position === "earlier") {
    if (index === 0) return null;
    return index === 1
      ? siblings[0].order - 1
      : between(siblings[index - 2].order, siblings[index - 1].order);
  }
  if (index === siblings.length - 1) return null;
  return index === siblings.length - 2
    ? siblings.at(-1)!.order + 1
    : between(siblings[index + 1].order, siblings[index + 2].order);
}
