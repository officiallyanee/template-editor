import type { ElementType } from "./types";

export const EDITABLE_FIELDS: Record<ElementType, readonly string[]> = {
  heading: ["text", "fontSize", "fontWeight", "color", "align", "alignSelf"],
  paragraph: ["text", "fontSize", "fontWeight", "color", "align", "alignSelf"],
  button: [
    "text",
    "backgroundColor",
    "color",
    "width",
    "height",
    "borderRadius",
    "fontWeight",
    "alignSelf",
  ],
  container: [
    "backgroundColor",
    "padding",
    "gap",
    "direction",
    "width",
    "height",
    "alignSelf",
  ],
};
