import { Minus, Plus } from "lucide-react";
import { Button } from "../../components/Button";

interface PropertyStepperProps {
  label: string;
  value: number;
  unit?: string;
  min: number;
  max: number;
  step: number;
  overrideLabel?: string;
  onChange: (value: number) => void;
}

export function PropertyStepper({
  label,
  value,
  unit = "px",
  min,
  max,
  step,
  overrideLabel,
  onChange,
}: PropertyStepperProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-hairline bg-canvas-soft p-3">
      <div>
        <span className="block text-xs font-semibold tracking-[.04em] text-ink-muted uppercase">
          {label}
        </span>
        <strong className="mt-0.5 block text-sm tabular-nums">
          {value} {unit}
        </strong>
        {overrideLabel && (
          <small className="mt-1 block text-xs text-primary">
            {overrideLabel}
          </small>
        )}
      </div>
      <div className="flex gap-1.5">
        <Button
          aria-label={`Decrease ${label.toLowerCase()}`}
          disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - step))}
        >
          <Minus size={15} />
        </Button>
        <Button
          aria-label={`Increase ${label.toLowerCase()}`}
          disabled={value >= max}
          onClick={() => onChange(Math.min(max, value + step))}
        >
          <Plus size={15} />
        </Button>
      </div>
    </div>
  );
}
