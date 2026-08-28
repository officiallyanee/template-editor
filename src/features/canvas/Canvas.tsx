import { CanvasElement } from "./CanvasElement";
import { useEditor } from "../../state/StateContext";
import { resolvedWithProposal } from "../../state/resolver";
import { findProposal } from "../../state/proposalStore";
const widths = { desktop: 920, tablet: 680, mobile: 375 };
export function Canvas() {
  const { state, actions } = useEditor();
  const previewProposal = findProposal(
    state.strategyGroups,
    state.previewProposalId,
  );
  const page = state.template.elements[state.template.rootId];
  const pageProps = resolvedWithProposal(page, state.viewport, previewProposal);
  const top = Object.values(state.template.elements)
    .filter((item) => item.parentId === page.id)
    .sort((a, b) => a.order - b.order);
  const services = state.template.elements.services;
  const serviceItems = Object.values(state.template.elements)
    .filter((item) => item.parentId === "services")
    .sort((a, b) => a.order - b.order);
  const serviceProps = resolvedWithProposal(
    services,
    state.viewport,
    previewProposal,
  );
  return (
    <main
      id="main-content"
      className="min-w-0 overflow-auto bg-workspace p-5 max-sm:p-3"
    >
      <div className="mx-auto mb-2.5 flex max-w-[920px] justify-between text-[11px] font-semibold tracking-[.06em] text-ink-muted uppercase">
        <span>
          {previewProposal ? "Proposal Preview · Not Applied" : "Live Preview"}
        </span>
        <span>
          {widths[state.viewport]} px · {state.viewport}
        </span>
      </div>
      <div className="flex min-h-[calc(100%-28px)] items-start justify-center">
        <div
          className={`preview flex w-full flex-col items-center justify-center overflow-hidden rounded-xl shadow-flat transition-[max-width] duration-200 ${state.viewport === "mobile" ? "min-h-[690px]" : "min-h-[650px]"}`}
          style={{
            maxWidth: widths[state.viewport],
            backgroundColor: pageProps.backgroundColor,
            padding: pageProps.padding,
            gap: pageProps.gap,
            flexDirection: pageProps.direction,
          }}
          role="listbox"
          tabIndex={0}
          aria-label="Editable template canvas"
          aria-multiselectable="true"
          onClick={(event) => {
            if (event.target === event.currentTarget)
              actions.select(page.id, false);
          }}
          onKeyDown={(event) => {
            if (
              event.target === event.currentTarget &&
              (event.key === "Enter" || event.key === " ")
            ) {
              event.preventDefault();
              actions.select(page.id, false);
            }
          }}
        >
          {top.map((item) =>
            item.id === services.id ? (
              <section
                key={item.id}
                className={`services flex w-full max-w-[720px] cursor-pointer rounded-md ${state.selectedIds.includes(item.id) ? "is-selected" : ""} ${state.activeId === item.id ? "is-active" : ""} ${previewProposal?.command.targetIds.includes(item.id) ? "is-proposal-preview" : ""}`}
                data-active={state.activeId === item.id || undefined}
                style={{
                  backgroundColor: serviceProps.backgroundColor,
                  padding: serviceProps.padding,
                  gap: serviceProps.gap,
                  flexDirection: serviceProps.direction,
                  alignSelf: serviceProps.alignSelf,
                }}
                tabIndex={0}
                role="option"
                aria-selected={state.selectedIds.includes(item.id)}
                onClick={(event) => {
                  event.stopPropagation();
                  actions.select(
                    item.id,
                    event.shiftKey || event.metaKey || event.ctrlKey,
                  );
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    actions.select(item.id, event.shiftKey);
                  }
                }}
              >
                {serviceItems.map((child) => (
                  <CanvasElement key={child.id} element={child} />
                ))}
              </section>
            ) : (
              <CanvasElement key={item.id} element={item} />
            ),
          )}
        </div>
      </div>
    </main>
  );
}
