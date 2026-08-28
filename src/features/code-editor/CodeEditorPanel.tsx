import { useState } from "react";
import { Braces } from "lucide-react";
import { Button } from "../../components/Button";
import { useEditor } from "../../state/StateContext";
import { resolved } from "../../state/resolver";
import { parseAndDiff } from "./parseAndDiff";

export function CodeEditorPanel() {
  const { state } = useEditor();
  const element = state.activeId
    ? state.template.elements[state.activeId]
    : undefined;
  if (!element)
    return (
      <p className="py-8 text-center text-sm text-ink-muted">
        Select one element to edit its JSON.
      </p>
    );
  return (
    <CodeEditorForm
      key={`${element.id}-${state.viewport}-${state.template.version}`}
      initialJson={JSON.stringify(resolved(element, state.viewport), null, 2)}
    />
  );
}

function CodeEditorForm({ initialJson }: { initialJson: string }) {
  const { state, actions } = useEditor();
  const [json, setJson] = useState(initialJson);
  const [error, setError] = useState<string | null>(null);
  const element = state.activeId
    ? state.template.elements[state.activeId]
    : undefined;
  if (!element) return null;
  const apply = () => {
    const result = parseAndDiff(
      json,
      element,
      state.viewport,
      state.editScope,
      state.template,
    );
    if (!result.ok) return setError(result.error);
    const outcome = actions.dispatch(result.command);
    setError(outcome.ok ? null : outcome.error.detail);
  };
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2.5 border-b border-border-default pb-4">
        <Braces size={17} aria-hidden="true" />
        <div className="min-w-0">
          <strong className="block truncate text-sm">{element.label}</strong>
          <span className="block text-xs text-ink-muted">
            Resolved {state.viewport} properties
            {state.selectedIds.length > 1
              ? ` · active of ${state.selectedIds.length} selected`
              : ""}
          </span>
        </div>
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-secondary">
          Element JSON
        </span>
        <textarea
          name="element-json"
          autoComplete="off"
          spellCheck={false}
          className="min-h-72 resize-y rounded-lg border border-border-default bg-canvas-soft p-3 font-mono text-xs leading-relaxed text-ink"
          value={json}
          onChange={(e) => setJson(e.target.value)}
          aria-describedby={error ? "code-error" : "code-help"}
        />
      </label>
      <p id="code-help" className="m-0 text-xs leading-normal text-ink-muted">
        Only changed fields become a patch. Invalid JSON never reaches the page.
      </p>
      {error && (
        <p
          id="code-error"
          className="m-0 rounded-lg border border-danger-border bg-danger-surface p-2.5 text-xs text-danger"
          role="alert"
        >
          {error}
        </p>
      )}
      <Button onClick={apply}>Apply JSON</Button>
    </div>
  );
}
