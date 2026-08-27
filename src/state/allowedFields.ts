import type { ElementType } from "./types";

export const EDITABLE_FIELDS: Record<ElementType, readonly string[]> = {
  heading: ["text", "fontSize", "fontWeight", "color", "align"],
  paragraph: ["text", "fontSize", "fontWeight", "color", "align"],
  button: [
    "text",
    "backgroundColor",
    "color",
    "width",
    "height",
    "borderRadius",
    "fontWeight",
  ],
  container: [
    "backgroundColor",
    "padding",
    "gap",
    "direction",
    "width",
    "height",
  ],
};
