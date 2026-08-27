import { Moon, RotateCcw, ShieldCheck, Sun } from "lucide-react";
import { Button } from "../components/Button";
import { Canvas } from "../features/canvas/Canvas";
import { LayerList } from "../features/layers/LayerList";
import { ViewportSwitcher } from "../features/viewport/ViewportSwitcher";
import { useEditor } from "../state/StateContext";
import type { ViewportScope } from "../state/types";
import { RightPanel } from "./RightPanel";
import { useTheme } from "./ThemeProvider";
export function App() {
  const { state, actions } = useEditor();
  const { theme, toggleTheme } = useTheme();
  return (
    <div className="h-dvh min-w-0 overflow-hidden">
      <a
        href="#main-content"
        className="fixed top-2 left-2 z-50 -translate-y-[160%] rounded-lg bg-ink px-3.5 py-2.5 text-white transition-transform duration-150 focus:translate-y-0"
      >
        Skip to canvas
      </a>
      <header className="relative z-10 flex h-[68px] items-center justify-between gap-5 border-b border-hairline bg-canvas px-5 max-sm:h-28 max-sm:flex-wrap max-sm:content-center max-sm:gap-2 max-sm:px-3">
        <div className="flex items-center gap-2.5">
          <div className="grid size-[34px] place-items-center rounded-[9px] bg-ink text-canvas">
            <ShieldCheck size={19} aria-hidden="true" />
          </div>
          <div className="max-sm:hidden">
            <strong className="block text-[17px] tracking-[-0.25px]">
              Scope
            </strong>
            <span className="block text-[11px] tracking-[.08em] text-ink-muted uppercase">
              AI Template Editor
            </span>
          </div>
        </div>
        <ViewportSwitcher />
        <div className="flex items-center gap-3 max-sm:w-full max-sm:justify-end max-sm:gap-2">
          <label className="flex items-center gap-2">
            <span className="text-[11px] font-semibold tracking-[.06em] text-ink-muted uppercase max-sm:sr-only">
              Edit Scope
            </span>
            <select
              aria-label="Edit Scope"
              name="edit-scope"
              className="rounded-lg border border-hairline bg-raised py-1.5 pr-7 pl-2 text-[13px] text-ink"
              value={state.editScope}
              onChange={(e) =>
                actions.setEditScope(e.target.value as ViewportScope)
              }
            >
              <option value="all">All Views</option>
              <option value="desktop">Desktop Only</option>
              <option value="tablet">Tablet Only</option>
              <option value="mobile">Mobile Only</option>
            </select>
          </label>
          <span
            className="flex items-center gap-1.5 whitespace-nowrap text-xs text-ink-muted max-lg:hidden"
            aria-live="polite"
          >
            <span className="size-[7px] rounded-full bg-success" />
            Saved · v{state.template.version}
          </span>
          <Button
            aria-label={`Switch to ${theme === "light" ? "Dark" : "Light"} Theme`}
            title={`Switch to ${theme === "light" ? "Dark" : "Light"} Theme`}
            onClick={toggleTheme}
            className="px-2.5"
          >
            {theme === "light" ? (
              <Moon size={15} aria-hidden="true" />
            ) : (
              <Sun size={15} aria-hidden="true" />
            )}
            <span className="max-xl:sr-only">
              {theme === "light" ? "Dark" : "Light"}
            </span>
          </Button>
          <Button
            onClick={() => {
              if (
                window.confirm(
                  "Reset the template and remove its local history?",
                )
              )
                actions.reset();
            }}
          >
            <RotateCcw size={15} aria-hidden="true" />
            <span className="max-xl:sr-only">Reset</span>
          </Button>
        </div>
      </header>
      {state.lastError && (
        <div
          className="fixed top-[78px] left-1/2 z-20 -translate-x-1/2 rounded-lg border border-danger-border bg-danger-surface px-3.5 py-2.5 text-[13px] text-danger"
          role="alert"
        >
          {state.lastError}
        </div>
      )}
      <div className="grid h-[calc(100dvh-68px)] min-w-0 grid-cols-[230px_minmax(480px,1fr)_350px] max-xl:grid-cols-[190px_minmax(380px,1fr)_320px] max-lg:grid-cols-[minmax(0,1fr)_320px] max-sm:h-[calc(100dvh-112px)] max-sm:grid-cols-1 max-sm:grid-rows-[minmax(320px,1fr)_minmax(280px,45vh)]">
        <LayerList />
        <Canvas />
        <RightPanel />
      </div>
    </div>
  );
}
