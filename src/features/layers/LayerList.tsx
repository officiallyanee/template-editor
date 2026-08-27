import { Box, MousePointer2 } from "lucide-react";
import { useEditor } from "../../state/StateContext";
export function LayerList() {
  const { state, actions } = useEditor();
  const elements = Object.values(state.template.elements)
    // Include all elements — root (Page) sorts to top, children sort by order
    .sort((a, b) => {
      if (a.id === state.template.rootId) return -1;
      if (b.id === state.template.rootId) return 1;
      return a.order - b.order;
    });
  return (
    <aside
      className="flex min-h-0 flex-col border-r border-border-default px-3.5 py-5 max-lg:hidden"
      aria-label="Template layers"
    >
      <div className="px-2 pb-4.5">
        <div className="mb-1.5 text-[11px] leading-tight font-bold tracking-[.09em] text-primary uppercase">
          Brightpath Studio
        </div>
        <h2 className="mb-1.5 text-xl font-bold tracking-[-.2px] text-balance">
          Page Layers
        </h2>
        <p className="m-0 text-xs leading-normal text-ink-muted">
          Choose an element. Hold Shift to add more.
        </p>
      </div>
      <div
        className="flex flex-col gap-[3px] overflow-auto"
        role="listbox"
        aria-multiselectable="true"
      >
        {elements.map((element) => {
          const selected = state.selectedIds.includes(element.id);
          return (
            <button
              key={element.id}
              role="option"
              aria-selected={selected}
              className={`grid w-full cursor-pointer grid-cols-[18px_minmax(0,1fr)_16px] items-center gap-2 rounded-md border-0 px-2 py-2 text-left transition-colors duration-150 hover:bg-surface-hover ${selected ? "bg-selection text-primary" : "bg-transparent text-secondary"}`}
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
                </small>
              </span>
              {selected && <MousePointer2 size={14} aria-hidden="true" />}
            </button>
          );
        })}
      </div>
      <div className="mt-auto flex items-center gap-2 rounded-xl bg-raised p-3 shadow-flat">
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
    </aside>
  );
}
