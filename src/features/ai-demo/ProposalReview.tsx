import { useEditor } from "../../state/StateContext";
import { ProposalCard } from "./ProposalCard";
import { StrategySelector } from "./StrategySelector";
import { ProposalOutcomeRow } from "./ProposalOutcomeRow";

export function ProposalReview() {
  const { state } = useEditor();
  const active = state.strategyGroups.find(
    (group) => group.strategyId === state.activeStrategyId,
  );
  if (!active) return null;
  return (
    <section
      className="mt-1 flex flex-col gap-3 border-t border-border-default pt-4"
      aria-label="AI Proposal Review"
    >
      <StrategySelector />
      {(state.strategyGroups.length === 1 ||
        (active.metrics?.evaluated ?? 0) > 0) && (
        <div className="rounded-lg bg-canvas-soft p-3">
          {state.strategyGroups.length === 1 && (
            <>
              <strong>{active.label}</strong>
              <p className="mt-1 text-xs leading-normal text-ink-muted">
                {active.rationale}
              </p>
            </>
          )}
          {active.metrics && active.metrics.evaluated > 0 && (
            <small className="block text-xs text-ink-muted">
              {active.metrics.compliant} of {active.metrics.evaluated} contrast
              checks pass.
            </small>
          )}
        </div>
      )}
      <div className="flex flex-col gap-3">
        {active.proposals.map((item) => (
          <ProposalCard item={item} key={item.id} />
        ))}
        {active.outcomes.map((outcome) => (
          <ProposalOutcomeRow outcome={outcome} key={outcome.id} />
        ))}
      </div>
    </section>
  );
}
