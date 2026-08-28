---
name: lumen-diagram
description: Diagram: single-file fgraph HTML. User asks to draw, diagram, sketch, or visualize architecture, flow, or topology.
license: MIT
compatibility: Claude Code · Pi · OMP. Pi tool: type diagram.
version: 0.1.10 # x-release-please-version
---

**Tier:** capability (atomic) — does not invoke other lumen skills.

## Steps

1. **Topology** — open the matching `templates/<topology>.html` (hub → `radial-hub`, pipeline → `linear-flow`, sequence → `sequence`, ≥15 nodes → `system-architecture`, etc.). AI-domain recipes: `templates/ai-patterns.md`. Done when template file is selected.
2. **Layout** — place nodes with `--x/--y/--w/--h` in 0–100 space; pick shapes and edge classes from the template comments. Done when every node and edge is placed and labels ≤20 chars (sequence messages exempt).
3. **Style** — inline only the CSS subset your topology needs (see nearest `examples/*.html`); append one aesthetic from `_shared/aesthetics/` (default `dark-professional`). Done when no external assets are linked.
4. **Deliver** — write `~/.agent/diagrams/<slug>.html`, open in browser. Done when path is returned.

PI deterministic route: `lumen-generate_visual` with `type: "diagram"` — schema in `src/templates/diagram/schemas.ts`.
