import { Minimize2, Monitor } from "lucide-react";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useEditorUi } from "../../app/EditorUiContext";
import { Button } from "../../components/Button";
import { findProposal } from "../../state/proposalStore";
import { resolvedWithProposal } from "../../state/resolver";
import { useEditor } from "../../state/StateContext";
import { FullscreenCanvas } from "../canvas/Canvas";
import { ViewportSwitcher } from "../viewport/ViewportSwitcher";
import { choosePreviewSurround } from "./previewSurround";
import { materializeSnapshot } from "../../state/globalRestore";

function token(name: string, fallback: string): string {
  return (
    getComputedStyle(document.documentElement).getPropertyValue(name).trim() ||
    fallback
  );
}

export function FullscreenPreview() {
  const { state } = useEditor();
  const { state: uiState, actions, meta } = useEditorUi();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const proposal = findProposal(state.strategyGroups, state.previewProposalId);
  const restoreCheckpoint = state.checkpoints.find(
    (item) => item.checkpointId === state.restorePreviewCheckpointId,
  );
  const template = restoreCheckpoint?.templateSnapshot
    ? materializeSnapshot(state.template, restoreCheckpoint.templateSnapshot)
    : state.template;
  const page = template.elements[template.rootId];
  const pageBackground =
    resolvedWithProposal(
      page,
      state.viewport,
      restoreCheckpoint ? undefined : proposal,
    ).backgroundColor ?? "#ffffff";
  const surround = choosePreviewSurround(pageBackground, {
    light: token("--preview-surround-light", "#fafafa"),
    dark: token("--preview-surround-dark", "#27292c"),
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
    }
    closeButtonRef.current?.focus();
    return () =>
      document
        .getElementById(meta.fullscreenTriggerId)
        ?.focus({ preventScroll: true });
  }, [meta.fullscreenTriggerId]);

  return createPortal(
    <dialog
      ref={dialogRef}
      aria-labelledby="fullscreen-preview-title"
      className="m-0 h-dvh max-h-none w-dvw max-w-none overflow-hidden border-0 bg-transparent p-0 text-ink backdrop:bg-black/60"
      onCancel={(event) => {
        event.preventDefault();
        actions.exitFullscreenPreview();
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          actions.exitFullscreenPreview();
        }
      }}
    >
      <div
        className="flex h-full min-w-0 flex-col overflow-hidden overscroll-contain"
        style={{ backgroundColor: surround.color }}
      >
        <header className="flex min-h-16 items-center justify-between gap-4 border-b border-preview-chrome-border bg-preview-chrome px-4 py-3 text-preview-chrome-text max-sm:flex-wrap">
          <div className="min-w-0">
            <h2
              id="fullscreen-preview-title"
              className="truncate text-base font-bold text-balance"
            >
              Full Screen Preview
            </h2>
            <p className="mt-0.5 truncate text-xs text-preview-chrome-muted">
              {restoreCheckpoint
                ? `Saved Version ${restoreCheckpoint.toTemplateVersion} · Not Applied`
                : proposal
                  ? "Proposal Preview · Not Applied"
                  : "Saved Template Preview"}
            </p>
          </div>
          <ViewportSwitcher />
          <div className="flex items-center gap-2">
            <Button
              tone="inverse"
              aria-label={`${uiState.deviceFrame === "on" ? "Hide" : "Show"} Device Frame`}
              title={`${uiState.deviceFrame === "on" ? "Hide" : "Show"} Device Frame`}
              onClick={actions.toggleDeviceFrame}
            >
              <Monitor size={14} aria-hidden="true" />
              <span className="max-sm:sr-only">Frame</span>
            </Button>
            <Button
              ref={closeButtonRef}
              tone="inverse"
              onClick={actions.exitFullscreenPreview}
            >
              <Minimize2 size={14} aria-hidden="true" />
              Exit Preview
            </Button>
          </div>
        </header>
        <div className="min-h-0 flex-1 overflow-auto p-6 max-sm:p-3">
          <div
            className={`mx-auto flex min-h-full items-start justify-center ${surround.useBorder ? "ring-1 ring-preview-frame-border" : ""}`}
          >
            <FullscreenCanvas />
          </div>
        </div>
      </div>
    </dialog>,
    document.body,
  );
}
