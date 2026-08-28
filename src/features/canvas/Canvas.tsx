import { Maximize2 } from "lucide-react";
import type { KeyboardEvent, MouseEvent } from "react";
import { useEditorUi } from "../../app/EditorUiContext";
import { Button } from "../../components/Button";
import { findProposal } from "../../state/proposalStore";
import { orderWithProposal, resolvedWithProposal } from "../../state/resolver";
import { useEditor } from "../../state/StateContext";
import type { TemplateElement } from "../../state/types";
import { CanvasElement, PreviewElement } from "./CanvasElement";

const widths = { desktop: 920, tablet: 680, mobile: 375 };
type CanvasMode = "editable" | "presentation";

function TemplateDocument({ mode }: { mode: CanvasMode }) {
  const { state, actions } = useEditor();
  const previewProposal = findProposal(
    state.strategyGroups,
    state.previewProposalId,
  );
  const page = state.template.elements[state.template.rootId];
  const pageProps = resolvedWithProposal(page, state.viewport, previewProposal);
  const sortByPreviewOrder = (left: TemplateElement, right: TemplateElement) =>
    orderWithProposal(left, previewProposal) -
      orderWithProposal(right, previewProposal) ||
    left.id.localeCompare(right.id);
  const top = Object.values(state.template.elements)
    .filter((item) => item.parentId === page.id)
    .sort(sortByPreviewOrder);
  const services = state.template.elements.services;
  const serviceItems = Object.values(state.template.elements)
    .filter((item) => item.parentId === "services")
    .sort(sortByPreviewOrder);
  const serviceProps = resolvedWithProposal(
    services,
    state.viewport,
    previewProposal,
  );
  const editable = mode === "editable";
  const presentationWidth =
    state.viewport === "desktop" ? "none" : widths[state.viewport];
  const select = (event: MouseEvent | KeyboardEvent, id: string) => {
    event.stopPropagation();
    actions.select(
      id,
      "shiftKey" in event && (event.shiftKey || event.metaKey || event.ctrlKey),
    );
  };
  const Element = editable ? CanvasElement : PreviewElement;

  return (
    <div
      className={`preview flex w-full flex-col items-center justify-center overflow-hidden rounded-xl shadow-flat transition-[max-width] duration-200 ${editable ? (state.viewport === "mobile" ? "min-h-[690px]" : "min-h-[650px]") : "min-h-full"}`}
      style={{
        maxWidth: editable ? widths[state.viewport] : presentationWidth,
        backgroundColor: pageProps.backgroundColor,
        padding: pageProps.padding,
        gap: pageProps.gap,
        flexDirection: pageProps.direction,
      }}
      role={editable ? "listbox" : "document"}
      tabIndex={editable ? 0 : undefined}
      aria-label={
        editable ? "Editable template canvas" : "Template preview canvas"
      }
      aria-multiselectable={editable ? true : undefined}
      onClick={
        editable
          ? (event) => {
              if (event.target === event.currentTarget) select(event, page.id);
            }
          : undefined
      }
      onKeyDown={
        editable
          ? (event) => {
              if (
                event.target === event.currentTarget &&
                (event.key === "Enter" || event.key === " ")
              ) {
                event.preventDefault();
                select(event, page.id);
              }
            }
          : undefined
      }
    >
      {top.map((item) =>
        item.id === services.id ? (
          <section
            key={item.id}
            className={`services flex w-full max-w-[720px] rounded-md ${editable ? "cursor-pointer" : ""} ${editable && state.selectedIds.includes(item.id) ? "is-selected" : ""} ${editable && state.activeId === item.id ? "is-active" : ""} ${editable && previewProposal?.command.targetIds.includes(item.id) ? "is-proposal-preview" : ""}`}
            data-active={
              editable && state.activeId === item.id ? true : undefined
            }
            style={{
              backgroundColor: serviceProps.backgroundColor,
              padding: serviceProps.padding,
              gap: serviceProps.gap,
              flexDirection: serviceProps.direction,
              alignSelf: serviceProps.alignSelf,
            }}
            tabIndex={editable ? 0 : undefined}
            role={editable ? "option" : undefined}
            aria-selected={
              editable ? state.selectedIds.includes(item.id) : undefined
            }
            onClick={editable ? (event) => select(event, item.id) : undefined}
            onKeyDown={
              editable
                ? (event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      select(event, item.id);
                    }
                  }
                : undefined
            }
          >
            {serviceItems.map((child) => (
              <Element key={child.id} element={child} />
            ))}
          </section>
        ) : (
          <Element key={item.id} element={item} />
        ),
      )}
    </div>
  );
}

export function Canvas() {
  const { state } = useEditor();
  const { actions, meta } = useEditorUi();
  const previewProposal = findProposal(
    state.strategyGroups,
    state.previewProposalId,
  );
  return (
    <main
      id="main-content"
      className="min-w-0 overflow-auto bg-workspace p-5 max-sm:p-3"
    >
      <div className="mx-auto mb-2.5 flex max-w-[920px] items-center justify-between gap-3 text-[11px] font-semibold tracking-[.06em] text-ink-muted uppercase">
        <span className="min-w-0 truncate">
          {previewProposal ? "Proposal Preview · Not Applied" : "Live Preview"}
        </span>
        <span className="ml-auto shrink-0">
          {widths[state.viewport]} px · {state.viewport}
        </span>
        <Button
          id={meta.fullscreenTriggerId}
          className="shrink-0 px-2 py-1.5 text-[11px] normal-case tracking-normal"
          onClick={actions.enterFullscreenPreview}
        >
          <Maximize2 size={13} aria-hidden="true" />
          <span className="max-sm:sr-only">Full Screen Preview</span>
        </Button>
      </div>
      <div className="flex min-h-[calc(100%-28px)] items-start justify-center">
        <TemplateDocument mode="editable" />
      </div>
    </main>
  );
}

export function FullscreenCanvas() {
  return (
    <div className="flex h-full w-full justify-center">
      <TemplateDocument mode="presentation" />
    </div>
  );
}
