import type { TemplateState } from "../state/types";
import type { GlobalCheckpoint } from "../state/globalHistory";
import { starterTemplate } from "../templates/starterTemplate";
const LEGACY_TEMPLATE_KEY = "scoped-template-editor:v1";
const LEGACY_CHECKPOINTS_KEY = "scoped-template-checkpoints:v1";
const ACTIVE_TEMPLATE_KEY = "scoped-active-template:v1";
const TEMPLATE_KEY_PREFIX = "scoped-template-editor:v2:";
const CHECKPOINTS_KEY_PREFIX = "scoped-template-checkpoints:v2:";

const templateKey = (templateId: string) =>
  `${TEMPLATE_KEY_PREFIX}${templateId}`;
const checkpointsKey = (templateId: string) =>
  `${CHECKPOINTS_KEY_PREFIX}${templateId}`;

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

function parseTemplate(value: string | null): TemplateState | null {
  try {
    return value ? migrate(JSON.parse(value) as TemplateState) : null;
  } catch {
    return null;
  }
}

export function loadActiveTemplateId(): string {
  const active = localStorage.getItem(ACTIVE_TEMPLATE_KEY);
  if (active) return active;
  return (
    parseTemplate(localStorage.getItem(LEGACY_TEMPLATE_KEY))?.templateId ??
    starterTemplate.templateId
  );
}

export function loadTemplate(
  fallback: TemplateState = starterTemplate,
): TemplateState {
  const stored = parseTemplate(
    localStorage.getItem(templateKey(fallback.templateId)),
  );
  if (stored?.templateId === fallback.templateId) return stored;

  const legacy = parseTemplate(localStorage.getItem(LEGACY_TEMPLATE_KEY));
  if (legacy?.templateId === fallback.templateId) {
    saveTemplate(legacy);
    return legacy;
  }
  return structuredClone(fallback);
}

export function saveTemplate(state: TemplateState): void {
  localStorage.setItem(templateKey(state.templateId), JSON.stringify(state));
  localStorage.setItem(ACTIVE_TEMPLATE_KEY, state.templateId);
}

function parseCheckpoints(value: string | null): GlobalCheckpoint[] {
  try {
    if (!value) return [];
    const parsed = JSON.parse(value) as GlobalCheckpoint[];
    return parsed.filter(
      (checkpoint) =>
        (checkpoint.schemaVersion === 1 || checkpoint.schemaVersion === 2) &&
        checkpoint.toTemplateVersion > checkpoint.fromTemplateVersion,
    );
  } catch {
    return [];
  }
}

export function loadGlobalCheckpoints(
  templateId = loadActiveTemplateId(),
): GlobalCheckpoint[] {
  const stored = localStorage.getItem(checkpointsKey(templateId));
  if (stored) return parseCheckpoints(stored);

  const legacyTemplate = parseTemplate(
    localStorage.getItem(LEGACY_TEMPLATE_KEY),
  );
  return legacyTemplate?.templateId === templateId
    ? parseCheckpoints(localStorage.getItem(LEGACY_CHECKPOINTS_KEY))
    : [];
}

export function saveGlobalCheckpoints(
  templateId: string,
  items: GlobalCheckpoint[],
): void {
  localStorage.setItem(checkpointsKey(templateId), JSON.stringify(items));
}

export function resetTemplate(
  template: TemplateState = starterTemplate,
): TemplateState {
  localStorage.removeItem(templateKey(template.templateId));
  localStorage.removeItem(checkpointsKey(template.templateId));
  const next = structuredClone(template);
  saveTemplate(next);
  saveGlobalCheckpoints(next.templateId, []);
  return next;
}
