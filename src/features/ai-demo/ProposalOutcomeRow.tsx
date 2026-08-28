import { AlertCircle, MinusCircle } from "lucide-react";
import { useEditor } from "../../state/StateContext";
import type { ProposalOutcome } from "../../state/types";

export function ProposalOutcomeRow({ outcome }: { outcome: ProposalOutcome }) {
  const { state } = useEditor();
  const element = state.template.elements[outcome.targetId];
  const Icon = outcome.status === "invalid" ? AlertCircle : MinusCircle;
  return (
    <article
      className={`rounded-xl border p-3 ${outcome.status === "invalid" ? "border-danger-border bg-danger-surface" : "border-border-default bg-canvas-soft"}`}
      role="status"
    >
      <div className="flex items-start gap-2.5">
        <Icon
          size={16}
          className={outcome.status === "invalid" ? "text-danger" : "text-ink-muted"}
          aria-hidden="true"
        />
        <div className="min-w-0">
          <strong className="block truncate text-xs">{element?.label ?? outcome.targetId}</strong>
          <span className="mt-0.5 block text-[10px] font-bold tracking-[.04em] text-ink-muted uppercase">
            {outcome.status === "no-op" ? "No Change" : outcome.status}
          </span>
          <p className="mt-1 text-[11px] leading-normal text-ink-muted">{outcome.detail}</p>
        </div>
      </div>
    </article>
  );
}
