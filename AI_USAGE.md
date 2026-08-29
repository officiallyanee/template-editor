# AI Usage

## Tools and third-party skills used

- **Claude Sonnet 5:** used for interpretating the assignment, planning the product & review the assignment.
- **OpenAI Codex (GPT-5 family):** write code, debug problems, create tests, improve documentation, and check responsive behavior.
- **Vercel Labs `web-design-guidelines` skill:** installed from the third-party `vercel-labs/agent-skills` package and used to review accessibility,keyboard use, focus, forms, motion, visual hierarchy, and responsive layouts.
- **Vercel Labs `vercel-composition-patterns` skill:** installed from the same third-party package and used to keep shared React components understandable as the preview gained more modes.


## Redacted examples

### Planning and product framing

> Global history should represent ideas the owner deliberately saves, not every small element change. Each save should contain the state of every element so an earlier idea can be previewed and restored completely. A restore must add new records instead of rewriting either global or element history.

This corrected an earlier direction that treated the global view too much like a second automatic edit log. The result is a clear separation: element history records individual changes, local autosave protects refresh recovery, and Save Version records a complete page idea. Global restore is previewable, all-or-nothing, and adds linked element and global history entries.

### Implementation and debugging

> A device frame should keep a fixed height. If a font or spacing change makes the page taller, the page should scroll inside the frame instead of making the frame grow. Apply the same rule to Desktop, Tablet, and Mobile previews.

This corrected responsive behavior that allowed edited content to affect the simulated device boundary. The result is one shared sizing rule for live, proposed, saved, and full-screen previews, with fixed frame dimensions and document scrolling inside them. Tests now protect the frame size and internal scrolling behavior.

## Suggestion I corrected

An early AI-assisted history implementation stored the value visible on Mobile after shared and Mobile values were combined. It then restored the state from before an edit, which behaved like undoing one change rather than restoring a chosen version.

I rejected that approach because it could create a hidden Mobile value where none existed before. The page would appear correct immediately after restore, but later shared edits would stop reaching Mobile. I changed history to store the exact shared or viewport-specific layer, including the absence of an override, and made version restore use the state saved by the chosen revision.

## How I checked AI-assisted work

- **Requirements and regressions:** Made a checklist before starting work and checked it after each major change. Added in milestones and dependency order to make stay in track.
- **Automated tests:** Every reproducible bug received a test that failed before the fix and passed afterward, including checks that previews do not change saved state, versions, or history. Added in coverage to ensure replicable behaviour for majority of code.
- **Code quality:** Added ways for quality checking through lint tests, type checking and build tests.
- **Manual review:** Exercised both templates, themes, edit scopes, proposals, saved and full-screen previews, device frames, history, color controls, stretch, and responsive layouts. Visual regressions were compared with previously accepted screenshots and commits.
- **Dependencies:** Reviewed compatibility for dependencies and rejected a device-frame package limited to React 18.

## Limitation and what I would change

The final visual checks used a Chromium-based browser.

Next time, I would add a small visual test set earlier and run it in Chromium, Firefox, and WebKit whenever code is submitted. That would catch browser-specific differences in fonts, color inputs, dialogs, and layout before the final review.
