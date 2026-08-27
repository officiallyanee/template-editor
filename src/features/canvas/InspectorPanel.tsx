import { AlignCenter, Minus, Plus } from "lucide-react";
import { Button } from "../../components/Button";
import { useEditor } from "../../state/StateContext";
import { resolved } from "../../state/resolver";
import type { ElementProperties } from "../../state/types";
import { canvasEditToCommand } from "./canvasEditToCommand";
export function InspectorPanel() {
  const { state, actions } = useEditor();
  const element = state.template.elements[state.selectedIds[0]];
  if (!element)
    return (
      <p className="py-8 text-center text-sm text-ink-muted">
        Select one element to adjust it.
      </p>
    );

  const targetScope = state.editScope;
  const values =
    targetScope === "all" ? element.base : resolved(element, targetScope);
  const commit = (patch: Partial<ElementProperties>) =>
    actions.dispatch(
      canvasEditToCommand(state.template, element.id, state.editScope, patch),
    );

  const hasOverride = (field: keyof ElementProperties) =>
    targetScope === "all" &&
    element.overrides[state.viewport]?.[field] !== undefined;

  return (
    <div className="flex flex-col gap-4">
      <div className="border-b border-border-default pb-4">
        <span className="text-[11px] font-bold tracking-[.08em] text-primary uppercase">
          {element.type}
        </span>
        <h3 className="mt-1 text-lg font-bold text-balance">{element.label}</h3>
        <p className="mt-1 text-xs leading-normal text-ink-muted">
          Editing{" "}
          {state.editScope === "all" ? "all views" : `${state.editScope} only`}.
        </p>
      </div>
      {element.type !== "container" && (
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-secondary">Content</span>
          <textarea
            name="element-content"
            autoComplete="off"
            className="min-h-24 resize-y rounded-lg border border-border-default bg-raised p-2.5 text-sm text-ink"
            value={values.text ?? ""}
            onChange={(e) => commit({ text: e.target.value })}
          />
        </label>
      )}
      {values.fontSize && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-border-default bg-raised p-3">
          <div>
            <span className="block text-[11px] font-semibold tracking-[.04em] text-ink-muted uppercase">
              Text Size
            </span>
            <strong className="mt-0.5 block text-sm tabular-nums">
              {values.fontSize} px
            </strong>
            {hasOverride("fontSize") && (
              <small className="mt-1 block text-[10px] text-primary">
                {state.viewport} override active
              </small>
            )}
          </div>
          <div className="flex gap-1.5">
            <Button
              aria-label="Decrease text size"
              onClick={() =>
                commit({ fontSize: Math.max(10, values.fontSize! - 2) })
              }
            >
              <Minus size={15} />
            </Button>
            <Button
              aria-label="Increase text size"
              onClick={() =>
                commit({ fontSize: Math.min(96, values.fontSize! + 2) })
              }
            >
              <Plus size={15} />
            </Button>
          </div>
        </div>
      )}
      {values.width && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-border-default bg-raised p-3">
          <div>
            <span className="block text-[11px] font-semibold tracking-[.04em] text-ink-muted uppercase">
              Width
            </span>
            <strong className="mt-0.5 block text-sm tabular-nums">
              {values.width} px
            </strong>
            {hasOverride("width") && (
              <small className="mt-1 block text-[10px] text-primary">
                {state.viewport} override active
              </small>
            )}
          </div>
          <div className="flex gap-1.5">
            <Button
              aria-label="Decrease width"
              onClick={() =>
                commit({ width: Math.max(40, values.width! - 16) })
              }
            >
              <Minus size={15} />
            </Button>
            <Button
              aria-label="Increase width"
              onClick={() =>
                commit({ width: Math.min(900, values.width! + 16) })
              }
            >
              <Plus size={15} />
            </Button>
          </div>
        </div>
      )}
      {values.color && (
        <label className="flex items-center justify-between gap-3 rounded-lg border border-border-default bg-raised p-3">
          <span className="text-xs font-semibold text-secondary">
            Text Color
          </span>
          <input
            name="text-color"
            type="color"
            className="size-9 cursor-pointer rounded-md border border-border-default bg-raised p-1"
            value={values.color}
            onChange={(e) => commit({ color: e.target.value })}
          />
        </label>
      )}
      {values.backgroundColor && (
        <label className="flex items-center justify-between gap-3 rounded-lg border border-border-default bg-raised p-3">
          <span className="text-xs font-semibold text-secondary">
            Background Color
          </span>
          <input
            name="background-color"
            type="color"
            className="size-9 cursor-pointer rounded-md border border-border-default bg-raised p-1"
            value={values.backgroundColor}
            onChange={(e) => commit({ backgroundColor: e.target.value })}
          />
        </label>
      )}
      <div className="flex items-start gap-2 rounded-lg bg-canvas-soft p-3 text-ink-muted">
        <AlignCenter size={16} aria-hidden="true" />
        <p className="m-0 text-xs leading-normal">
          Use the canvas controls for quick edits, or switch to Code for exact
          values.
        </p>
      </div>
    </div>
  );
}
