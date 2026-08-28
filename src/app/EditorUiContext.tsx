import {
  createContext,
  use,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type LayerPanelState = "open" | "closed";
type CanvasMode = "editor" | "fullscreen-preview";

interface EditorUiState {
  layers: LayerPanelState;
  canvasMode: CanvasMode;
}

interface EditorUiActions {
  toggleLayers: () => void;
  enterFullscreenPreview: () => void;
  exitFullscreenPreview: () => void;
}

interface EditorUiMeta {
  fullscreenTriggerId: string;
}

interface EditorUiContextValue {
  state: EditorUiState;
  actions: EditorUiActions;
  meta: EditorUiMeta;
}

const LAYERS_KEY = "scope-layers-panel";
const EditorUiContext = createContext<EditorUiContextValue | null>(null);

function initialLayers(): LayerPanelState {
  const existing = document.documentElement.dataset.layers;
  if (existing === "open" || existing === "closed") return existing;
  return localStorage.getItem(LAYERS_KEY) === "closed" ? "closed" : "open";
}

export function EditorUiProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<EditorUiState>(() => ({
    layers: initialLayers(),
    canvasMode: "editor",
  }));

  useEffect(() => {
    document.documentElement.dataset.layers = state.layers;
    localStorage.setItem(LAYERS_KEY, state.layers);
  }, [state.layers]);

  const value = useMemo<EditorUiContextValue>(
    () => ({
      state,
      actions: {
        toggleLayers: () =>
          setState((current) => ({
            ...current,
            layers: current.layers === "open" ? "closed" : "open",
          })),
        enterFullscreenPreview: () =>
          setState((current) => ({
            ...current,
            canvasMode: "fullscreen-preview",
          })),
        exitFullscreenPreview: () =>
          setState((current) => ({ ...current, canvasMode: "editor" })),
      },
      meta: { fullscreenTriggerId: "fullscreen-preview-trigger" },
    }),
    [state],
  );

  return <EditorUiContext value={value}>{children}</EditorUiContext>;
}

export function useEditorUi(): EditorUiContextValue {
  const value = use(EditorUiContext);
  if (!value)
    throw new Error("useEditorUi must be used inside EditorUiProvider");
  return value;
}
