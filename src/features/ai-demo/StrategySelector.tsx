import { useEditor } from "../../state/StateContext";

export function StrategySelector() {
  const { state, actions } = useEditor();
  if (state.strategyGroups.length <= 1) return null;
  return (
    <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
      <legend className="mb-2 text-xs font-bold tracking-[.05em] text-secondary uppercase">
        Choose a Design Strategy
      </legend>
      {state.strategyGroups.map((group) => (
        <label
          key={group.strategyId}
          className={`flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 transition-colors duration-150 hover:bg-surface-hover ${state.activeStrategyId === group.strategyId ? "border-primary bg-selection" : "border-border-default bg-raised"}`}
        >
          <input
            type="radio"
            name="proposal-strategy"
            value={group.strategyId}
            checked={state.activeStrategyId === group.strategyId}
            onChange={() => actions.setActiveStrategy(group.strategyId)}
          />
          <span className="min-w-0">
            <strong className="block text-xs">{group.label}</strong>
            <small className="mt-1 block text-[11px] leading-normal text-ink-muted">
              {group.rationale}
            </small>
          </span>
        </label>
      ))}
    </fieldset>
  );
}
