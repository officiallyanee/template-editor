export type ElementId = string;
export type Viewport = "desktop" | "tablet" | "mobile";
export type ViewportScope = "all" | Viewport;
export type ElementType = "container" | "heading" | "paragraph" | "button";
export type EditSource = "canvas" | "code" | "ai" | "restore" | "initial";

export interface ElementProperties {
  text?: string;
  color?: string;
  backgroundColor?: string;
  fontSize?: number;
  fontWeight?: number;
  align?: "left" | "center" | "right";
  width?: number;
  height?: number;
  padding?: number;
  gap?: number;
  direction?: "row" | "column";
  alignSelf?: "auto" | "start" | "center" | "end" | "stretch";
  borderRadius?: number;
}

export type ElementLayerSnapshot =
  | { kind: "properties"; values: ElementProperties }
  | { kind: "structure"; order: number };

export type RevisionIntent =
  | { kind: "manual" }
  | { kind: "ai-strategy"; strategyId: string }
  | { kind: "restore"; restoredFromRevisionId: string }
  | { kind: "global-restore"; restoredFromCheckpointId: string };

export interface RevisionEntry {
  schemaVersion: 1;
  revisionId: string;
  commandId: string;
  elementId: ElementId;
  committedAt: number;
  source: EditSource;
  viewportScope: ViewportScope;
  beforeLayer: ElementLayerSnapshot;
  afterLayer: ElementLayerSnapshot;
  templateVersion: number;
  intent: RevisionIntent;
}

export interface TemplateElement {
  id: ElementId;
  type: ElementType;
  label: string;
  parentId: ElementId | null;
  order: number;
  base: ElementProperties;
  overrides: Partial<Record<Viewport, Partial<ElementProperties>>>;
  history: RevisionEntry[];
}

export interface TemplateState {
  templateId: string;
  version: number;
  elements: Record<ElementId, TemplateElement>;
  rootId: ElementId;
}

export type PropertyPatch =
  | { op: "set"; values: Partial<ElementProperties> }
  | { op: "replace-layer"; values: ElementProperties }
  | { op: "reorder"; order: number };

export interface EditCommand {
  commandId: string;
  source: EditSource;
  targetIds: ElementId[];
  viewportScope: ViewportScope;
  baseRevision: number;
  changes: Record<ElementId, PropertyPatch>;
  meta?: {
    instruction?: string;
    strategyId?: string;
    restoredFromRevisionId?: string;
    restoredFromCheckpointId?: string;
  };
}

export interface AtomicRestoreTransaction {
  transactionId: string;
  baseRevision: number;
  restoredFromCheckpointId: string;
  commands: EditCommand[];
}

export type PipelineErrorCode =
  | "INVALID_SHAPE"
  | "STALE_REVISION"
  | "UNKNOWN_TARGET"
  | "OUT_OF_SCOPE"
  | "INVALID_FIELD";
export interface PipelineError {
  code: PipelineErrorCode;
  detail: string;
}
export type PipelineResult =
  { ok: true; state: TemplateState } | { ok: false; error: PipelineError };

export interface ScopeContext {
  selectedIds?: ElementId[];
  requestedScope?: ViewportScope;
}

export interface PendingProposal {
  id: string;
  selectionSnapshot: ElementId[];
  command: EditCommand;
  before: ProposalValueSnapshot;
  after: ProposalValueSnapshot;
  status: "pending" | "accepted" | "rejected" | "invalid";
  error?: string;
  metrics?: {
    contrastBefore: number;
    contrastAfter: number;
    requiredContrast: number;
  };
}

export type ProposalValueSnapshot = Partial<ElementProperties> & {
  order?: number;
};

export interface ProposalOutcome {
  id: string;
  targetId: ElementId;
  status: "no-op" | "unsupported" | "invalid";
  detail: string;
}

export interface StrategyGroup {
  strategyId: string;
  label: string;
  rationale: string;
  metrics?: { evaluated: number; compliant: number };
  proposals: PendingProposal[];
  outcomes: ProposalOutcome[];
}
