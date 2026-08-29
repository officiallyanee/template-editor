import { Monitor, Smartphone, Tablet } from "lucide-react";
import { useEditor } from "../../state/StateContext";
import type { Viewport } from "../../state/types";
const options: { value: Viewport; label: string; icon: typeof Monitor }[] = [
  { value: "desktop", label: "Desktop", icon: Monitor },
  { value: "tablet", label: "Tablet", icon: Tablet },
  { value: "mobile", label: "Mobile", icon: Smartphone },
];
export function ViewportSwitcher() {
  const { state, actions } = useEditor();
  const lockedViewport = state.editScope === "all" ? null : state.editScope;
  return (
    <div
      className="flex shrink-0 items-center rounded-lg bg-canvas-soft p-[3px] shadow-flat"
      aria-label="Preview viewport"
    >
      {options.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          className={`flex cursor-pointer items-center gap-1.5 rounded-md border-0 px-3 py-1.5 text-sm transition-colors duration-150 hover:text-ink disabled:cursor-not-allowed disabled:text-ink-faint ${state.viewport === value ? "bg-raised text-primary shadow-flat" : "bg-transparent text-ink-muted"}`}
          aria-pressed={state.viewport === value}
          disabled={lockedViewport !== null && lockedViewport !== value}
          title={
            lockedViewport !== null && lockedViewport !== value
              ? `Editing is locked to ${lockedViewport}. Choose All Views to switch previews.`
              : undefined
          }
          onClick={() => actions.setViewport(value)}
        >
          <Icon size={16} aria-hidden="true" />
          <span className="max-lg:sr-only">{label}</span>
        </button>
      ))}
      <span className="sr-only" aria-live="polite">
        {lockedViewport
          ? `Preview locked to ${lockedViewport} while editing ${lockedViewport} only.`
          : "All preview viewports are available."}
      </span>
    </div>
  );
}
