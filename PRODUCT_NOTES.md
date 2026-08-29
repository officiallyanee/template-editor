# Product Notes

## User, job, and safe outcome

The primary user is a non-technical small-business owner adapting an existing website. Their job is to change content and presentation, compare ideas, and keep desktop, tablet, and mobile layouts safe without needing to understand the editor's code.

A safe completed edit changes only the intended elements and viewport scope, is visible before an AI proposal is accepted, passes the same validation regardless of editing surface, persists after refresh, and can be recovered without rolling back unrelated work.

## Product definitions

- **Element.** One editable part of the page, such as a heading, paragraph, button, or container. Each element has a stable ID, type, parent, sibling order, shared properties, optional viewport overrides, and its own history. Selection and recovery use the ID, never visible text or DOM position.
- **Group selection.** Several independently selected elements. Shift, Control, or Command click adds or removes stable IDs; the latest selected item is active. AI proposals use the whole group, while the current Edit, Code, and History panels operate on the active element only.
- **Committed step.** One validated command that actually changes the canonical template. It records its source, targets, scope, starting revision, and typed changes. A successful step advances the template version once and appends history to each changed target. Preview, rejection, invalid input, and no-op actions do not commit.
- **Viewport scope.** The screen sizes that receive an edit: All Views, Desktop, Tablet, or Mobile. All Views changes shared values. A single viewport changes only its override and automatically switches the preview to that viewport while editing.
- **Editable property boundary.** The controlled fields each element type may change. Text elements allow content, typography, color, alignment, and parent-relative position; buttons add dimensions, background, and corner radius; containers allow background, dimensions, spacing, direction, and parent-relative position. Unknown fields, arbitrary CSS, and identity changes are rejected.
- **Proposal.** A suggested AI-demo change that has not modified the template. Its before and after values, strategy, target, and scope remain reviewable until the user previews, accepts, or rejects it.

## Shared editing and responsive state

The canvas, form controls, JSON editor, accepted AI proposals, and restore actions all update one typed, JSON-serializable template state. React renders the preview from that state; the DOM is not a second source of truth. Every mutation passes through the same command validation and commit pipeline.

The Edit panel sends commands for the active element. The Code panel validates the active element's full JSON shape, compares it with the currently resolved values, and sends only changed fields. Invalid JSON or values show an error without replacing the last valid state.

Responsive values use a simple resolution rule: start with the shared base layer, then apply the active viewport's sparse override. A shared edit flows to every viewport that has no override for that field. A Desktop, Tablet, or Mobile edit changes only that layer. History stores exact layers rather than flattened resolved values, so restoring an absent override correctly restores inheritance.

Current manual controls cover content, colors, typography, supported dimensions and spacing, Flexbox direction and self-alignment, and single-element sibling reorder. Text currently commits on each input event. There is no free-form x/y positioning, drag resize, create, delete, reparent, arbitrary CSS, or manual bulk-property editor.

## Deterministic AI, review, and recovery

The AI demo is predictable by design. It uses the instruction, selected IDs and types, current values, requested viewport scope, and template revision; it makes no model or template-data network call. Supported paths include content rewrite, prominence and color strategies, resizing, compact spacing, mobile stacking, parent-relative alignment, reorder, and multi-element proposals.

Every generated proposal is runtime-validated. Its targets must be a subset of the selection, its scope must equal the requested scope, its fields must be allowed for the target type, and its base revision must still be current. Unknown targets, ambiguous or unsupported prompts, invalid fields or values, source-color mismatches, wrong scopes, and stale revisions fail without changing template state. Generated color strategies must meet the implemented contrast threshold; an exact user-selected color may instead show a contrast warning.

Each returned element has an independent outcome. Preview is a render-only overlay and creates no persistence, version, or history. Accept validates again and commits only that element's proposal. Reject changes no template value. Accepting one proposal can invalidate another proposal for the same element because the latter was built against an older version; unrelated element proposals remain independently reviewable.

Element history is append-only and viewport-scoped. Each entry stores the exact layer before and after a committed manual edit, AI acceptance, reorder, or restore. Restoring a prior element revision changes only that element and layer and creates a new history entry. If the selected state already matches, the editor says there is nothing to restore and does not create a version.

## Chosen additional capability: global history

Per-element history is safe for fixing one item, but it is slow when an owner is comparing complete design ideas that changed several elements. Global history was chosen so the owner can save coherent page states, preview those ideas one by one, and completely restore a preferred idea without manually reversing every edit.

The page autosaves locally after committed changes for refresh recovery, but autosave is not a visible global version. **Save Version** groups commits since the previous save and stores a full snapshot of every element's shared values, viewport overrides, and sibling order. A best-effort `pagehide` fallback creates a session-end save when committed work is still unsaved.

Global restore is previewable and all-or-nothing. It validates every affected element and layer before committing, appends linked revisions to changed elements, and records the result as a new global checkpoint rather than rewriting history. A no-op restore records nothing. Restore currently requires the same template, root, element IDs, types, labels, and parent relationships.

The capability should be validated with a task-based usability study. Give owners multiple saved ideas and ask them to compare, choose, and restore one while explaining what will change. Measure successful restores without unrelated changes, time to find the preferred idea, accidental recovery attempts, manual reversals, and confidence in the result. Improvement means more correct restores with fewer manual reversals than element history alone.

A future extension would allow selected-element restore from a global save. The owner could choose only the parts they liked, preview every affected layer, and confirm one atomic transaction. Each chosen element would receive a linked append-only revision, unrelated elements would remain unchanged, and the resulting page would receive a new global checkpoint. This selective restore is not implemented.

## Assumptions and cuts

These boundaries combine the main assumptions and deliberate cuts so they are not mistaken for supported behavior.

- **Pages fit a restricted box tree.** The prototype models one parent per element plus a small Flexbox-like property set. This supports the supplied pages, but it does not mean every real component should be a `div`. Forms, images, media, navigation, tables, reusable components, CSS Grid, wrapping, absolute positioning, transforms, and arbitrary interaction states need additional typed models.
- **The templates have a known shallow structure.** The current renderer recognizes the root page and a special `services` group rather than recursively rendering any possible imported tree. It supports four model types: container, heading, paragraph, and button. The current button preview is styled as a button but rendered as a `div`, so native button or link semantics remain a known gap.
- **Three explicit viewport states are enough for the exercise.** Desktop, Tablet, and Mobile use fixed logical preview dimensions and one shared order. They demonstrate scoped overrides but are not device emulators and do not guarantee every intermediate width, zoom level, orientation, or pixel density.
- **Simple values express the supported design.** Spacing and dimensions are numeric pixels, colors are opaque hex values, and responsive resolution is a shallow base-plus-override merge. The model does not reproduce the full CSS cascade, relative units, gradients, images, pseudo-classes, or viewport-specific structure.
- **Stable identity and independent targets are sufficient.** IDs, types, and parent relationships do not change. Multi-element AI actions work as independent per-element proposals; operations requiring group invariants or subtree changes need a separate atomic design.
- **History remains moderate and structurally compatible.** Element history is append-only and global saves contain full snapshots. There is no pruning, compression, quota recovery, or restoration across create, delete, or reparent changes.
- **One person uses one modern browser profile.** Local storage is the only durable store. There is no account, cloud sync, collaboration, permission model, or guaranteed session-end write. Clearing site data, storage denial, quota exhaustion, or abrupt termination can lose local work.
- **The deterministic paths are representative, not general AI.** Predefined prompts demonstrate scope and approval safety. The friendly content rewrite uses fixed role-based examples rather than generating new language. Contrast checks cover opaque foregrounds against the nearest known solid background, not full WCAG evaluation or all visual backgrounds.
- **Interaction complexity is deliberately bounded.** Additive keyboard selection replaces drag marquee; form and code edits target the active element; and unrestricted flex controls, visual drag and resize, structural editing, and multi-element reorder are cut from the current scope.

## Next three improvements

1. **Project import and export.** Make work portable and recoverable outside one browser. A versioned file should include the template, responsive layers, element history, and global checkpoints. Import must validate and preview the complete payload before replacing local state, while invalid files leave current work untouched.
2. **Selective restore from global history.** Let owners combine preferred elements from an earlier saved idea with the current page while preserving atomic validation and linked element and global history.
3. **Draft text with Apply and Cancel.** Group a typing session into one previewable, recoverable revision instead of committing every input event.
