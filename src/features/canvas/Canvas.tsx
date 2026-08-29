import { Maximize2, Monitor } from "lucide-react";
import type { KeyboardEvent, MouseEvent } from "react";
import { useEditorUi } from "../../app/EditorUiContext";
import { Button } from "../../components/Button";
import { findProposal } from "../../state/proposalStore";
import { orderWithProposal, resolvedWithProposal } from "../../state/resolver";
import { materializeSnapshot } from "../../state/globalRestore";
import { useEditor } from "../../state/StateContext";
import type { TemplateElement } from "../../state/types";
import { CanvasElement, PreviewElement } from "./CanvasElement";
import { DeviceFrame } from "../preview/DeviceFrame";
import { PREVIEW_DIMENSIONS } from "../preview/previewDimensions";

type CanvasMode = "editable" | "presentation";

function TemplateDocument({ mode }: { mode: CanvasMode }) {
  const { state, actions } = useEditor();
  const previewProposal = findProposal(
    state.strategyGroups,
    state.restorePreviewCheckpointId ? null : state.previewProposalId,
  );
  const restoreCheckpoint = state.checkpoints.find(
    (item) => item.checkpointId === state.restorePreviewCheckpointId,
  );
  const template = restoreCheckpoint?.templateSnapshot
    ? materializeSnapshot(state.template, restoreCheckpoint.templateSnapshot)
    : state.template;
  const page = template.elements[template.rootId];
  const pageProps = resolvedWithProposal(page, state.viewport, previewProposal);
  const sortByPreviewOrder = (left: TemplateElement, right: TemplateElement) =>
    orderWithProposal(left, previewProposal) -
      orderWithProposal(right, previewProposal) ||
    left.id.localeCompare(right.id);
  const top = Object.values(template.elements)
    .filter((item) => item.parentId === page.id)
    .sort(sortByPreviewOrder);
  const services = template.elements.services;
  const serviceItems = Object.values(template.elements)
    .filter((item) => item.parentId === "services")
    .sort(sortByPreviewOrder);
  const serviceProps = resolvedWithProposal(
    services,
    state.viewport,
    previewProposal,
  );
  const dimensions = PREVIEW_DIMENSIONS[state.viewport];
  const editable = mode === "editable" && !restoreCheckpoint;
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
      className="preview flex w-full flex-col items-center justify-center overflow-hidden shadow-flat"
      style={{
        minHeight: dimensions.minHeight,
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
              borderRadius: serviceProps.borderRadius,
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
  const { state: uiState, actions, meta } = useEditorUi();
  const previewProposal = findProposal(
    state.strategyGroups,
    state.previewProposalId,
  );
  const restorePreview = state.checkpoints.find(
    (item) => item.checkpointId === state.restorePreviewCheckpointId,
  );
  return (
    <main
      id="main-content"
      className="min-h-0 min-w-0 overflow-auto bg-workspace p-5 max-sm:p-3"
    >
      <div className="mx-auto mb-2.5 flex max-w-[920px] items-center justify-between gap-3 text-xs font-semibold tracking-[.06em] text-ink-muted uppercase">
        <span className="min-w-0 truncate">
          {restorePreview
            ? `Saved Version ${restorePreview.toTemplateVersion} Preview · Not Applied`
            : previewProposal
              ? "Proposal Preview · Not Applied"
              : "Live Preview"}
        </span>
        <span className="ml-auto shrink-0">
          {PREVIEW_DIMENSIONS[state.viewport].width} ×{" "}
          {PREVIEW_DIMENSIONS[state.viewport].minHeight} px · {state.viewport}
        </span>
        <Button
          className="shrink-0 px-2 py-1.5 text-xs normal-case tracking-normal"
          aria-label={`${uiState.deviceFrame === "on" ? "Hide" : "Show"} Device Frame`}
          title={`${uiState.deviceFrame === "on" ? "Hide" : "Show"} Device Frame`}
          onClick={actions.toggleDeviceFrame}
        >
          <Monitor size={13} aria-hidden="true" />
          <span className="max-xl:sr-only">Frame</span>
        </Button>
        <Button
          id={meta.fullscreenTriggerId}
          className="shrink-0 px-2 py-1.5 text-xs normal-case tracking-normal"
          onClick={actions.enterFullscreenPreview}
        >
          <Maximize2 size={13} aria-hidden="true" />
          <span className="max-sm:sr-only">Full Screen Preview</span>
        </Button>
      </div>
      <div className="flex min-h-[calc(100%-28px)] w-full items-center justify-center py-6">
        <DeviceFrame viewport={state.viewport}>
          <TemplateDocument mode="editable" />
        </DeviceFrame>
      </div>
    </main>
  );
}

export function FullscreenCanvas() {
  const { state } = useEditor();
  return (
    <div className="flex min-h-full w-full items-center justify-center">
      <DeviceFrame viewport={state.viewport}>
        <TemplateDocument mode="presentation" />
      </DeviceFrame>
    </div>
  );
}
