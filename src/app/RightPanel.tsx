import { Braces, History, MousePointer2, Sparkles } from "lucide-react";
import { useState } from "react";
import { InspectorPanel } from "../features/canvas/InspectorPanel";
import { CodeEditorPanel } from "../features/code-editor/CodeEditorPanel";
import { AiDemoPanel } from "../features/ai-demo/AiDemoPanel";
import { HistoryPanel } from "../features/history/HistoryPanel";
const tabs = [
  { id: "edit", label: "Edit", icon: MousePointer2 },
  { id: "code", label: "Code", icon: Braces },
  { id: "ai", label: "AI", icon: Sparkles },
  { id: "history", label: "History", icon: History },
] as const;
export function RightPanel() {
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("edit");
  return (
    <aside
      className="min-h-0 overflow-hidden border-l border-border-default bg-canvas max-sm:border-t max-sm:border-l-0"
      aria-label="Editing tools"
    >
      <div
        className="grid grid-cols-4 border-b border-border-default"
        role="tablist"
        aria-label="Editing tools"
      >
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            aria-controls={`panel-${id}`}
            id={`tab-${id}`}
            className={`flex cursor-pointer flex-col items-center gap-1 border-0 border-b-2 px-1 py-3 text-[11px] transition-colors duration-150 hover:bg-surface-hover hover:text-ink ${tab === id ? "border-primary bg-selection text-primary" : "border-transparent bg-transparent text-ink-muted"}`}
            onClick={() => setTab(id)}
          >
            <Icon size={16} aria-hidden="true" />
            <span>{label}</span>
          </button>
        ))}
      </div>
      <div
        className="h-[calc(100%-57px)] overflow-auto p-4 max-sm:p-3"
        role="tabpanel"
        id={`panel-${tab}`}
        aria-labelledby={`tab-${tab}`}
      >
        {tab === "edit" && <InspectorPanel />}
        {tab === "code" && <CodeEditorPanel />}
        {tab === "ai" && <AiDemoPanel />}
        {tab === "history" && <HistoryPanel />}
      </div>
    </aside>
  );
}
