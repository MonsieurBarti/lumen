---
name: lumen-guide
description: Generate multi-tab HTML document (shell + CSS + JS + per-tab fragments) for guides, architecture overviews, comparison matrices, recaps, roadmaps. Single-file or split-file mode. Invoke when user asks for guide, doc, architecture overview, multi-tab doc, comparison, or content with multiple sections that should be tabbed.
version: 0.1.4 # x-release-please-version
---

# lumen-guide

Multi-tab HTML guide. Two output modes: single-file (everything inlined) or split-file (shell + per-tab fragments + linked CSS/JS).

📄 Rendered example: [`docs/examples/guide.html`](../../docs/examples/guide.html)

## When to invoke

Triggers: `write a guide`, `create a guide`, `multi-tab doc`, `architecture doc`, `create a doc`, `make a recap`, `illustrate architecture`, `comparison matrix`, `roadmap`, `explain visually`, `document with forge`.

## Pipeline (Frame → Structure → Style → Deliver)

1. **Frame** — silently infer 3 signals from prompt: reader-action, takeaway, tone. See `references/frame-phase.md`. No questions; user can request "Frame Trace" if wrong.
2. **Structure** — pick tab set per content type:

| Content | Tabs |
|---|---|
| Architecture overview | Overview / Components / Flows / Decisions |
| Migration guide | Why / Before / After / Steps / Rollback |
| Comparison matrix | Summary / Criteria / Tradeoffs / Recommendation |
| Project recap | State / Recent / Next / Risks |
| API reference | Quick start / Endpoints / Auth / Errors / Examples |
| Roadmap | Now / Next / Later / Maybe |

3. **Style** — pick aesthetic from `skills/_shared/aesthetics/` (default `editorial.css` for guides). Apply component variants from `components/components.css`. Token system documented in `references/tokens.md`. Two-track aesthetic detection (branded `forge.yml` vs exploration) per `references/design-phase-two-track.md`.

4. **Deliver** — pick output mode:
   - **Single-file** (`shells/single.html`): all CSS/JS inlined in `<style>` and `<script>`. Best for share-by-attachment.
   - **Split-file** (`shells/split.html`): shell inlines `theme-toggle.js` + `tab-loader.js`, links a single `css/{SLUG}.css`, and lazy-fetches per-tab fragments from `tabs/{SLUG}/tab-{ID}.html`. Full file layout + placeholder substitution rules in `references/phase-3-generate.md` — read it before authoring split-file output.

## Component library (`components/components.css`)

| Component | Variants |
|---|---|
| `.hero` | `.hero.left-border`, `.hero.elevated`, `.hero.top-border` |
| `.section-label` | `.section-label.dot`, `.section-label.square`, `.section-label.triangle` |
| `.card` | `.card.accent`, `.card.info`, `.card.warning`, `.card.critical` |
| `.stat-grid` | N-column responsive grid of stat tiles |
| `.steps` | Numbered step list with connectors |
| `.phases` | Horizontal phase ribbon |
| `.kv-strip` | Inline key-value pairs |
| `.summary-card` | Glance-layer summary with stat-grid |
| `.finding` | `.finding--high`, `.finding--medium`, `.finding--low` (severity badge) |
| `.io-strip` | Input → Output flow strip |
| `details.disclosure` | Native disclosure for deep-layer content |
| `.has-tip` | Inline tooltip on hover |

Plus base sheets: `reset.css`, `typography.css`, `layout.css`. Tab nav driven by `tab-loader.js`. Light/dark via `theme-toggle.js`.

Full token surface in `references/tokens.md`. Brand-aware loading via `references/design-phase-two-track.md`.

## 3-layer information architecture

- **Glance ≤5s** — hero + stat-grid + section-label headers
- **Scan ≤30s** — sections + tables + cards + summary-card
- **Deep** — `details.disclosure` for full reference content

Tab structure mirrors layers: first tab is glance, middle tabs are scan, last tab(s) are deep reference. Spec in `references/output-ux.md`.

## CSS pattern library (`references/css-patterns.md`)

Lifted from visual-explainer. Covers:

- KPI card with hero number + trend indicator
- Mermaid zoom controls (`+`/`−`/`reset`/`expand` buttons + Ctrl/Cmd-scroll + click-pan + click-to-expand)
- Hero-image wrap with base64 data-URI
- Overflow protection (`min-width: 0` on grid/flex children, `overflow-wrap: break-word`)
- Responsive section navigation
- List rendering without `display: flex` on `<li>` (absolute-positioned markers instead)

Reach for these patterns when the guide needs them; do not re-invent.

## Anti-patterns to avoid

See `references/anti-patterns.md`. Highlights: never `display: flex` on `<li>`, never put marker characters inside flex children, never let grid children overflow.

## Quality checks

- Hero present on first tab
- Each tab fits "scan in 30s" rule on first paint
- `details.disclosure` used for any block >300 words
- `.finding` uses correct severity class (high/medium/low)
- Tab nav keyboard-accessible (Tab + Enter)
- Mobile: tabs collapse to accordion
- AAA contrast on all `var(--text)`
- Mermaid diagrams (if any) use the zoom-pan pattern from `css-patterns.md`

## Output

- Single-file mode: one `.html` written to `~/.agent/lumen/<slug>.html`. Open in browser.
- Split-file mode: directory `~/.agent/lumen/<slug>/` with `<slug>.html` (shell, JS inlined) + `css/<slug>.css` + `tabs/<slug>/tab-<id>.html` (one fragment per tab, lazy-fetched). See `references/phase-3-generate.md`.

## PI extension route (v0.1.x)

Not wired through `lumen-generate_visual` PI tool. Guides need multi-step authoring with conditional structure; LLM-authored CC path is the right fit. Deterministic guide renderer is not planned.

## Sources

- [`Roxabi/roxabi-forge/plugins/forge/skills/forge-guide`](https://github.com/Roxabi/roxabi-forge) (MIT) — split-file shell architecture, 3-layer information architecture, Frame → Structure → Style → Deliver methodology
- [`Roxabi/roxabi-forge/plugins/forge/references/base/`](https://github.com/Roxabi/roxabi-forge) (MIT) — `components.css` + `reset.css` + `typography.css` + `layout.css` + `tab-loader.js` + `theme-toggle.js`
- [`Roxabi/roxabi-forge/plugins/forge/references/`](https://github.com/Roxabi/roxabi-forge) (MIT) — `tokens.md`, `output-ux.md`, `frame-phase.md`, `design-phase-two-track.md`, `anti-patterns.md`
- [`Roxabi/roxabi-forge/plugins/forge/references/shells/`](https://github.com/Roxabi/roxabi-forge) (MIT) — `single.html` + `split.html`
- [`nicobailon/visual-explainer/plugins/visual-explainer/references/css-patterns.md`](https://github.com/nicobailon/visual-explainer) (MIT) — KPI cards, mermaid zoom controls, overflow protection
- `skills/_shared/aesthetics/` (this package) — 5 aesthetics shared with diagrams
