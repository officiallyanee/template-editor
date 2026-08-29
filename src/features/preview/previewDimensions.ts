import type { Viewport } from "../../state/types";

export const PREVIEW_DIMENSIONS: Record<
  Viewport,
  { width: number; height: number }
> = {
  desktop: { width: 920, height: 650 },
  tablet: { width: 768, height: 720 },
  mobile: { width: 375, height: 667 },
};
