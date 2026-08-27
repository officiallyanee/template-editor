import { elementSchemas } from "./elementSchemas";
import { shallowDiff } from "../../utils/diff";
import { makeId } from "../../utils/id";
import { resolved } from "../../state/resolver";
import type {
  EditCommand,
  TemplateElement,
  TemplateState,
  Viewport,
  ViewportScope,
} from "../../state/types";

export type ParseResult =
  { ok: true; command: EditCommand } | { ok: false; error: string };
export function parseAndDiff(
  json: string,
  element: TemplateElement,
  viewport: Viewport,
  scope: ViewportScope,
  template: TemplateState,
): ParseResult {
  try {
    const parsed: unknown = JSON.parse(json);
    const result = elementSchemas[element.type].safeParse(parsed);
    if (!result.success)
      return {
        ok: false,
        error:
          result.error.issues[0]?.message ??
          "The JSON does not match this element.",
      };
    const values = shallowDiff(
      resolved(element, viewport) as Record<string, unknown>,
      result.data as Record<string, unknown>,
    );
    return {
      ok: true,
      command: {
        commandId: makeId("code"),
        source: "code",
        targetIds: [element.id],
        viewportScope: scope,
        baseRevision: template.version,
        changes: { [element.id]: { op: "set", values } },
      },
    };
  } catch {
    return {
      ok: false,
      error: "Use valid JSON. Check commas, quotes, and brackets.",
    };
  }
}
