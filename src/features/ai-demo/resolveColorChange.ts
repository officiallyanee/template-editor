import { EDITABLE_FIELDS } from "../../state/allowedFields";
import type { ElementProperties, TemplateElement } from "../../state/types";
import type { ColorField } from "./promptParser";

export function explicitColorValues(
  field: ColorField | null,
  from: string,
  to: string,
  element: TemplateElement,
  current: ElementProperties,
): Partial<ElementProperties> | { error: { code: string; detail: string } } {
  let resolvedField = field;
  if (!resolvedField) {
    const candidates = (["color", "backgroundColor"] as const).filter(
      (candidate) =>
        EDITABLE_FIELDS[element.type].includes(candidate) && current[candidate],
    );
    if (candidates.length !== 1)
      return {
        error: {
          code: "AMBIGUOUS_COLOR",
          detail: `${element.label} has both text and background color. Specify which one to change.`,
        },
      };
    [resolvedField] = candidates;
  }
  if (!EDITABLE_FIELDS[element.type].includes(resolvedField))
    return {
      error: {
        code: "OUT_OF_SCOPE",
        detail: `${resolvedField} is locked for ${element.type} elements.`,
      },
    };
  if (current[resolvedField]?.toLowerCase() !== from)
    return {
      error: {
        code: "SOURCE_MISMATCH",
        detail: `${element.label} is currently ${current[resolvedField] ?? "unset"}, not ${from}.`,
      },
    };
  return { [resolvedField]: to };
}
