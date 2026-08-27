import { resolved } from "../../state/resolver";
import type {
  PendingProposal,
  StrategyGroup,
  TemplateState,
  Viewport,
  ViewportScope,
} from "../../state/types";
import { meetsContrast } from "./contrast";
import { parseColorPrompt } from "./promptParser";
import { buildProposal } from "./proposalBuilder";
import { explicitColorValues } from "./resolveColorChange";
import { documentedStrategies, type StrategySpec } from "./strategies";

export type DemoResult =
  | { ok: true; strategyGroups: StrategyGroup[]; proposals: PendingProposal[] }
  | { ok: false; error: { code: string; detail: string } };

export function runDemo(
  instruction: string,
  selectedIds: string[],
  scope: ViewportScope,
  viewport: Viewport,
  state: TemplateState,
  baseRevision = state.version,
): DemoResult {
  if (!selectedIds.length)
    return {
      ok: false,
      error: {
        code: "NO_SELECTION",
        detail: "Select at least one element, then run the demo again.",
      },
    };
  if (baseRevision !== state.version)
    return {
      ok: false,
      error: {
        code: "STALE_REVISION",
        detail: `The page moved from version ${baseRevision} to ${state.version}. Refresh the request.`,
      },
    };
  const elements = selectedIds.map((id) => state.elements[id]);
  const missing = selectedIds.find((_, index) => !elements[index]);
  if (missing)
    return {
      ok: false,
      error: {
        code: "UNKNOWN_TARGET",
        detail: `The selected element ${missing} no longer exists.`,
      },
    };

  const parsed = parseColorPrompt(instruction);
  if (parsed.matched && !parsed.ok) return { ok: false, error: parsed.error };
  let explicitFailure: { code: string; detail: string } | undefined;
  const specs: StrategySpec[] =
    parsed.matched && parsed.ok
      ? [
          {
            strategyId: "explicit-color-change",
            label: "Requested Color Change",
            rationale:
              "Applies the exact requested color after checking its source value and contrast.",
            valuesFor: (element, current) => {
              const result = explicitColorValues(
                parsed.field,
                parsed.from,
                parsed.to,
                element,
                current,
              );
              if ("error" in result) {
                explicitFailure = result.error;
                return null;
              }
              return result;
            },
          },
        ]
      : documentedStrategies(instruction, scope);
  if (
    /mobile|stack|responsive/i.test(instruction.trim()) &&
    scope !== "mobile"
  ) {
    return {
      ok: false,
      error: {
        code: "OUT_OF_SCOPE",
        detail:
          "“Stack this on mobile” requires the mobile edit scope. Switch edit scope to mobile.",
      },
    };
  }

  if (!specs.length)
    return {
      ok: false,
      error: {
        code: "UNSUPPORTED",
        detail:
          "Try “Make it more prominent” or “Change text color from #171717 to #005bab.”",
      },
    };

  const strategyGroups: StrategyGroup[] = [];
  for (const spec of specs) {
    const proposals: PendingProposal[] = [];
    for (const element of elements) {
      const targetProps =
        scope === "all" ? element.base : resolved(element, scope);
      const values = spec.valuesFor(element, targetProps);
      if (!values) continue;
      const proposal = buildProposal(
        state,
        element,
        selectedIds,
        instruction,
        spec.strategyId,
        scope,
        viewport,
        baseRevision,
        values,
      );
      if (proposal && !("id" in proposal))
        return { ok: false, error: proposal.error };
      if (proposal) proposals.push(proposal);
    }
    if (explicitFailure) return { ok: false, error: explicitFailure };
    if (proposals.length)
      strategyGroups.push({
        strategyId: spec.strategyId,
        label: spec.label,
        rationale: spec.rationale,
        metrics: {
          evaluated: proposals.filter((proposal) => proposal.metrics).length,
          compliant: proposals.filter(
            (proposal) =>
              proposal.metrics &&
              meetsContrast(
                proposal.metrics.contrastAfter,
                proposal.metrics.requiredContrast,
              ),
          ).length,
        },
        proposals,
      });
  }
  const proposals = strategyGroups.flatMap((group) => group.proposals);
  return proposals.length
    ? { ok: true, strategyGroups, proposals }
    : {
        ok: false,
        error: {
          code: "UNSUPPORTED",
          detail: "The selected elements do not support that deterministic change.",
        },
      };
}
