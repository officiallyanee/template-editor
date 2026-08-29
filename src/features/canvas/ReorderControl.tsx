import { ArrowDown, ArrowUp } from "lucide-react";
import { Button } from "../../components/Button";
import { orderForPosition, type ReorderPosition } from "../../state/reorder";
import { useEditor } from "../../state/StateContext";
import { makeId } from "../../utils/id";

export function ReorderControl({ elementId }: { elementId: string }) {
  const { state, actions } = useEditor();
  const element = state.template.elements[elementId];
  if (!element || element.parentId === null) return null;

  const singleSelection =
    state.selectedIds.length === 1 && state.selectedIds[0] === elementId;
  const sharedScope = state.editScope === "all";
  const earlierOrder = orderForPosition(state.template, elementId, "earlier");
  const laterOrder = orderForPosition(state.template, elementId, "later");

  const move = (position: ReorderPosition) => {
    const order = orderForPosition(state.template, elementId, position);
    if (order === null) return;
    actions.dispatch({
      commandId: makeId("canvas-reorder"),
      source: "canvas",
      targetIds: [elementId],
      viewportScope: "all",
      baseRevision: state.template.version,
      changes: { [elementId]: { op: "reorder", order } },
    });
  };

  const disabledReason = !singleSelection
    ? "Select only this element to change its order."
    : !sharedScope
      ? "Order is shared. Switch Edit Scope to All Views."
      : null;

  return (
    <fieldset className="m-0 rounded-lg border border-hairline bg-canvas-soft p-3">
      <legend className="px-1 text-xs font-semibold tracking-[.04em] text-ink-muted uppercase">
        Sibling Order
      </legend>
      <div className="mt-1 grid grid-cols-2 gap-2">
        <Button
          disabled={disabledReason !== null || earlierOrder === null}
          onClick={() => move("earlier")}
        >
          <ArrowUp size={14} aria-hidden="true" />
          Move Earlier
        </Button>
        <Button
          disabled={disabledReason !== null || laterOrder === null}
          onClick={() => move("later")}
        >
          <ArrowDown size={14} aria-hidden="true" />
          Move Later
        </Button>
      </div>
      <p className="mt-2 text-xs leading-normal text-ink-muted">
        {disabledReason ?? "Moves within the current parent across all views."}
      </p>
    </fieldset>
  );
}
