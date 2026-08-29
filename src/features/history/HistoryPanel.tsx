import { History, RotateCcw } from "lucide-react";
import { Button } from "../../components/Button";
import { useEditor } from "../../state/StateContext";
import {
  historyForScope,
  restoreWouldChange,
  revisionFields,
} from "../../state/historyStore";
import { restoreCommand } from "./useRestore";
const timeFormat = new Intl.DateTimeFormat(undefined, {
  hour: "numeric",
  minute: "2-digit",
});
export function HistoryPanel() {
  const { state, actions } = useEditor();
  const element = state.activeId
    ? state.template.elements[state.activeId]
    : undefined;
  if (!element)
    return (
      <p className="py-8 text-center text-sm text-ink-muted">
        Select one element to review its history.
      </p>
    );
  const entries = historyForScope(element);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2.5 border-b border-border-default pb-4">
        <History size={17} aria-hidden="true" />
        <div className="min-w-0">
          <strong className="block truncate text-sm">{element.label}</strong>
          <span className="block text-xs text-ink-muted">
            {entries.length} recoverable revision
            {entries.length === 1 ? "" : "s"}
            {state.selectedIds.length > 1
              ? ` · active of ${state.selectedIds.length} selected`
              : ""}
          </span>
        </div>
      </div>
      <p className="m-0 border-l-2 border-primary pl-3 text-xs leading-normal text-ink-muted">
        History is element-wise and viewport-scoped. Restoring this element
        appends a new revision without rolling back siblings or other views.
      </p>
      {entries.length === 0 ? (
        <div className="grid place-items-center gap-2 rounded-xl border border-dashed border-border-default px-4 py-8 text-center text-ink-muted">
          <History size={22} aria-hidden="true" />
          <strong>No edits yet</strong>
          <p className="m-0 text-xs leading-normal">
            Manual and accepted AI changes will appear here.
          </p>
        </div>
      ) : (
        <ol className="m-0 flex list-none flex-col gap-2 p-0">
          {entries.map((entry) => {
            const canRestore = restoreWouldChange(element, entry);
            return (
              <li
                key={entry.revisionId}
                className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 rounded-lg border border-border-default bg-raised p-3"
              >
                <div>
                  <span
                    className={`mr-1.5 inline-block size-2 rounded-full ${entry.source === "ai" ? "bg-primary" : entry.source === "restore" ? "bg-pending" : "bg-ink-muted"}`}
                  />
                  <strong>
                    {entry.source === "restore"
                      ? "Restored revision"
                      : entry.source === "initial"
                        ? "Initial version"
                        : `${entry.source} edit`}
                  </strong>
                  <small className="mt-1 block text-xs text-ink-muted tabular-nums">
                    Version {entry.templateVersion} · {entry.viewportScope} ·{" "}
                    {timeFormat.format(entry.committedAt)}
                  </small>
                </div>
                <code className="col-span-2 block break-words rounded-md bg-canvas-soft p-2 font-mono text-xs text-secondary">
                  {revisionFields(entry).join(", ")}
                </code>
                {!canRestore && (
                  <p className="col-span-2 m-0 text-xs text-ink-muted">
                    Nothing to restore—current values already match.
                  </p>
                )}
                <Button
                  className="self-start"
                  disabled={!canRestore}
                  onClick={() =>
                    actions.dispatch(
                      restoreCommand(state.template, element.id, entry),
                    )
                  }
                >
                  <RotateCcw size={14} aria-hidden="true" />
                  {canRestore ? "Restore" : "Current"}
                </Button>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
