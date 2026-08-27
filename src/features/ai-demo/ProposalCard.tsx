import { Check, Eye, EyeOff, X } from "lucide-react";
import { Button } from "../../components/Button";
import { useEditor } from "../../state/StateContext";
import type { PendingProposal } from "../../state/types";
import { meetsContrast } from "./contrast";

const contrastFormat = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const HEX_COLOR = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

function PropertyValuePreview({ values }: { values: Record<string, unknown> }) {
  const entries = Object.entries(values);
  if (!entries.length) {
    return <code>{"{}"}</code>;
  }
  return (
    <code>
      {"{\n"}
      {entries.map(([key, val], idx) => {
        const isColor = typeof val === "string" && HEX_COLOR.test(val);
        const comma = idx < entries.length - 1 ? "," : "";
        return (
          <div key={key}>
            {'  "'}
            {key}
            {'": '}
            {isColor ? (
              <span className="inline-flex items-center gap-1">
                <span
                  className="inline-block size-2.5 rounded-sm border border-black/15"
                  style={{ backgroundColor: val }}
                  aria-hidden="true"
                />
                "{val}"{comma}
              </span>
            ) : typeof val === "string" ? (
              `"${val}"${comma}`
            ) : (
              `${String(val)}${comma}`
            )}
          </div>
        );
      })}
      {"}"}
    </code>
  );
}

export function ProposalCard({ item }: { item: PendingProposal }) {
  const { state, actions } = useEditor();
  const isPreviewing = state.previewProposalId === item.id;
  const accept = () => {
    const outcome = actions.dispatch(item.command, {
      selectedIds: item.command.targetIds,
      requestedScope: item.command.viewportScope,
    });
    if (outcome.ok)
      actions.settleAcceptedProposal(
        item.id,
        outcome.state.version,
        item.command.targetIds,
      );
    else
      actions.updateProposal(item.id, {
        status: "invalid",
        error: outcome.error.detail,
      });
  };
  const preview = () => {
    if (isPreviewing) {
      // Stopping preview: restore the viewport we switched away from (if any)
      actions.stopPreviewProposal(item.id, item.command.viewportScope);
    } else {
      // Starting preview: switch viewport if proposal targets a specific one
      actions.startPreviewProposal(item.id, item.command.viewportScope);
    }
  };

  return (
    <article className="rounded-xl border border-border-default bg-raised p-3 shadow-soft">
      <div className="flex items-start justify-between gap-2">
        <div>
          <strong>
            {state.template.elements[item.command.targetIds[0]]?.label}
          </strong>
          <small className="mt-1 block text-[11px] text-ink-muted capitalize">
            {item.command.viewportScope === "all"
              ? "All views"
              : `${item.command.viewportScope} only`}
          </small>
        </div>
        <span
          className={`rounded-full px-2 py-1 text-[10px] font-bold tracking-[.04em] uppercase ${item.status === "accepted" ? "bg-selection text-success" : item.status === "rejected" || item.status === "invalid" ? "bg-danger-surface text-danger" : "bg-canvas-soft text-pending"}`}
          role="status"
          aria-live="polite"
        >
          {item.status}
        </span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="min-w-0 rounded-lg bg-canvas-soft p-2">
          <span className="mb-1 block text-[10px] font-bold tracking-[.05em] text-ink-muted uppercase">
            Before
          </span>
          <div className="overflow-auto font-mono text-[10px] leading-relaxed text-secondary">
            <PropertyValuePreview values={item.before} />
          </div>
        </div>
        <div className="min-w-0 rounded-lg bg-selection p-2">
          <span className="mb-1 block text-[10px] font-bold tracking-[.05em] text-primary uppercase">
            After
          </span>
          <div className="overflow-auto font-mono text-[10px] leading-relaxed text-secondary">
            <PropertyValuePreview values={item.after} />
          </div>
        </div>
      </div>
      {item.metrics && (
        <p
          className={`mt-2 rounded-md border p-2 text-[11px] leading-normal tabular-nums ${!meetsContrast(item.metrics.contrastAfter, item.metrics.requiredContrast) ? "border-warning-border bg-warning-surface text-pending" : "border-border-default bg-canvas-soft text-ink-muted"}`}
          role="status"
        >
          Contrast {contrastFormat.format(item.metrics.contrastBefore)}:1 →{" "}
          {contrastFormat.format(item.metrics.contrastAfter)}:1 · requires{" "}
          {contrastFormat.format(item.metrics.requiredContrast)}:1
          {!meetsContrast(
            item.metrics.contrastAfter,
            item.metrics.requiredContrast,
          ) && " ⚠ Below WCAG threshold"}
        </p>
      )}
      {item.error && (
        <p
          className="mt-2 rounded-lg border border-danger-border bg-danger-surface p-2.5 text-xs text-danger"
          role="alert"
        >
          {item.error}
        </p>
      )}
      {item.status === "pending" && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button aria-pressed={isPreviewing} onClick={preview}>
            {isPreviewing ? (
              <EyeOff size={14} aria-hidden="true" />
            ) : (
              <Eye size={14} aria-hidden="true" />
            )}
            {isPreviewing ? "Stop Preview" : "Preview on Canvas"}
          </Button>
          <Button onClick={accept}>
            <Check size={14} aria-hidden="true" />
            Accept Change
          </Button>
          <Button
            onClick={() =>
              actions.updateProposal(item.id, { status: "rejected" })
            }
          >
            <X size={14} aria-hidden="true" />
            Reject
          </Button>
        </div>
      )}
    </article>
  );
}
