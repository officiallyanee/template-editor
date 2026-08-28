import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  loadGlobalCheckpoints,
  loadActiveTemplateId,
  loadTemplate,
  resetTemplate,
  saveGlobalCheckpoints,
  saveTemplate,
} from "../persistence/localStorage";
import {
  createGlobalCheckpoint,
  hasUnsavedVersion,
  type GlobalCheckpoint,
} from "./globalHistory";
import { planGlobalRestore, restoreGlobalCheckpoint } from "./globalRestore";
import { dispatchCommand } from "./pipeline";
import { settleAcceptedGroups } from "./proposalStore";
import { freshTemplate } from "../templates/templateCatalog";
import type {
  EditCommand,
  ElementId,
  PendingProposal,
  PipelineResult,
  ScopeContext,
  StrategyGroup,
  TemplateState,
  Viewport,
  ViewportScope,
} from "./types";

interface EditorState {
  template: TemplateState;
  checkpoints: GlobalCheckpoint[];
  hasUnsavedVersion: boolean;
  viewport: Viewport;
  editScope: ViewportScope;
  selectedIds: ElementId[];
  activeId: ElementId | null;
  strategyGroups: StrategyGroup[];
  activeStrategyId: string | null;
  previewProposalId: string | null;
  /** Viewport to restore when a viewport-scoped proposal preview is stopped. */
  previewReturnViewport: Viewport | null;
  restorePreviewCheckpointId: string | null;
  lastError: string | null;
}
interface EditorActions {
  dispatch: (command: EditCommand, context?: ScopeContext) => PipelineResult;
  setViewport: (viewport: Viewport) => void;
  setEditScope: (scope: ViewportScope) => void;
  select: (id: ElementId, additive?: boolean) => void;
  setStrategyGroups: (items: StrategyGroup[]) => void;
  setActiveStrategy: (id: string) => void;
  setPreviewProposal: (id: string | null) => void;
  /** Atomically start a proposal preview, switching viewport if scope requires it. */
  startPreviewProposal: (id: string, scope: ViewportScope) => void;
  /** Atomically stop a proposal preview, restoring the prior viewport if it was switched. */
  stopPreviewProposal: (id: string, scope: ViewportScope) => void;
  updateProposal: (id: string, patch: Partial<PendingProposal>) => void;
  settleAcceptedProposal: (
    id: string,
    templateVersion: number,
    targetIds: ElementId[],
  ) => void;
  saveVersion: () => void;
  previewCheckpoint: (checkpointId: string | null) => void;
  restoreCheckpoint: (checkpointId: string) => void;
  switchTemplate: (templateId: string) => void;
  reset: () => void;
}
interface EditorContextValue {
  state: EditorState;
  actions: EditorActions;
}
const EditorContext = createContext<EditorContextValue | null>(null);

export function EditorProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<EditorState>(() => {
    const activeTemplateId = loadActiveTemplateId();
    const template = loadTemplate(freshTemplate(activeTemplateId));
    const checkpoints = loadGlobalCheckpoints(template.templateId);
    return {
      template,
      checkpoints,
      hasUnsavedVersion: hasUnsavedVersion(template.version, checkpoints),
      viewport: "desktop",
      editScope: "all",
      selectedIds: ["headline"],
      activeId: "headline",
      strategyGroups: [],
      activeStrategyId: null,
      previewProposalId: null,
      previewReturnViewport: null,
      restorePreviewCheckpointId: null,
      lastError: null,
    };
  });
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  useEffect(() => {
    saveTemplate(state.template);
  }, [state.template]);
  const checkpointPendingVersion = useCallback(
    (reason: GlobalCheckpoint["reason"], publish: boolean) => {
      const current = stateRef.current;
      const checkpoint = createGlobalCheckpoint(
        current.template,
        current.checkpoints,
        reason,
      );
      if (!checkpoint) return;
      const checkpoints = [...current.checkpoints, checkpoint];
      saveTemplate(current.template);
      saveGlobalCheckpoints(current.template.templateId, checkpoints);
      const next = {
        ...current,
        checkpoints,
        hasUnsavedVersion: false,
      };
      stateRef.current = next;
      if (publish) setState(next);
    },
    [],
  );
  useEffect(() => {
    const saveOnPageHide = () => checkpointPendingVersion("session-end", false);
    window.addEventListener("pagehide", saveOnPageHide);
    return () => window.removeEventListener("pagehide", saveOnPageHide);
  }, [checkpointPendingVersion]);
  const dispatch = useCallback(
    (command: EditCommand, context: ScopeContext = {}) => {
      const outcome = dispatchCommand(
        stateRef.current.template,
        command,
        context,
      );
      setState((current) =>
        outcome.ok
          ? {
              ...current,
              template: outcome.state,
              hasUnsavedVersion: true,
              restorePreviewCheckpointId: null,
              lastError: null,
            }
          : { ...current, lastError: outcome.error.detail },
      );
      return outcome;
    },
    [],
  );
  const actions = useMemo<EditorActions>(
    () => ({
      dispatch,
      setViewport: (viewport) => setState((s) => ({ ...s, viewport })),
      setEditScope: (editScope) => setState((s) => ({ ...s, editScope })),
      select: (id, additive = false) =>
        setState((s) => {
          if (!additive) return { ...s, selectedIds: [id], activeId: id };
          if (!s.selectedIds.includes(id))
            return {
              ...s,
              selectedIds: [...s.selectedIds, id],
              activeId: id,
            };
          const selectedIds = s.selectedIds.filter((item) => item !== id);
          return {
            ...s,
            selectedIds,
            activeId:
              s.activeId === id ? (selectedIds.at(-1) ?? null) : s.activeId,
          };
        }),
      setStrategyGroups: (strategyGroups) =>
        setState((s) => ({
          ...s,
          strategyGroups,
          activeStrategyId: strategyGroups[0]?.strategyId ?? null,
          previewProposalId: null,
          restorePreviewCheckpointId: null,
        })),
      setActiveStrategy: (activeStrategyId) =>
        setState((s) => ({
          ...s,
          activeStrategyId,
          previewProposalId: null,
          previewReturnViewport: null,
        })),
      setPreviewProposal: (previewProposalId) =>
        setState((s) => ({ ...s, previewProposalId })),
      startPreviewProposal: (id, scope) =>
        setState((s) => ({
          ...s,
          previewProposalId: id,
          // If proposal targets a specific viewport, switch to it and remember where to return
          viewport: scope !== "all" ? (scope as Viewport) : s.viewport,
          previewReturnViewport: scope !== "all" ? s.viewport : null,
        })),
      stopPreviewProposal: (_id, scope) =>
        setState((s) => ({
          ...s,
          previewProposalId: null,
          // Restore the viewport we switched away from (if any)
          viewport:
            scope !== "all" && s.previewReturnViewport != null
              ? s.previewReturnViewport
              : s.viewport,
          previewReturnViewport: null,
        })),
      updateProposal: (id, patch) =>
        setState((s) => ({
          ...s,
          strategyGroups: s.strategyGroups.map((group) => ({
            ...group,
            proposals: group.proposals.map((item) =>
              item.id === id ? { ...item, ...patch } : item,
            ),
          })),
          previewProposalId:
            s.previewProposalId === id && patch.status !== "pending"
              ? null
              : s.previewProposalId,
        })),
      settleAcceptedProposal: (id, templateVersion, targetIds) =>
        setState((s) => ({
          ...s,
          strategyGroups: settleAcceptedGroups(
            s.strategyGroups,
            id,
            templateVersion,
            targetIds,
          ),
          previewProposalId: null,
          previewReturnViewport: null,
        })),
      saveVersion: () => checkpointPendingVersion("manual", true),
      previewCheckpoint: (checkpointId) =>
        setState((s) => {
          if (checkpointId == null)
            return { ...s, restorePreviewCheckpointId: null, lastError: null };
          const checkpoint = s.checkpoints.find(
            (item) => item.checkpointId === checkpointId,
          );
          if (!checkpoint)
            return { ...s, lastError: "That saved version no longer exists." };
          const plan = planGlobalRestore(s.template, checkpoint);
          return plan.ok
            ? {
                ...s,
                restorePreviewCheckpointId: checkpointId,
                previewProposalId: null,
                lastError: null,
              }
            : { ...s, lastError: plan.detail };
        }),
      restoreCheckpoint: (checkpointId) => {
        const current = stateRef.current;
        const result = restoreGlobalCheckpoint(
          current.template,
          current.checkpoints,
          checkpointId,
        );
        if (!result.ok) {
          setState((s) => ({ ...s, lastError: result.detail }));
          return;
        }
        if (!result.changed) {
          setState((s) => ({
            ...s,
            restorePreviewCheckpointId: null,
            lastError: null,
          }));
          return;
        }
        saveTemplate(result.template);
        saveGlobalCheckpoints(result.template.templateId, result.checkpoints);
        const next: EditorState = {
          ...current,
          template: result.template,
          checkpoints: result.checkpoints,
          hasUnsavedVersion: false,
          restorePreviewCheckpointId: null,
          lastError: null,
        };
        stateRef.current = next;
        setState(next);
      },
      switchTemplate: (templateId) => {
        const current = stateRef.current;
        const template = loadTemplate(freshTemplate(templateId));
        const checkpoints = loadGlobalCheckpoints(templateId);
        saveTemplate(template);
        const next: EditorState = {
          ...current,
          template,
          checkpoints,
          hasUnsavedVersion: hasUnsavedVersion(template.version, checkpoints),
          viewport: "desktop",
          editScope: "all",
          selectedIds: ["headline"],
          activeId: "headline",
          strategyGroups: [],
          activeStrategyId: null,
          previewProposalId: null,
          previewReturnViewport: null,
          restorePreviewCheckpointId: null,
          lastError: null,
        };
        stateRef.current = next;
        setState(next);
      },
      reset: () => {
        const current = stateRef.current;
        const next = {
          ...current,
          template: resetTemplate(freshTemplate(current.template.templateId)),
          checkpoints: [],
          hasUnsavedVersion: false,
          selectedIds: ["headline"],
          activeId: "headline",
          strategyGroups: [],
          activeStrategyId: null,
          previewProposalId: null,
          previewReturnViewport: null,
          restorePreviewCheckpointId: null,
          lastError: null,
        };
        stateRef.current = next;
        setState(next);
      },
    }),
    [checkpointPendingVersion, dispatch],
  );
  return <EditorContext value={{ state, actions }}>{children}</EditorContext>;
}
export function useEditor(): EditorContextValue {
  const value = use(EditorContext);
  if (!value) throw new Error("useEditor must be used inside EditorProvider");
  return value;
}
