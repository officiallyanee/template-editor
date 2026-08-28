import type { TemplateState } from "../state/types";
import type { GlobalCheckpoint } from "../state/globalHistory";
import { starterTemplate } from "../templates/starterTemplate";
const KEY = "scoped-template-editor:v1";
const CHECKPOINTS_KEY = "scoped-template-checkpoints:v1";

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
        base:
          el.base.text === "BRIGHTPATH STUDIO"
            ? { ...el.base, text: "EXAMPLE STUDIO" }
            : el.base,
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
  return {
    ...state,
    templateId:
      state.templateId === "brightpath-studio"
        ? "example-studio"
        : state.templateId,
    elements,
  };
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
export function loadGlobalCheckpoints(): GlobalCheckpoint[] {
  try {
    const value = localStorage.getItem(CHECKPOINTS_KEY);
    if (!value) return [];
    const parsed = JSON.parse(value) as GlobalCheckpoint[];
    return parsed.filter(
      (checkpoint) =>
        checkpoint.schemaVersion === 1 &&
        checkpoint.toTemplateVersion > checkpoint.fromTemplateVersion,
    );
  } catch {
    return [];
  }
}
export function saveGlobalCheckpoints(items: GlobalCheckpoint[]): void {
  localStorage.setItem(CHECKPOINTS_KEY, JSON.stringify(items));
}
export function resetTemplate(): TemplateState {
  localStorage.removeItem(KEY);
  localStorage.removeItem(CHECKPOINTS_KEY);
  return structuredClone(starterTemplate);
}
