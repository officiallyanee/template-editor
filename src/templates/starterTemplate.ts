import type { TemplateElement, TemplateState } from "../state/types";

function element(
  input: Omit<TemplateElement, "overrides" | "history"> &
    Partial<Pick<TemplateElement, "overrides">>,
): TemplateElement {
  return { ...input, overrides: input.overrides ?? {}, history: [] };
}
export const starterTemplate: TemplateState = {
  templateId: "brightpath-studio",
  version: 1,
  rootId: "page",
  elements: {
    page: element({
      id: "page",
      type: "container",
      label: "Page",
      parentId: null,
      order: 0,
      base: {
        backgroundColor: "#ffe5e5",
        padding: 24,
        gap: 20,
        direction: "column",
      },
    }),
    eyebrow: element({
      id: "eyebrow",
      type: "paragraph",
      label: "Eyebrow",
      parentId: "page",
      order: 0,
      base: {
        text: "BRIGHTPATH STUDIO",
        color: "#0067b9",
        fontSize: 13,
        fontWeight: 700,
        align: "center",
      },
    }),
    headline: element({
      id: "headline",
      type: "heading",
      label: "Hero heading",
      parentId: "page",
      order: 1,
      base: {
        text: "Build a brighter business, one clear step at a time.",
        color: "#005bab",
        fontSize: 54,
        fontWeight: 700,
        align: "center",
      },
      overrides: { mobile: { fontSize: 35 } },
    }),
    intro: element({
      id: "intro",
      type: "paragraph",
      label: "Hero copy",
      parentId: "page",
      order: 2,
      base: {
        text: "Practical strategy, thoughtful design, and a partner who keeps the work moving.",
        color: "#615d59",
        fontSize: 18,
        fontWeight: 400,
        align: "center",
      },
    }),
    cta: element({
      id: "cta",
      type: "button",
      label: "Primary action",
      parentId: "page",
      order: 3,
      base: {
        text: "Start a project",
        backgroundColor: "#171717",
        color: "#ffffff",
        width: 168,
        height: 48,
        borderRadius: 8,
        fontWeight: 600,
      },
      overrides: { mobile: { width: 210 } },
    }),
    services: element({
      id: "services",
      type: "container",
      label: "Services grid",
      parentId: "page",
      order: 4,
      base: {
        backgroundColor: "#f6f5f4",
        padding: 24,
        gap: 16,
        direction: "row",
      },
      overrides: { mobile: { direction: "column" } },
    }),
    service1: element({
      id: "service1",
      type: "paragraph",
      label: "Strategy card",
      parentId: "services",
      order: 0,
      base: {
        text: "01 — Strategy\nA focused plan built around what matters now.",
        color: "#31302e",
        fontSize: 16,
        fontWeight: 500,
        align: "left",
      },
    }),
    service2: element({
      id: "service2",
      type: "paragraph",
      label: "Design card",
      parentId: "services",
      order: 1,
      base: {
        text: "02 — Design\nA distinct system your team can actually use.",
        color: "#31302e",
        fontSize: 16,
        fontWeight: 500,
        align: "left",
      },
    }),
  },
};
