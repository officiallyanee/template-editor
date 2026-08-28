import { Clock3, History, Save } from "lucide-react";
import { Button } from "../../components/Button";
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
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-balance">Saved Versions</h2>
            <p className="mt-1 text-xs leading-normal text-ink-muted">
              Document checkpoints group edits; recovery stays scoped to each
              element.
            </p>
          </div>
          <Button
            className="shrink-0"
            disabled={!state.hasUnsavedVersion}
            onClick={actions.saveVersion}
          >
            <Save size={14} aria-hidden="true" />
            Save Version
          </Button>
        </div>
      </div>
      <ol className="m-0 flex list-none flex-col gap-2 p-0">
        {checkpoints.map((checkpoint) => (
          <li
            key={checkpoint.checkpointId}
            className="rounded-lg border border-border-default bg-raised p-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <strong className="block text-sm">
                  Saved Version {checkpoint.toTemplateVersion}
                </strong>
                <small className="mt-1 block text-[11px] text-ink-muted tabular-nums">
                  {checkpoint.reason === "manual"
                    ? "Saved manually"
                    : "Saved when session ended"}{" "}
                  · {timeFormat.format(checkpoint.savedAt)}
                </small>
              </div>
              <span className="shrink-0 rounded-full bg-canvas-soft px-2 py-1 text-[10px] font-bold text-ink-muted">
                {checkpoint.commandCount} edit
                {checkpoint.commandCount === 1 ? "" : "s"}
              </span>
            </div>
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
                      <small className="mt-0.5 block truncate text-[10px] text-ink-muted">
                        {entry.fields.join(", ")}
                      </small>
                    </span>
                    <Button
                      className="shrink-0 px-2 py-1.5 text-[11px]"
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
