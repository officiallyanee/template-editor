import type {
  ElementProperties,
  TemplateElement,
  TemplateState,
  ViewportScope,
} from "../../state/types";
import { resolved } from "../../state/resolver";

export interface StrategySpec {
  strategyId: string;
  label: string;
  rationale: string;
  valuesFor: (
    element: TemplateElement,
    current: ElementProperties,
  ) => Partial<ElementProperties> | null;
  unsupportedReasonFor?: (element: TemplateElement) => string;
}

export function prominentStrategies(): StrategySpec[] {
  return [
    {
      strategyId: "typography-hierarchy",
      label: "Typography Hierarchy",
      rationale: "Uses weight to strengthen hierarchy without changing color.",
      valuesFor: (element, current) =>
        element.type === "container"
          ? null
          : { fontWeight: Math.min((current.fontWeight ?? 400) + 100, 800) },
    },
    {
      strategyId: "accessible-contrast",
      label: "Accessible Contrast",
      rationale:
        "Uses the primary design token and verifies WCAG text contrast.",
      valuesFor: (element) =>
        element.type === "button"
          ? { backgroundColor: "#005bab", color: "#ffffff" }
          : element.type === "container"
            ? null
            : { color: "#005bab" },
    },
    {
      strategyId: "spatial-emphasis",
      label: "Scale & Space",
      rationale: "Creates emphasis through scale or surrounding space.",
      valuesFor: (element, current) => {
        if (element.type === "container")
          return {
            padding: Math.min((current.padding ?? 16) + 8, 120),
            gap: Math.min((current.gap ?? 12) + 4, 96),
          };
        if (element.type === "button")
          return {
            width: Math.min((current.width ?? 120) + 16, 1440),
            height: Math.min((current.height ?? 40) + 4, 900),
          };
        return current.fontSize
          ? { fontSize: Math.min(current.fontSize + 6, 96) }
          : null;
      },
    },
  ];
}

/** Negation of prominentStrategies — reduces weight, restores neutral color, trims space. */
export function softenStrategies(): StrategySpec[] {
  return [
    {
      strategyId: "reduce-weight",
      label: "Reduce Weight",
      rationale:
        "Steps typographic weight down one notch for a lighter presence.",
      valuesFor: (element, current) =>
        element.type === "container"
          ? null
          : { fontWeight: Math.max((current.fontWeight ?? 400) - 100, 300) },
    },
    {
      strategyId: "neutral-color",
      label: "Neutral Color",
      rationale:
        "Restores the element to a neutral dark tone for a quieter hierarchy.",
      valuesFor: (element) =>
        element.type === "button"
          ? { backgroundColor: "#404040", color: "#ffffff" }
          : element.type === "container"
            ? null
            : { color: "#404040" },
    },
    {
      strategyId: "trim-space",
      label: "Trim Space",
      rationale:
        "Reduces scale or surrounding space to create a more compact presence.",
      valuesFor: (element, current) => {
        if (element.type === "container")
          return {
            padding: Math.max((current.padding ?? 24) - 8, 0),
            gap: Math.max((current.gap ?? 16) - 4, 0),
          };
        if (element.type === "button")
          return {
            width: Math.max((current.width ?? 168) - 16, 40),
            height: Math.max((current.height ?? 44) - 4, 24),
          };
        return current.fontSize
          ? { fontSize: Math.max(current.fontSize - 6, 10) }
          : null;
      },
    },
  ];
}

export function sizingStrategies(): StrategySpec[] {
  return [
    {
      strategyId: "type-scale",
      label: "Type Scale",
      rationale:
        "Increases type size for enhanced readability and visual presence.",
      valuesFor: (element, current) =>
        element.type === "container"
          ? null
          : current.fontSize
            ? { fontSize: Math.min(current.fontSize + 6, 96) }
            : null,
    },
    {
      strategyId: "weight-emphasis",
      label: "Weight Emphasis",
      rationale: "Increases typographic weight for a stronger visual presence.",
      valuesFor: (element, current) =>
        element.type === "container"
          ? null
          : { fontWeight: Math.min((current.fontWeight ?? 400) + 100, 800) },
    },
    {
      strategyId: "spatial-scale",
      label: "Spatial Dimensions",
      rationale: "Increases element padding, gap, or container boundaries.",
      valuesFor: (element, current) => {
        if (element.type === "container")
          return {
            padding: Math.min((current.padding ?? 16) + 8, 120),
            gap: Math.min((current.gap ?? 12) + 4, 96),
          };
        if (element.type === "button")
          return {
            width: Math.min((current.width ?? 120) + 16, 1440),
            height: Math.min((current.height ?? 40) + 4, 900),
          };
        return null;
      },
    },
  ];
}

/** Negation of sizingStrategies — reduces font size, weight, and spatial dimensions. */
export function shrinkStrategies(): StrategySpec[] {
  return [
    {
      strategyId: "type-scale-down",
      label: "Type Scale Down",
      rationale: "Reduces type size for a more compact, secondary presence.",
      valuesFor: (element, current) =>
        element.type === "container"
          ? null
          : current.fontSize
            ? { fontSize: Math.max(current.fontSize - 6, 10) }
            : null,
    },
    {
      strategyId: "weight-reduce",
      label: "Weight Reduce",
      rationale:
        "Steps typographic weight down one notch for a lighter stroke.",
      valuesFor: (element, current) =>
        element.type === "container"
          ? null
          : { fontWeight: Math.max((current.fontWeight ?? 400) - 100, 300) },
    },
    {
      strategyId: "spatial-trim",
      label: "Spatial Trim",
      rationale: "Reduces element padding, gap, or button dimensions.",
      valuesFor: (element, current) => {
        if (element.type === "container")
          return {
            padding: Math.max((current.padding ?? 24) - 8, 0),
            gap: Math.max((current.gap ?? 16) - 4, 0),
          };
        if (element.type === "button")
          return {
            width: Math.max((current.width ?? 168) - 16, 40),
            height: Math.max((current.height ?? 44) - 4, 24),
          };
        return null;
      },
    },
  ];
}

function friendlyCopyFor(element: TemplateElement): string | null {
  if (element.type === "container") return null;
  if (element.type === "button") return "Plan my next step";
  if (element.id === "eyebrow") return "Example Studio · Practical craft";
  if (element.id === "headline" || element.type === "heading")
    return "Clear ideas, thoughtfully brought to life.";
  if (element.id === "intro")
    return "We help teams clarify direction, design with intention, and build momentum.";
  if (element.id === "service1")
    return "01 — Strategy\nA clear, focused plan built for what matters now.";
  if (element.id === "service2")
    return "02 — Design\nA flexible, reliable system your team will love using.";
  return "Clear ideas, thoughtfully brought to life.";
}

export function documentedStrategies(
  instruction: string,
  scope: ViewportScope,
  state: TemplateState,
): StrategySpec[] {
  const text = instruction.toLowerCase();
  if (/less.prominent|softer|lighter.weight|de.emphasize|quieter/.test(text))
    return softenStrategies();
  if (/prominent|emphasis/.test(text)) return prominentStrategies();
  if (/rewrite|friendlier|clearer/.test(text))
    return [
      {
        strategyId: "friendly-copy",
        label: "Friendly Copy",
        rationale:
          "Rewrites selected copy with a concise, approachable tone tailored to each element.",
        valuesFor: (element) => {
          const copy = friendlyCopyFor(element);
          return copy ? { text: copy } : null;
        },
      },
    ];
  if (/bigger|resize|wider/.test(text)) return sizingStrategies();
  if (/smaller|shrink|reduce|compact.size/.test(text))
    return shrinkStrategies();
  if (/mobile|stack|responsive/.test(text) && scope === "mobile")
    return [
      {
        strategyId: "mobile-stack",
        label: "Mobile Stack",
        rationale:
          "Stacks container content only in the mobile override layer.",
        valuesFor: (element) =>
          element.type === "container"
            ? { direction: "column", gap: 12 }
            : null,
      },
    ];
  if (/compact|spacing|multi/.test(text))
    return [
      {
        strategyId: "compact-layout",
        label: "Compact Layout",
        rationale:
          "Reduces spacing or type scale while preserving the selection.",
        valuesFor: (element, current) =>
          element.type === "container"
            ? { gap: 10, padding: 18 }
            : current.fontSize
              ? { fontSize: Math.max(current.fontSize - 2, 12) }
              : null,
      },
    ];
  const logicalPosition = text.match(
    /\b(?:align|position)\b.*\b(start|center|end|stretch)\b/,
  )?.[1] as NonNullable<ElementProperties["alignSelf"]> | undefined;
  const physicalPosition = text.match(
    /\b(?:align|position)\b.*\b(left|right)\b/,
  )?.[1] as "left" | "right" | undefined;
  const position =
    logicalPosition ??
    (physicalPosition === "left"
      ? "start"
      : physicalPosition === "right"
        ? "end"
        : undefined);
  if (position)
    return [
      {
        strategyId: "cross-axis-position",
        label: physicalPosition
          ? `Align ${physicalPosition === "left" ? "Left" : "Right"}`
          : "Position in Container",
        rationale:
          physicalPosition != null
            ? "Aligns each supported selection horizontally within a vertically stacked parent."
            : "Moves each supported selection on its parent container's cross axis without freeform coordinates.",
        valuesFor: (element) => {
          if (element.parentId === null) return null;
          if (physicalPosition) {
            const parent = state.elements[element.parentId];
            if (!parent) return null;
            const parentProps =
              scope === "all" ? parent.base : resolved(parent, scope);
            if (parentProps.direction !== "column") return null;
          }
          return { alignSelf: position };
        },
        unsupportedReasonFor: (element) => {
          if (element.parentId === null)
            return `${element.label} has no parent container to align within.`;
          if (physicalPosition)
            return `${element.label} is inside a horizontal row. Left/right alignment requires a vertically stacked parent; use start/end for logical cross-axis placement.`;
          return `${element.label} does not support this position strategy.`;
        },
      },
    ];
  if (/blue|color/.test(text)) return [prominentStrategies()[1]];
  return [];
}
