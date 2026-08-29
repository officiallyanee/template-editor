import type { CSSProperties, KeyboardEvent, MouseEvent } from "react";
import { useEditor } from "../../state/StateContext";
import { resolvedWithProposal } from "../../state/resolver";
import { findProposal } from "../../state/proposalStore";
import type { TemplateElement } from "../../state/types";

type ElementMode = "editable" | "presentation";

function ElementView({
  element,
  mode,
}: {
  element: TemplateElement;
  mode: ElementMode;
}) {
  const { state, actions } = useEditor();
  const previewProposal = findProposal(
    state.strategyGroups,
    state.restorePreviewCheckpointId ? null : state.previewProposalId,
  );
  const props = resolvedWithProposal(element, state.viewport, previewProposal);
  const editable = mode === "editable";
  const selected = editable && state.selectedIds.includes(element.id);
  const active = editable && state.activeId === element.id;
  const previewed =
    editable && previewProposal?.command.targetIds.includes(element.id);
  const select = (event: MouseEvent | KeyboardEvent) => {
    event.stopPropagation();
    actions.select(element.id, "shiftKey" in event && event.shiftKey);
  };
  const style = {
    color: props.color,
    backgroundColor: props.backgroundColor,
    fontSize: props.fontSize,
    fontWeight: props.fontWeight,
    textAlign: props.align,
    width: props.width,
    height: props.height,
    padding: props.padding,
    gap: props.gap,
    flexDirection: props.direction,
    alignSelf: props.alignSelf,
    borderRadius: props.borderRadius,
  } as CSSProperties;
  const common = {
    "data-testid": `element-${element.id}`,
    "data-type": element.type,
    tabIndex: editable ? 0 : undefined,
    role: editable ? "option" : undefined,
    "aria-selected": editable ? selected : undefined,
    "data-active": active || undefined,
    className: `template-element m-0 cursor-pointer whitespace-pre-line rounded-md ${props.alignSelf === "stretch" ? "max-w-none" : "max-w-[720px]"} ${element.type === "button" ? "grid place-items-center" : ""} ${selected ? "is-selected" : ""} ${active ? "is-active" : ""} ${previewed ? "is-proposal-preview" : ""}`,
    style,
    onClick: editable ? select : undefined,
    onKeyDown: editable
      ? (event: KeyboardEvent) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            select(event);
          }
        }
      : undefined,
  };
  if (element.type === "heading") return <h1 {...common}>{props.text}</h1>;
  if (element.type === "paragraph") return <p {...common}>{props.text}</p>;
  if (element.type === "button") return <div {...common}>{props.text}</div>;
  return null;
}

export function CanvasElement({ element }: { element: TemplateElement }) {
  return <ElementView element={element} mode="editable" />;
}

export function PreviewElement({ element }: { element: TemplateElement }) {
  return <ElementView element={element} mode="presentation" />;
}
