import type { TemplateState } from "../state/types";
import { starterTemplate } from "../templates/starterTemplate";
const KEY = "scoped-template-editor:v1";

/**
 * Migrate a parsed TemplateState from localStorage.
 * Strips RevisionEntry items that are missing beforeLayer or afterLayer
 * (written before those fields were introduced) so historyStore never
 * receives undefined layer snapshots.
 */
function migrate(state: TemplateState): TemplateState {
  const elements = Object.fromEntries(
    Object.entries(state.elements).map(([id, el]) => [
      id,
      {
        ...el,
        history: el.history.filter(
          (entry) =>
            entry.beforeLayer != null &&
            entry.beforeLayer.kind != null &&
            entry.afterLayer != null &&
            entry.afterLayer.kind != null,
        ),
      },
    ]),
  );
  return { ...state, elements };
}

export function loadTemplate(): TemplateState {
  try {
    const value = localStorage.getItem(KEY);
    return value
      ? migrate(JSON.parse(value) as TemplateState)
      : structuredClone(starterTemplate);
  } catch {
    return structuredClone(starterTemplate);
  }
}
export function saveTemplate(state: TemplateState): void {
  localStorage.setItem(KEY, JSON.stringify(state));
}
export function resetTemplate(): TemplateState {
  localStorage.removeItem(KEY);
  return structuredClone(starterTemplate);
}
