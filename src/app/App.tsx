import { Moon, RotateCcw, Save, Sun } from "lucide-react";
import { Button } from "../components/Button";
import { Canvas } from "../features/canvas/Canvas";
import { LayerList } from "../features/layers/LayerList";
import { ViewportSwitcher } from "../features/viewport/ViewportSwitcher";
import { FullscreenPreview } from "../features/preview/FullscreenPreview";
import { useEditor } from "../state/StateContext";
import type { ViewportScope } from "../state/types";
import { RightPanel } from "./RightPanel";
import { useTheme } from "./ThemeProvider";
import { useEditorUi } from "./EditorUiContext";
export function App() {
  const { state, actions } = useEditor();
  const { state: uiState } = useEditorUi();
  const { theme, toggleTheme } = useTheme();
  return (
    <div className="h-dvh min-w-0 overflow-hidden">
      <a
        href="#main-content"
        className="fixed top-2 left-2 z-50 -translate-y-[160%] rounded-lg bg-ink px-3.5 py-2.5 text-white transition-transform duration-150 focus:translate-y-0"
      >
        Skip to canvas
      </a>
      <header className="relative z-10 flex h-[68px] min-w-0 items-center justify-between gap-5 border-b border-hairline bg-canvas px-5 max-sm:h-28 max-sm:flex-wrap max-sm:content-center max-sm:gap-2 max-sm:px-3">
        <div className="flex shrink-0 items-center gap-2.5">
          <div>
            <strong className="block text-[17px] tracking-[-0.25px]">
              Scope
            </strong>
            <span className="block text-xs tracking-[.08em] text-ink-muted uppercase max-lg:hidden">
              AI Template Editor
            </span>
          </div>
        </div>
        <ViewportSwitcher />
        <div className="flex min-w-0 items-center gap-3 max-sm:grid max-sm:w-full max-sm:grid-cols-[minmax(0,1fr)_auto_auto] max-sm:gap-2">
          <label className="flex min-w-0 items-center gap-2">
            <span className="text-xs font-semibold tracking-[.06em] text-ink-muted uppercase max-sm:sr-only">
              Edit Scope
            </span>
            <select
              aria-label="Edit Scope"
              name="edit-scope"
              className="min-w-0 rounded-lg border border-hairline bg-raised py-1.5 pr-7 pl-2 text-sm text-ink max-sm:w-full"
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
            {state.hasUnsavedVersion ? "Autosaved" : "Version saved"} · v
            {state.template.version}
          </span>
          <Button
            className="max-lg:hidden"
            disabled={!state.hasUnsavedVersion}
            onClick={actions.saveVersion}
          >
            <Save size={15} aria-hidden="true" />
            Save Version
          </Button>
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
          className="fixed top-[78px] left-1/2 z-20 max-w-[calc(100vw-24px)] -translate-x-1/2 break-words rounded-lg border border-danger-border bg-danger-surface px-3.5 py-2.5 text-sm text-danger max-sm:top-[92px]"
          role="alert"
        >
          {state.lastError}
        </div>
      )}
      <div
        id="editor-shell"
        className={`grid h-[calc(100dvh-68px)] min-h-0 min-w-0 overflow-hidden max-lg:grid-cols-[minmax(0,1fr)_320px] max-sm:h-[calc(100dvh-84px)] max-sm:grid-cols-1 max-sm:grid-rows-[minmax(0,55fr)_minmax(0,45fr)] ${uiState.layers === "open" ? "grid-cols-[clamp(210px,16vw,240px)_minmax(480px,1fr)_clamp(320px,24vw,360px)] max-xl:grid-cols-[190px_minmax(380px,1fr)_320px]" : "grid-cols-[64px_minmax(480px,1fr)_clamp(320px,24vw,360px)] max-xl:grid-cols-[64px_minmax(380px,1fr)_320px]"}`}
      >
        <LayerList />
        <Canvas />
        <RightPanel />
      </div>
      {uiState.canvasMode === "fullscreen-preview" && <FullscreenPreview />}
    </div>
  );
}
