import type { Viewport } from "../../state/types";

export const PREVIEW_DIMENSIONS: Record<
  Viewport,
  { width: number; minHeight: number }
> = {
  desktop: { width: 920, minHeight: 650 },
  tablet: { width: 768, minHeight: 720 },
  mobile: { width: 375, minHeight: 667 },
};
