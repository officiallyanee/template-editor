import type { ElementProperties } from "../../state/types";

type AlignSelf = NonNullable<ElementProperties["alignSelf"]>;

interface PositionControlProps {
  value: AlignSelf;
  onChange: (value: AlignSelf) => void;
}

const positions: Array<{ value: AlignSelf; label: string }> = [
  { value: "auto", label: "Auto" },
  { value: "start", label: "Start" },
  { value: "center", label: "Center" },
  { value: "end", label: "End" },
  { value: "stretch", label: "Stretch" },
];

export function PositionControl({ value, onChange }: PositionControlProps) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-lg border border-hairline bg-canvas-soft p-3">
      <span>
        <span className="block text-[11px] font-semibold tracking-[.04em] text-ink-muted uppercase">
          Position in Container
        </span>
        <small className="mt-1 block text-[10px] text-ink-muted">
          Safe cross-axis placement
        </small>
      </span>
      <select
        aria-label="Position in Container"
        name="align-self"
        className="rounded-lg border border-border-default bg-raised py-1.5 pr-7 pl-2 text-[13px] text-ink"
        value={value}
        onChange={(event) => onChange(event.target.value as AlignSelf)}
      >
        {positions.map((position) => (
          <option key={position.value} value={position.value}>
            {position.label}
          </option>
        ))}
      </select>
    </label>
  );
}
