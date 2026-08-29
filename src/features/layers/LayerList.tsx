import {
  Box,
  MousePointer2,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useEditorUi } from "../../app/EditorUiContext";
import { Button } from "../../components/Button";
import { useEditor } from "../../state/StateContext";
import type { TemplateElement, TemplateState } from "../../state/types";
import {
  TEMPLATE_OPTIONS,
  templateOption,
} from "../../templates/templateCatalog";

export function orderedLayerElements(template: TemplateState) {
  const ordered: TemplateElement[] = [];
  const visit = (parentId: string | null) => {
    Object.values(template.elements)
      .filter((element) => element.parentId === parentId)
      .sort(
        (left, right) =>
          left.order - right.order || left.id.localeCompare(right.id),
      )
      .forEach((element) => {
        ordered.push(element);
        visit(element.id);
      });
  };
  visit(null);
  return ordered;
}

export function LayerList() {
  const { state, actions } = useEditor();
  const { state: uiState, actions: uiActions } = useEditorUi();
  const expanded = uiState.layers === "open";
  const activeTemplate = templateOption(state.template.templateId);
  const elements = orderedLayerElements(state.template);
  return (
    <aside
      id="layer-rail"
      className={`flex min-h-0 flex-col overflow-hidden border-r border-border-default py-5 max-lg:hidden ${expanded ? "px-3.5" : "items-center px-2"}`}
      aria-label="Template layers"
    >
      <div
        className={`flex w-full shrink-0 items-start gap-2 px-1 ${expanded ? "justify-between pb-4.5" : "justify-center"}`}
      >
        {expanded && (
          <div id="layer-list-heading" className="min-w-0">
            <label className="mb-2 block">
              <span className="sr-only">Template</span>
              <select
                aria-label="Template"
                name="template"
                className="w-full min-w-0 rounded-lg border border-hairline bg-raised py-1.5 pr-7 pl-2 text-xs font-bold tracking-[.06em] text-primary uppercase"
                value={state.template.templateId}
                onChange={(event) => {
                  const nextId = event.target.value;
                  if (nextId === state.template.templateId) return;
                  actions.switchTemplate(nextId);
                }}
              >
                {TEMPLATE_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
              <span className="mt-1 block truncate text-xs font-medium tracking-normal text-ink-muted normal-case">
                {activeTemplate?.description ?? "Template document"}
              </span>
            </label>
            <h2 className="mb-1.5 text-xl tracking-[-0.2px] text-balance">
              Page Layers
            </h2>
            <p className="m-0 text-xs leading-normal text-ink-muted">
              Choose an element. Hold Shift to add more.
            </p>
          </div>
        )}
        <Button
          aria-controls="layer-list-content"
          aria-expanded={expanded}
          aria-label={expanded ? "Hide Page Layers" : "Show Page Layers"}
          title={expanded ? "Hide Page Layers" : "Show Page Layers"}
          className="shrink-0 px-2.5"
          onClick={uiActions.toggleLayers}
        >
          {expanded ? (
            <PanelLeftClose size={15} aria-hidden="true" />
          ) : (
            <PanelLeftOpen size={15} aria-hidden="true" />
          )}
        </Button>
      </div>

      <div
        id="layer-list-content"
        className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain p-1"
        role="listbox"
        aria-label="Page Layers"
        aria-multiselectable="true"
        hidden={!expanded}
      >
        {expanded &&
          elements.map((element) => {
            const selected = state.selectedIds.includes(element.id);
            const active = state.activeId === element.id;
            return (
              <button
                key={element.id}
                role="option"
                aria-selected={selected}
                data-active={active || undefined}
                className={`grid w-full cursor-pointer grid-cols-[18px_minmax(0,1fr)_16px] items-center gap-2 rounded-none border-0 px-2 py-2 text-left transition-[background-color,color,box-shadow] duration-150 hover:bg-surface-hover ${selected ? "bg-selection text-primary" : "bg-transparent text-secondary"} ${active ? "ring-inset ring-1 ring-primary" : ""}`}
                onClick={(event) =>
                  actions.select(
                    element.id,
                    event.shiftKey || event.metaKey || event.ctrlKey,
                  )
                }
              >
                <Box size={15} aria-hidden="true" />
                <span className="min-w-0">
                  <strong className="block truncate text-sm font-semibold leading-tight">
                    {element.label}
                  </strong>
                  <small className="mt-0.5 block truncate text-xs text-ink-muted capitalize">
                    {element.type}
                    {active ? " · Active" : ""}
                  </small>
                </span>
                {selected && <MousePointer2 size={14} aria-hidden="true" />}
              </button>
            );
          })}
      </div>

      {expanded && (
        <div className="mt-3 flex shrink-0 items-center gap-2.5 border-t border-border-default px-3 pt-3">
          <span className="size-2 shrink-0 rounded-full bg-primary" />
          <div className="min-w-0">
            <strong className="block text-xs leading-tight">
              {state.selectedIds.length}{" "}
              {state.selectedIds.length === 1 ? "element" : "elements"} selected
            </strong>
            <span className="mt-0.5 block text-xs text-ink-muted">
              {state.editScope === "all"
                ? "All views"
                : `${state.editScope} only`}
            </span>
          </div>
        </div>
      )}
    </aside>
  );
}
