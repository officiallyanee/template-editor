import {
  Box,
  MousePointer2,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useEditorUi } from "../../app/EditorUiContext";
import { Button } from "../../components/Button";
import { useEditor } from "../../state/StateContext";
export function LayerList() {
  const { state, actions } = useEditor();
  const { state: uiState, actions: uiActions } = useEditorUi();
  const expanded = uiState.layers === "open";
  const elements = Object.values(state.template.elements)
    // Include all elements — root (Page) sorts to top, children sort by order
    .sort((a, b) => {
      if (a.id === state.template.rootId) return -1;
      if (b.id === state.template.rootId) return 1;
      return a.order - b.order;
    });
  return (
    <aside
      id="layer-rail"
      className={`flex min-h-0 flex-col overflow-hidden border-r border-border-default py-5 max-lg:hidden ${expanded ? "px-3.5" : "items-center px-2"}`}
      aria-label="Template layers"
    >
      <div
        className={`flex w-full items-start gap-2 px-1 ${expanded ? "justify-between pb-4.5" : "justify-center"}`}
      >
        {expanded && (
          <div id="layer-list-heading" className="min-w-0">
            <div className="mb-1.5 truncate text-[11px] leading-tight font-bold tracking-[.09em] text-primary uppercase">
              Example Studio
            </div>
            <h2 className="mb-1.5 text-xl font-bold tracking-[-.2px] text-balance">
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
                className={`grid w-full cursor-pointer grid-cols-[18px_minmax(0,1fr)_16px] items-center gap-2 rounded-md border-0 px-2 py-2 text-left transition-[background-color,color,box-shadow] duration-150 hover:bg-surface-hover ${selected ? "bg-selection text-primary" : "bg-transparent text-secondary"} ${active ? "ring-1 ring-primary" : ""}`}
                onClick={(event) =>
                  actions.select(
                    element.id,
                    event.shiftKey || event.metaKey || event.ctrlKey,
                  )
                }
              >
                <Box size={15} aria-hidden="true" />
                <span className="min-w-0">
                  <strong className="block truncate text-[13px]">
                    {element.label}
                  </strong>
                  <small className="mt-0.5 block truncate text-[11px] text-ink-muted capitalize">
                    {element.type}
                    {active ? " · active" : ""}
                  </small>
                </span>
                {selected && <MousePointer2 size={14} aria-hidden="true" />}
              </button>
            );
          })}
      </div>
      {expanded && (
        <div className="mt-3 flex shrink-0 items-center gap-2 rounded-xl bg-raised p-3 shadow-flat">
          <span className="size-2 rounded-full bg-primary" />
          <div>
            <strong className="block text-xs">
              {state.selectedIds.length} selected
            </strong>
            <span className="mt-0.5 block text-[11px] text-ink-muted">
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
