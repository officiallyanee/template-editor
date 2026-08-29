import { Clock3, Eye, History, RotateCcw, Save, X } from "lucide-react";
import { Button } from "../../components/Button";
import { planGlobalRestore } from "../../state/globalRestore";
import { useEditor } from "../../state/StateContext";

const timeFormat = new Intl.DateTimeFormat(undefined, {
  hour: "numeric",
  minute: "2-digit",
});

export function ActivityPanel({
  onOpenHistory,
}: {
  onOpenHistory: () => void;
}) {
  const { state, actions } = useEditor();
  const checkpoints = [...state.checkpoints].sort(
    (left, right) => right.savedAt - left.savedAt,
  );
  const previewed = checkpoints.find(
    (checkpoint) =>
      checkpoint.checkpointId === state.restorePreviewCheckpointId,
  );
  const restorePlan = previewed
    ? planGlobalRestore(state.template, previewed)
    : null;

  if (!checkpoints.length)
    return (
      <div className="grid place-items-center gap-2 rounded-xl border border-dashed border-border-default px-4 py-8 text-center text-ink-muted">
        <Clock3 size={22} aria-hidden="true" />
        <strong>No Saved Versions Yet</strong>
        <p className="m-0 text-xs leading-normal">
          Edits are autosaved for safety. Save a version to group them into one
          document checkpoint.
        </p>
        {state.hasUnsavedVersion && (
          <Button onClick={actions.saveVersion}>
            <Save size={14} aria-hidden="true" />
            Save Current Version
          </Button>
        )}
      </div>
    );

  return (
    <div className="flex flex-col gap-4">
      <div className="border-b border-border-default pb-4">
        <h2 className="text-lg font-bold text-balance">Saved Versions</h2>
        <p className="mt-1 text-xs leading-normal text-ink-muted">
          Each save is a whole-document checkpoint. Its entries remain
          element-wise so individual changes can still be reviewed and recovered
          without rolling back siblings.
        </p>
      </div>
      {previewed && restorePlan && (
        <section
          aria-label={`Restore preview for saved version ${previewed.toTemplateVersion}`}
          aria-live="polite"
          className="rounded-xl border border-primary bg-selection p-3"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <strong className="block text-sm">
                Previewing Saved Version {previewed.toTemplateVersion}
              </strong>
              <p className="mt-1 text-xs leading-normal text-ink-muted">
                The canvas is read-only until you cancel or restore.
              </p>
            </div>
            <Button
              className="shrink-0 px-2 py-1.5"
              aria-label="Cancel saved version preview"
              onClick={() => actions.previewCheckpoint(null)}
            >
              <X size={14} aria-hidden="true" />
            </Button>
          </div>
          {!restorePlan.ok ? (
            <p role="alert" className="mt-3 text-xs text-danger">
              {restorePlan.detail}
            </p>
          ) : restorePlan.changes.length === 0 ? (
            <p className="mt-3 rounded-md bg-raised p-2 text-xs text-ink-secondary">
              Nothing to restore—current values already match this saved
              version.
            </p>
          ) : (
            <>
              <p className="mt-3 text-xs text-ink-secondary">
                {restorePlan.changes.length} exact layer change
                {restorePlan.changes.length === 1 ? "" : "s"} across{" "}
                {
                  new Set(restorePlan.changes.map((change) => change.elementId))
                    .size
                }{" "}
                element
                {new Set(restorePlan.changes.map((change) => change.elementId))
                  .size === 1
                  ? ""
                  : "s"}
                .
              </p>
              <ul className="mt-2 max-h-32 list-none space-y-1 overflow-auto p-0 text-xs text-ink-muted">
                {restorePlan.changes.map((change) => (
                  <li
                    className="break-words"
                    key={`${change.elementId}-${change.viewportScope}-${change.afterLayer.kind}`}
                  >
                    <strong className="text-ink-secondary">
                      {state.template.elements[change.elementId]?.label ??
                        change.elementId}
                    </strong>{" "}
                    ·{" "}
                    {change.afterLayer.kind === "structure"
                      ? "Structure"
                      : change.viewportScope === "all"
                        ? "All views"
                        : change.viewportScope}{" "}
                    · {change.fields.join(", ")}
                  </li>
                ))}
              </ul>
              <Button
                tone="primary"
                className="mt-3 w-full rounded-lg"
                onClick={() =>
                  actions.restoreCheckpoint(previewed.checkpointId)
                }
              >
                <RotateCcw size={14} aria-hidden="true" />
                Restore as New Saved Version
              </Button>
            </>
          )}
        </section>
      )}
      <ol className="m-0 flex list-none flex-col gap-5 p-0">
        {checkpoints.map((checkpoint) => (
          <li
            key={checkpoint.checkpointId}
            className="border border-border-default border-l-4 border-l-primary bg-raised p-3 shadow-flat"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <strong className="block text-sm">
                  Saved Version {checkpoint.toTemplateVersion}
                </strong>
                <small className="mt-1 block text-xs text-ink-muted tabular-nums">
                  {checkpoint.reason === "manual"
                    ? "Saved manually"
                    : checkpoint.reason === "global-restore"
                      ? "Restored from a saved version"
                      : "Saved when session ended"}{" "}
                  · {timeFormat.format(checkpoint.savedAt)}
                </small>
              </div>
              <span className="shrink-0 rounded-full bg-canvas-soft px-2 py-1 text-xs font-bold text-ink-muted">
                {checkpoint.commandCount} edit
                {checkpoint.commandCount === 1 ? "" : "s"}
              </span>
            </div>
            <Button
              className="mt-3 w-full"
              disabled={!checkpoint.templateSnapshot}
              onClick={() => actions.previewCheckpoint(checkpoint.checkpointId)}
              title={
                checkpoint.templateSnapshot
                  ? undefined
                  : "Legacy saves can only be reviewed through element history."
              }
            >
              <Eye size={14} aria-hidden="true" />
              {checkpoint.templateSnapshot
                ? "Preview Restore"
                : "Legacy Save · History Only"}
            </Button>
            <ul className="mt-3 flex list-none flex-col gap-2 p-0">
              {checkpoint.entries.map((entry) => {
                const element = state.template.elements[entry.elementId];
                return (
                  <li
                    key={entry.elementId}
                    className="flex min-w-0 items-center justify-between gap-2 rounded-md bg-canvas-soft p-2"
                  >
                    <span className="min-w-0">
                      <strong className="block truncate text-xs">
                        {element?.label ?? entry.elementId}
                      </strong>
                      <small className="mt-0.5 block truncate text-xs text-ink-muted">
                        {entry.fields.join(", ")}
                      </small>
                    </span>
                    <Button
                      className="shrink-0 px-2 py-1.5 text-xs"
                      onClick={() => {
                        actions.select(entry.elementId);
                        onOpenHistory();
                      }}
                    >
                      <History size={13} aria-hidden="true" />
                      Review History
                    </Button>
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ol>
    </div>
  );
}
