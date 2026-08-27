import type {
  EditCommand,
  ElementProperties,
  PendingProposal,
  PropertyPatch,
  TemplateElement,
  Viewport,
} from "./types";

export function resolved(
  element: TemplateElement,
  viewport: Viewport,
): ElementProperties {
  return { ...element.base, ...(element.overrides[viewport] ?? {}) };
}

export function applyPatchToElement(
  element: TemplateElement,
  patch: PropertyPatch,
  scope: EditCommand["viewportScope"],
): TemplateElement {
  if (patch.op === "reorder") {
    return { ...element, order: patch.order };
  }
  if (patch.op === "replace-layer") {
    if (scope === "all") {
      return { ...element, base: patch.values };
    }
    const nextOverrides = { ...element.overrides };
    if (Object.keys(patch.values).length === 0) {
      delete nextOverrides[scope];
    } else {
      nextOverrides[scope] = patch.values;
    }
    return { ...element, overrides: nextOverrides };
  }
  if (scope === "all") {
    return { ...element, base: { ...element.base, ...patch.values } };
  }
  return {
    ...element,
    overrides: {
      ...element.overrides,
      [scope]: { ...(element.overrides[scope] ?? {}), ...patch.values },
    },
  };
}

export function resolvedWithProposal(
  element: TemplateElement,
  viewport: Viewport,
  proposal?: PendingProposal,
): ElementProperties {
  const current = resolved(element, viewport);
  if (!proposal || proposal.status !== "pending") return current;
  const patch = proposal.command.changes[element.id];
  if (!patch || patch.op === "reorder") return current;
  const simulated = applyPatchToElement(
    element,
    patch,
    proposal.command.viewportScope,
  );
  return resolved(simulated, viewport);
}
