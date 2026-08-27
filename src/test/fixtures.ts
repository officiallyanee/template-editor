import { starterTemplate } from "../templates/starterTemplate";
import type {
  EditCommand,
  ElementProperties,
  TemplateState,
  ViewportScope,
} from "../state/types";
export function freshState(): TemplateState {
  return structuredClone(starterTemplate);
}
export function command(
  state: TemplateState,
  id = "cta",
  values: Partial<ElementProperties> = { width: 200 },
  scope: ViewportScope = "all",
  source: EditCommand["source"] = "canvas",
): EditCommand {
  return {
    commandId: `test-${source}-${id}-${scope}`,
    source,
    targetIds: [id],
    viewportScope: scope,
    baseRevision: state.version,
    changes: { [id]: { op: "set", values } },
  };
}
