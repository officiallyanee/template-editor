import { contrastRatio } from "../ai-demo/contrast";

export interface SurroundPalette {
  light: string;
  dark: string;
}

export interface PreviewSurroundChoice {
  color: string;
  contrast: number;
  useBorder: boolean;
}

export function choosePreviewSurround(
  pageBackground: string,
  palette: SurroundPalette,
): PreviewSurroundChoice {
  const lightContrast = contrastRatio(pageBackground, palette.light);
  const darkContrast = contrastRatio(pageBackground, palette.dark);
  const color = lightContrast > darkContrast ? palette.light : palette.dark;
  const contrast = Math.max(lightContrast, darkContrast);
  return { color, contrast, useBorder: contrast < 3 };
}
