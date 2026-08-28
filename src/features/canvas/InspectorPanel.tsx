import { AlignCenter } from "lucide-react";
import { useEditor } from "../../state/StateContext";
import { resolved } from "../../state/resolver";
import type { ElementProperties } from "../../state/types";
import { canvasEditToCommand } from "./canvasEditToCommand";
import { PropertyStepper } from "./PropertyStepper";
import { PositionControl } from "./PositionControl";
import { ReorderControl } from "./ReorderControl";
export function InspectorPanel() {
  const { state, actions } = useEditor();
  const element = state.activeId
    ? state.template.elements[state.activeId]
    : undefined;
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
      <div className="border-b border-hairline pb-4">
        <span className="text-[11px] font-bold tracking-[.08em] text-primary uppercase">
          {element.type}
        </span>
        <h3 className="mt-1 text-lg font-bold text-balance">{element.label}</h3>
        <p className="mt-1 text-xs leading-normal text-ink-muted">
          {state.selectedIds.length > 1 && (
            <>{state.selectedIds.length} selected · active element. </>
          )}
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
      {values.fontSize !== undefined && (
        <PropertyStepper
          label="Text Size"
          value={values.fontSize}
          min={10}
          max={96}
          step={2}
          overrideLabel={
            hasOverride("fontSize")
              ? `${state.viewport} override active`
              : undefined
          }
          onChange={(fontSize) => commit({ fontSize })}
        />
      )}
      {values.width !== undefined && (
        <PropertyStepper
          label="Width"
          value={values.width}
          min={40}
          max={900}
          step={16}
          overrideLabel={
            hasOverride("width")
              ? `${state.viewport} override active`
              : undefined
          }
          onChange={(width) => commit({ width })}
        />
      )}
      {element.type === "container" && values.padding !== undefined && (
        <PropertyStepper
          label="Container Padding"
          value={values.padding}
          min={0}
          max={120}
          step={4}
          overrideLabel={
            hasOverride("padding")
              ? `${state.viewport} override active`
              : undefined
          }
          onChange={(padding) => commit({ padding })}
        />
      )}
      {element.type === "container" && values.gap !== undefined && (
        <PropertyStepper
          label="Item Gap"
          value={values.gap}
          min={0}
          max={96}
          step={4}
          overrideLabel={
            hasOverride("gap") ? `${state.viewport} override active` : undefined
          }
          onChange={(gap) => commit({ gap })}
        />
      )}
      {element.type === "container" && values.direction && (
        <fieldset className="m-0 rounded-lg border border-hairline bg-canvas-soft p-3">
          <legend className="px-1 text-[11px] font-semibold tracking-[.04em] text-ink-muted uppercase">
            Layout Direction
          </legend>
          <div className="mt-1 grid grid-cols-2 gap-2">
            {(["row", "column"] as const).map((direction) => (
              <label
                key={direction}
                className="flex cursor-pointer items-center gap-2 rounded-md border border-border-default bg-raised px-3 py-2 text-sm capitalize hover:bg-surface-hover"
              >
                <input
                  type="radio"
                  name="layout-direction"
                  value={direction}
                  checked={values.direction === direction}
                  onChange={() => commit({ direction })}
                />
                {direction}
              </label>
            ))}
          </div>
        </fieldset>
      )}
      {element.parentId !== null && (
        <PositionControl
          value={values.alignSelf ?? "auto"}
          onChange={(alignSelf) => commit({ alignSelf })}
        />
      )}
      <ReorderControl elementId={element.id} />
      {values.color && (
        <label className="flex items-center justify-between gap-3 rounded-lg border border-hairline bg-canvas-soft p-3">
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
        <label className="flex items-center justify-between gap-3 rounded-lg border border-hairline bg-canvas-soft p-3">
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
