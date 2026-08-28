import { resolved } from "../../state/resolver";
import type {
  PendingProposal,
  ProposalOutcome,
  StrategyGroup,
  TemplateState,
  Viewport,
  ViewportScope,
} from "../../state/types";
import { meetsContrast } from "./contrast";
import { parseColorPrompt } from "./promptParser";
import { buildProposal } from "./proposalBuilder";
import { buildReorderProposal } from "./reorderProposalBuilder";
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

  const reorderMatch = instruction
    .trim()
    .toLowerCase()
    .match(/\bmove\b.*\b(beginning|first|start|end|last)\b/);
  if (reorderMatch) {
    const position = /beginning|first|start/.test(reorderMatch[1])
      ? "first"
      : "last";
    const proposal = buildReorderProposal(
      state,
      selectedIds,
      instruction,
      position,
      scope,
      baseRevision,
    );
    if (proposal && !("id" in proposal))
      return { ok: false, error: proposal.error };
    const target = elements[0];
    const strategyId = position === "first" ? "reorder-first" : "reorder-last";
    const group: StrategyGroup = {
      strategyId,
      label: position === "first" ? "Move to Beginning" : "Move to End",
      rationale:
        "Changes only this element’s shared sibling order and keeps every property intact.",
      metrics: { evaluated: 0, compliant: 0 },
      proposals: proposal ? [proposal] : [],
      outcomes: proposal
        ? []
        : [
            {
              id: `${strategyId}:${target.id}:no-op`,
              targetId: target.id,
              status: "no-op",
              detail: `${target.label} is already at that boundary.`,
            },
          ],
    };
    return {
      ok: true,
      strategyGroups: [group],
      proposals: group.proposals,
    };
  }

  const parsed = parseColorPrompt(instruction);
  if (parsed.matched && !parsed.ok) return { ok: false, error: parsed.error };
  const explicitFailures = new Map<string, { code: string; detail: string }>();
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
                explicitFailures.set(element.id, result.error);
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

  const candidateGroups: StrategyGroup[] = [];
  for (const spec of specs) {
    const proposals: PendingProposal[] = [];
    const outcomes: ProposalOutcome[] = [];
    for (const element of elements) {
      const targetProps =
        scope === "all" ? element.base : resolved(element, scope);
      const values = spec.valuesFor(element, targetProps);
      if (!values) {
        const failure = explicitFailures.get(element.id);
        outcomes.push({
          id: `${spec.strategyId}:${element.id}:${failure ? "invalid" : "unsupported"}`,
          targetId: element.id,
          status: failure ? "invalid" : "unsupported",
          detail: failure
            ? failure.detail
            : `${element.label} does not support this strategy.`,
        });
        continue;
      }
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
      if (proposal && !("id" in proposal)) {
        outcomes.push({
          id: `${spec.strategyId}:${element.id}:invalid`,
          targetId: element.id,
          status: "invalid",
          detail: proposal.error.detail,
        });
      } else if (proposal) proposals.push(proposal);
      else
        outcomes.push({
          id: `${spec.strategyId}:${element.id}:no-op`,
          targetId: element.id,
          status: "no-op",
          detail: `${element.label} already matches this strategy.`,
        });
    }
    candidateGroups.push({
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
      outcomes,
    });
  }
  const actionableGroups = candidateGroups.filter(
    (group) =>
      group.proposals.length > 0 ||
      group.outcomes.some((outcome) => outcome.status !== "unsupported"),
  );
  const strategyGroups = actionableGroups.length
    ? actionableGroups
    : candidateGroups.slice(0, 1);
  const proposals = strategyGroups.flatMap((group) => group.proposals);
  return { ok: true, strategyGroups, proposals };
}
