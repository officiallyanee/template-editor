import type { ReactNode } from "react";
import { useEditorUi } from "../../app/EditorUiContext";
import type { Viewport } from "../../state/types";
import { PREVIEW_DIMENSIONS } from "./previewDimensions";

function DeviceHardware({ viewport }: { viewport: Viewport }) {
  return (
    <div
      className="device-frame-hardware"
      data-device-hardware={viewport}
      aria-hidden="true"
    >
      <span className="device-frame-detail device-frame-camera" />
      <span className="device-frame-detail device-frame-speaker" />
      <span className="device-frame-detail device-frame-button-start" />
      <span className="device-frame-detail device-frame-button-end" />
      <span className="device-frame-detail device-frame-laptop-base" />
    </div>
  );
}

export function DeviceFrame({
  viewport,
  children,
}: {
  viewport: Viewport;
  children: ReactNode;
}) {
  const { state } = useEditorUi();
  const dimensions = PREVIEW_DIMENSIONS[viewport];

  return (
    <div
      className="device-frame-shell relative flex w-full shrink-0 items-center justify-center transition-[max-width] duration-200 ease-out motion-reduce:transition-none"
      data-device-frame={state.deviceFrame}
      data-viewport={viewport}
      style={{ maxWidth: dimensions.width, height: dimensions.height }}
    >
      {state.deviceFrame === "on" ? (
        <DeviceHardware viewport={viewport} />
      ) : null}
      {children}
    </div>
  );
}
