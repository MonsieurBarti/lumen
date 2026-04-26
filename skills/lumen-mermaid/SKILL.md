---
name: lumen-mermaid
description: Render Mermaid diagram (flowchart, sequence, ER, state, gantt, mindmap, class) as self-contained HTML with zoom, pan, fit-to-screen, expand-to-tab. Invoke when user asks for mermaid diagram or supplies mermaid source.
version: 0.1.5 # x-release-please-version
---

# lumen-mermaid

Mermaid in HTML shell. Zoom / pan / fit / new-tab. Offline-safe after first CDN load.

**Tier:** capability (atomic) — does not invoke other lumen skills. Composites and playbooks may invoke it.

## When to invoke

Triggers: `mermaid diagram`, `mermaid chart`, raw mermaid source pasted by user, or when mermaid syntax fits the request better than custom SVG (flowcharts with conditionals, sequence with many actors, ER schemas).

## Output structure

Single HTML file. Mermaid source embedded via opaque script tag to avoid HTML parser mangling:

```html
<script type="text/plain" class="diagram-source">
  graph TD
  A --> B
</script>
```

`</script>` inside the source escaped to `<\/script`. Mermaid CDN loaded with `startOnLoad: false`. Explicit `mermaid.render(id, code)` called after DOMContentLoaded to avoid timing races.

## Aesthetics (v0.1.x)

Lifted from visual-explainer. 8 palettes, each with light + dark variants:

`blueprint` (default), `editorial`, `paper`, `terminal`, `dracula`, `nord`, `solarized`, `gruvbox`.

The 5 fgraph aesthetics (`dark-professional`, `blueprint`, `editorial`, `terminal`, `lyra`) live in `skills/_shared/aesthetics/` and are consumed by the deterministic diagram / chart / guide / slide / gallery renderers — NOT by mermaid (mermaid uses the 8 palettes above, baked into `src/templates/shared.ts`). Future gmdiagram-derived aesthetics (`glassmorphism`, `cyberpunk-neon`, `hand-drawn`) land in `skills/_shared/aesthetics/` as patches.

## Shell features (`MERMAID_SHELL_CSS` + `MERMAID_SHELL_JS` in `src/templates/shared.ts`)

- Viewport: `position: relative; overflow: hidden`. Canvas absolute-positioned, transformed via translate + scale.
- Zoom: min 0.08, max 6.5, step 0.14. Wheel + Ctrl/Cmd. Touch pinch supported.
- Pan: drag with grab cursor. Constrained to diagram bounds.
- Smart fit on load: width-priority vs height-priority based on viewport ratio. Readability floor 0.58 forces width-priority if text becomes too small.
- Adaptive container height: clamped 360–960px or 84vh, computed from SVG intrinsic aspect.
- Controls: `+`, `−`, `fit`, `1:1`, `expand-to-tab`. Expand reads `data-bg` and exports SVG to minimal new-tab HTML.
- Concrete fonts in CSS (no system stack) so SVG export matches on-screen render.

## Pipeline

1. Receive or generate mermaid source.
2. Validate syntax mentally (mermaid grammar; emit clean fenced source on failure).
3. Call `generateMermaidTemplate(title, {mermaidSyntax, caption?}, aesthetic, isDark)` from `src/templates/mermaid.ts`. CSS + IIFE JS inlined.
4. Aesthetic sets `data-bg` + theme tokens.
5. Write file via `writeHtmlFile`. Open via `file://`.

## Quality checks

- `</script>` in source escaped to `<\/script`
- `mermaid.startOnLoad` is `false`
- Explicit `mermaid.render` called once
- `data-bg` attribute set so expand-to-tab matches
- Container height adapts to SVG aspect, not fixed

## PI extension route

`lumen-generate_visual({type, content, title, aesthetic?, theme?})` where `type ∈ {flowchart, sequence, er, state, mermaid_custom}` → renderer at `src/templates/mermaid.ts` (lifted verbatim from visual-explainer). Note that `type: "sequence"` here means a **mermaid** sequence diagram (text source); the fgraph deterministic sequence renderer is reached via `type: "diagram"` with `content.topology: "sequence"` (see `lumen-diagram/SKILL.md`).

## Sources (do not re-create)

- `visual-explainer/src/templates/mermaid.ts` → HTML scaffold + escape trick + explicit render
- `visual-explainer/src/templates/shared.ts::MERMAID_SHELL_JS` → zoom / pan / fit / expand-to-tab IIFE
- `visual-explainer/src/templates/shared.ts::MERMAID_SHELL_CSS` → readability floor, adaptive height, concrete fonts
