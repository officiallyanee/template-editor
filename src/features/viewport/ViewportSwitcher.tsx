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
  return (
    <div
      className="flex items-center rounded-[10px] bg-canvas-soft p-[3px] shadow-flat"
      aria-label="Preview viewport"
    >
      {options.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          className={`flex cursor-pointer items-center gap-1.5 rounded-[7px] border-0 px-3 py-1.5 text-[13px] transition-colors duration-150 hover:text-ink ${state.viewport === value ? "bg-raised text-primary shadow-flat" : "bg-transparent text-ink-muted"}`}
          aria-pressed={state.viewport === value}
          onClick={() => actions.setViewport(value)}
        >
          <Icon size={16} aria-hidden="true" />
          <span className="max-lg:sr-only">{label}</span>
        </button>
      ))}
    </div>
  );
}
