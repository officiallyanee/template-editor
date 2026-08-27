import type {
  EditCommand,
  ElementId,
  ElementProperties,
  TemplateState,
  ViewportScope,
} from "../../state/types";
import { makeId } from "../../utils/id";
export function canvasEditToCommand(
  template: TemplateState,
  id: ElementId,
  scope: ViewportScope,
  values: Partial<ElementProperties>,
): EditCommand {
  return {
    commandId: makeId("canvas"),
    source: "canvas",
    targetIds: [id],
    viewportScope: scope,
    baseRevision: template.version,
    changes: { [id]: { op: "set", values } },
  };
}
