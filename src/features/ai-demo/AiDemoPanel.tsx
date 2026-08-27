import { Pipette, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "../../components/Button";
import { useEditor } from "../../state/StateContext";
import { resolved } from "../../state/resolver";
import { ProposalReview } from "./ProposalReview";
import { runDemo } from "./runDemo";

// Prompt chips grouped as paired action/negation. Each pair shares a label root.
const PROMPT_PAIRS: Array<{ action: string; negation: string }> = [
  { action: "Make it more prominent", negation: "Make it less prominent" },
  { action: "Make it bigger", negation: "Make it smaller" },
  { action: "Rewrite this to be friendlier", negation: "" },
  { action: "Make selected items compact", negation: "" },
  { action: "Stack this on mobile", negation: "" },
];

export function AiDemoPanel() {
  const { state, actions } = useEditor();

  // Derive the current element's color properties from the active edit-scope layer
  const selectedElement = state.selectedIds[0]
    ? state.template.elements[state.selectedIds[0]]
    : undefined;

  // Resolve against the edit-scope layer so the color matches what the user sees
  // in the Inspector (base for "all views", viewport-resolved for specific scopes)
  const scopedProps = selectedElement
    ? state.editScope === "all"
      ? selectedElement.base
      : resolved(selectedElement, state.editScope)
    : undefined;

  const currentTextColor = scopedProps?.color ?? "#171717";
  const currentBgColor = scopedProps?.backgroundColor;
  const canEditTextColor = scopedProps?.color != null;
  const canEditBackgroundColor = currentBgColor != null;
  const hasBothColors = canEditTextColor && canEditBackgroundColor;

  // Color prompt state — pre-populated from element, user can override target
  const [colorField, setColorField] = useState<"text" | "background">("text");
  const [targetColor, setTargetColor] = useState("#005bab");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const effectiveColorField =
    !canEditTextColor && canEditBackgroundColor ? "background" : colorField;

  const sourceColor =
    effectiveColorField === "background"
      ? (currentBgColor ?? "#ffffff")
      : currentTextColor;

  const colorPromptText =
    effectiveColorField === "text"
      ? `Change text color from ${currentTextColor} to ${targetColor}`
      : `Change background color from ${currentBgColor ?? "#ffffff"} to ${targetColor}`;

  const [instruction, setInstruction] = useState("Make it more prominent");
  const [error, setError] = useState<string | null>(null);

  const run = () => {
    const result = runDemo(
      instruction,
      state.selectedIds,
      state.editScope,
      state.viewport,
      state.template,
    );
    if (!result.ok) return setError(result.error.detail);
    actions.setStrategyGroups(result.strategyGroups);
    setError(null);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-2.5 rounded-xl border border-primary/30 bg-selection p-3 text-primary">
        <Sparkles size={17} aria-hidden="true" />
        <div>
          <strong className="block text-xs">Scope Guard</strong>
          <span className="mt-0.5 block text-[11px] text-ink-muted">
            {state.selectedIds.length} element
            {state.selectedIds.length === 1 ? "" : "s"} ·{" "}
            {state.editScope === "all"
              ? "all views"
              : `${state.editScope} only`}
          </span>
        </div>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-secondary">
          AI Instruction
        </span>
        <textarea
          name="ai-instruction"
          autoComplete="off"
          placeholder="For example, make this heading friendlier…"
          className="min-h-24 resize-y rounded-lg border border-border-default bg-raised p-2.5 text-sm text-ink"
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
        />
      </label>

      {/* Prompt chips — action/negation pairs */}
      <div className="flex flex-col gap-1.5" aria-label="Example instructions">
        {PROMPT_PAIRS.map(({ action, negation }) => (
          <div key={action} className="flex gap-1.5">
            <button
              className={`min-w-0 flex-1 cursor-pointer rounded-lg border px-2.5 py-2 text-left text-xs transition-colors duration-150 hover:bg-surface-hover ${instruction === action ? "border-primary bg-selection text-primary" : "border-border-default bg-raised text-secondary"}`}
              onClick={() => {
                setInstruction(action);
                setShowColorPicker(false);
              }}
            >
              {action}
            </button>
            {negation && (
              <button
                className={`cursor-pointer rounded-lg border px-2.5 py-2 text-xs transition-colors duration-150 hover:bg-surface-hover ${instruction === negation ? "border-primary bg-selection text-primary" : "border-border-default bg-raised text-ink-muted"}`}
                onClick={() => {
                  setInstruction(negation);
                  setShowColorPicker(false);
                }}
                title={`Opposite: ${negation}`}
              >
                {negation}
              </button>
            )}
          </div>
        ))}

        {/* Color change prompt — inline picker */}
        <div>
          <button
            className={`flex w-full cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-2 text-left text-xs transition-colors duration-150 hover:bg-surface-hover ${showColorPicker ? "border-primary bg-selection text-primary" : "border-border-default bg-raised text-secondary"}`}
            onClick={() => setShowColorPicker((v) => !v)}
            title="Open color change prompt builder"
          >
            <Pipette size={13} aria-hidden="true" />
            Change color…
          </button>
        </div>
      </div>

      {/* Inline color prompt builder */}
      {showColorPicker && (
        <div className="flex flex-col gap-3 rounded-xl border border-border-default bg-canvas-soft p-3">
          {hasBothColors && (
            <div
              className="grid grid-cols-2 rounded-lg bg-raised p-1 shadow-flat"
              role="group"
              aria-label="Color field"
            >
              <button
                className={`cursor-pointer rounded-md border-0 px-2 py-1.5 text-xs ${colorField === "text" ? "bg-selection text-primary" : "bg-transparent text-ink-muted"}`}
                onClick={() => setColorField("text")}
              >
                Text color
              </button>
              <button
                className={`cursor-pointer rounded-md border-0 px-2 py-1.5 text-xs ${colorField === "background" ? "bg-selection text-primary" : "bg-transparent text-ink-muted"}`}
                onClick={() => setColorField("background")}
              >
                Background color
              </button>
            </div>
          )}
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <label className="grid min-w-0 place-items-center gap-1 text-[10px] text-ink-muted">
              <span>From (Current)</span>
              <span
                className="size-8 rounded-md border border-border-default"
                style={{ backgroundColor: sourceColor }}
                aria-label={sourceColor}
              />
              <code className="max-w-full truncate font-mono">
                {sourceColor}
              </code>
            </label>
            <span className="text-ink-muted" aria-hidden="true">
              →
            </span>
            <label className="grid min-w-0 place-items-center gap-1 text-[10px] text-ink-muted">
              <span>To (Target)</span>
              <input
                type="color"
                className="size-8 cursor-pointer rounded-md border border-border-default bg-raised p-0.5"
                value={targetColor}
                onChange={(e) => setTargetColor(e.target.value)}
                aria-label="Target color"
              />
              <code className="max-w-full truncate font-mono">
                {targetColor}
              </code>
            </label>
          </div>
          <Button
            onClick={() => {
              setInstruction(colorPromptText);
              setShowColorPicker(false);
            }}
          >
            Use this prompt
          </Button>
        </div>
      )}

      {error && (
        <p
          className="m-0 rounded-lg border border-danger-border bg-danger-surface p-2.5 text-xs text-danger"
          role="alert"
        >
          {error}
        </p>
      )}
      <Button tone="primary" onClick={run}>
        <Sparkles size={16} aria-hidden="true" />
        Run AI Demo
      </Button>
      <ProposalReview />
    </div>
  );
}
