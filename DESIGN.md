# DESIGN.md — Scope AI Template Editor

Scope is the product name. Editorial is its single interface design system. Light and dark are appearances of that system, not separate styles, and neither appearance changes template state or history.

## Direction

The editor is a precise editorial workbench: strong typographic hierarchy, restrained monochrome chrome, and thin structural rules. The template remains the visual subject. Editor controls are easy to distinguish without competing with the document.

There is no interface-style selector, registry, `data-style` attribute, or style persistence key. A future redesign replaces the semantic token values rather than adding a second runtime visual axis.

## Semantic theme contract

[`src/design/tokens.css`](src/design/tokens.css) is the only source of theme values. Components consume semantic Tailwind utilities mapped by [`src/design/global.css`](src/design/global.css); components do not contain theme-specific editor hex values.

### Light appearance

| Role             | Value     | Use                                  |
| ---------------- | --------- | ------------------------------------ |
| `primary`        | `#000000` | Primary actions, focus, active state |
| `on-primary`     | `#ffffff` | Foreground on primary                |
| `canvas`         | `#ffffff` | Panels                               |
| `canvas-soft`    | `#f5f5f5` | Property groups and quiet surfaces   |
| `surface-raised` | `#ffffff` | Fields and buttons                   |
| `workspace`      | `#f5f5f5` | Editor surround                      |
| `hairline`       | `#e0e0e0` | Structural division                  |
| `border-default` | `#e0e0e0` | Interactive boundaries               |
| `ink`            | `#000000` | Primary text                         |
| `ink-muted`      | `#757575` | Supporting text                      |

### Dark appearance

Dark appearance uses layered charcoal rather than pure black. Structural rules stay quieter than interactive boundaries; active and focus states may be brighter.

| Role             | Value     | Use                       |
| ---------------- | --------- | ------------------------- |
| `primary`        | `#ffffff` | Primary actions and focus |
| `on-primary`     | `#0d0d0d` | Foreground on primary     |
| `canvas`         | `#191919` | Panels                    |
| `canvas-soft`    | `#111111` | Property groups           |
| `surface-raised` | `#242424` | Fields and buttons        |
| `surface-hover`  | `#303030` | Hover feedback            |
| `workspace`      | `#0c0c0c` | Editor surround           |
| `hairline`       | `#303030` | Quiet structural division |
| `border-default` | `#444444` | Interactive boundaries    |
| `ink`            | `#ffffff` | Primary text              |
| `ink-muted`      | `#b8b8b8` | Supporting text           |

The Edit panel always expresses three depths:

1. Panel and section boundaries use `canvas` plus `hairline`.
2. Property groups use `canvas-soft` plus `hairline`.
3. Fields and buttons use `surface-raised` plus `border-default`.

An idle group must never compete with an interactive field or focus indicator.

## Typography

- Structural interface copy uses open-licensed Inter with system sans-serif fallbacks. This is the stable implementation used by the original Editorial design rather than an environment-dependent proprietary local font.
- UI text uses a 1 rem minimum: the root is 14 px on laptop/desktop and 12 px on phone layouts. Hierarchy comes from weight, color, tracking, and larger heading steps rather than sub-minimum captions.
- Editor and template display headings use Playfair Display at weight 400, with Georgia and Times fallbacks.
- Narrative paragraphs inside template previews use Lora with Georgia and Times fallbacks.
- Code, JSON, and revision identifiers use JetBrains Mono with system monospace fallbacks.

Editor headings such as Page Layers and Hero Copy use the display family at a restrained weight. Product chrome, metadata, controls, and the Scope wordmark use Inter so the serif remains a deliberate hierarchy signal.

## Geometry and elevation

Editor geometry is square. Buttons, fields, tabs, panels, list rows, and selection boundaries resolve to 0 px radii. Optional device frames are the one exception because their geometry represents hardware rather than editor chrome.

Spacing follows a 4 px base scale: `4, 8, 12, 16, 24, 28, 32`. Default elevation is a one-pixel semantic hairline; drop shadows do not manufacture hierarchy.

## Editor shell

The desktop shell has three regions: Page Layers, centered Canvas, and Editing Tools. At wide desktop sizes Page Layers clamps from 210-240 px and Editing Tools from 320-360 px, leaving the remaining width to the canvas. At the laptop breakpoint they use explicit 190/320 px rails; at smaller breakpoints Page Layers hides and the tools panel stacks below the canvas.

Page Layers owns its scrolling and retains a fixed summary footer. Its close button stays inside the panel; when closed, a 64 px rail preserves the same reopen control and spatial position.

The header contains product identity, preview viewport, edit scope, save state, appearance, and reset. Controls shrink or wrap before they clip. At mobile widths the canvas and tools become bounded vertical regions with independent scrolling and no page-level horizontal overflow.

## Viewport, scope, and preview

The preview contracts are fixed-height viewports: 920 x 650 for Desktop, 768 x 720 for Tablet, and 375 x 667 for Mobile. A narrow editor may shrink the rendered width, but content growth never changes the device boundary height. The template document owns vertical scrolling inside that boundary instead of being transform-scaled or clipped. Full-screen Desktop still caps at 920 px as requested.

Choosing a viewport-only Edit Scope switches to that viewport immediately and disables the other preview buttons. Choosing All Views unlocks all preview modes. This is editor authority feedback only; it does not create a template revision.

Editable, proposal, saved-version, and full-screen surfaces compose the same renderer and the same numeric sizing shell. Viewport changes therefore use one 200 ms max-width transition; reduced-motion preferences reduce it to effectively zero. Read-only Saves preview changes interactivity, not dimensions.

The optional device-frame toggle adds presentation-only hardware silhouettes: a laptop bezel and base for Desktop, a rounded tablet with camera, and a phone with speaker cutout and side controls. Hardware tokens switch between graphite and silver treatments to remain legible in light and dark editor appearances. Frames default off, persist only after an explicit choice, and never enter the template, proposal, or history model.

The template Page background comes from canonical state and is never recolored by the editor theme. Full-screen preview uses neutral `#fafafa` or softened charcoal `#282828`; a contrast helper chooses the clearer surround.

## Interaction and accessibility

- Every control has visible text or an accessible name.
- Native buttons, selects, textareas, and dialogs provide keyboard semantics.
- Focus uses a visible two-pixel outline with offset and is not clipped by scroll containers.
- Disabled state is conveyed by more than color.
- Interactive text meets the 1 rem minimum and color contrast is checked in both appearances.
- Motion is purposeful and respects reduced-motion preferences.
- Interactive targets are at least 24 px and preferably 44 px on touch layouts.
- `alignSelf: stretch` means fill the parent's cross-axis. Main-axis spacing remains the container's Item Gap; the editor never relabels stretch as `justify-content: space-between`.

## State boundary

Theme, device frame, and editor layout are local UI state. They cannot dispatch an edit command, increment the template version, append element history, or create a saved checkpoint. The light/dark preference uses `scope-ui-theme:v2`; the device frame uses `scope-device-frame:v2`. The versioned keys intentionally ignore the earlier auto-written defaults. With no new saved preference the editor starts in Light with device frames off; system appearance does not silently change those defaults.

Selection, proposal preview, saved preview, and full-screen mode stay outside the canonical template for the same reason: presentation state must never masquerade as authored document state.

## Verification matrix

UI changes are checked at minimum at 1440 x 900, 1280 x 800, 1024 x 768, 768 x 900, 390 x 844, 375 x 667, and 320 x 568. Verification covers zero document/body horizontal overflow, bounded panels, independent scrolling, centered preview geometry, visible focus/selection, readable dark hierarchy, full-screen sizing, saved-preview stability, color-input containment, and a clean browser console.
