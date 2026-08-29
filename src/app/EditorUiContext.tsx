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
type DeviceFrameState = "on" | "off";

interface EditorUiState {
  layers: LayerPanelState;
  canvasMode: CanvasMode;
  deviceFrame: DeviceFrameState;
}

interface EditorUiActions {
  toggleLayers: () => void;
  enterFullscreenPreview: () => void;
  exitFullscreenPreview: () => void;
  toggleDeviceFrame: () => void;
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
const DEVICE_FRAME_KEY = "scope-device-frame:v2";
const LEGACY_DEVICE_FRAME_KEY = "scope-device-frame";
const EditorUiContext = createContext<EditorUiContextValue | null>(null);

function initialLayers(): LayerPanelState {
  const existing = document.documentElement.dataset.layers;
  if (existing === "open" || existing === "closed") return existing;
  return localStorage.getItem(LAYERS_KEY) === "closed" ? "closed" : "open";
}

function initialDeviceFrame(): DeviceFrameState {
  return localStorage.getItem(DEVICE_FRAME_KEY) === "on" ? "on" : "off";
}

export function EditorUiProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<EditorUiState>(() => ({
    layers: initialLayers(),
    canvasMode: "editor",
    deviceFrame: initialDeviceFrame(),
  }));

  useEffect(() => {
    document.documentElement.dataset.layers = state.layers;
    localStorage.setItem(LAYERS_KEY, state.layers);
  }, [state.layers]);

  useEffect(() => {
    localStorage.setItem(DEVICE_FRAME_KEY, state.deviceFrame);
    localStorage.removeItem(LEGACY_DEVICE_FRAME_KEY);
  }, [state.deviceFrame]);

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
        toggleDeviceFrame: () =>
          setState((current) => ({
            ...current,
            deviceFrame: current.deviceFrame === "on" ? "off" : "on",
          })),
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
