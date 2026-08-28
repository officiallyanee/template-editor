import type { TemplateElement, TemplateState } from "../state/types";

function element(
  input: Omit<TemplateElement, "overrides" | "history"> &
    Partial<Pick<TemplateElement, "overrides">>,
): TemplateElement {
  return { ...input, overrides: input.overrides ?? {}, history: [] };
}

/**
 * A compact product-status page that stresses responsive container direction,
 * mixed child types, sizing, alignment, and viewport overrides.
 */
export const dashboardTemplate: TemplateState = {
  templateId: "launch-dashboard",
  version: 1,
  rootId: "page",
  elements: {
    page: element({
      id: "page",
      type: "container",
      label: "Dashboard page",
      parentId: null,
      order: 0,
      base: {
        backgroundColor: "#f4f1e8",
        padding: 32,
        gap: 18,
        direction: "column",
      },
      overrides: { mobile: { padding: 18, gap: 14 } },
    }),
    eyebrow: element({
      id: "eyebrow",
      type: "paragraph",
      label: "Release status",
      parentId: "page",
      order: 0,
      base: {
        text: "RELEASE 08 · ON TRACK",
        color: "#18643c",
        fontSize: 13,
        fontWeight: 700,
        align: "left",
        alignSelf: "start",
      },
    }),
    headline: element({
      id: "headline",
      type: "heading",
      label: "Dashboard heading",
      parentId: "page",
      order: 1,
      base: {
        text: "Launch work, without losing the thread.",
        color: "#232a31",
        fontSize: 48,
        fontWeight: 700,
        align: "left",
        alignSelf: "stretch",
      },
      overrides: {
        tablet: { fontSize: 40 },
        mobile: { fontSize: 32, align: "center" },
      },
    }),
    intro: element({
      id: "intro",
      type: "paragraph",
      label: "Dashboard summary",
      parentId: "page",
      order: 2,
      base: {
        text: "A focused view of momentum, open decisions, and the next action your team can take.",
        color: "#505860",
        fontSize: 17,
        fontWeight: 400,
        align: "left",
        alignSelf: "stretch",
      },
      overrides: { mobile: { align: "center" } },
    }),
    cta: element({
      id: "cta",
      type: "button",
      label: "Review action",
      parentId: "page",
      order: 3,
      base: {
        text: "Review launch",
        backgroundColor: "#2457c5",
        color: "#ffffff",
        width: 168,
        height: 46,
        borderRadius: 6,
        fontWeight: 700,
        alignSelf: "start",
      },
      overrides: { mobile: { width: 220, alignSelf: "center" } },
    }),
    services: element({
      id: "services",
      type: "container",
      label: "Status row",
      parentId: "page",
      order: 4,
      base: {
        backgroundColor: "#ffffff",
        padding: 20,
        gap: 18,
        direction: "row",
        alignSelf: "stretch",
        borderRadius: 10,
      },
      overrides: {
        tablet: { gap: 12 },
        mobile: { direction: "column", padding: 16, gap: 14 },
      },
    }),
    service1: element({
      id: "service1",
      type: "paragraph",
      label: "Momentum metric",
      parentId: "services",
      order: 0,
      base: {
        text: "74%\nMilestones complete",
        color: "#232a31",
        fontSize: 18,
        fontWeight: 700,
        align: "left",
      },
      overrides: { mobile: { align: "center", fontSize: 20 } },
    }),
    service2: element({
      id: "service2",
      type: "button",
      label: "Risk filter",
      parentId: "services",
      order: 1,
      base: {
        text: "3 decisions need attention",
        backgroundColor: "#fff0c7",
        color: "#654600",
        width: 230,
        height: 52,
        borderRadius: 6,
        fontWeight: 600,
        alignSelf: "end",
      },
      overrides: { mobile: { width: 250, alignSelf: "center" } },
    }),
  },
};
