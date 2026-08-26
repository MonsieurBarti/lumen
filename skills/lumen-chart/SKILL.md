---
name: lumen-chart
description: Chart: single-file HTML/SVG or Chart.js from data. User asks for chart, plot, graph, trend, or comparison table.
license: MIT
compatibility: Claude Code · Pi · OMP. Pi tool: type chart.
version: 0.1.9 # x-release-please-version
---

**Tier:** capability (atomic) — does not invoke other lumen skills.

## Steps

1. **Schema** — shape data to `schemas/schema-<type>.json` (shared axes: `schema-shared.json`). Done when JSON validates against the chosen type.
2. **Render** — follow `references/chart-recipes.md` (Nice Numbers, palettes, per-type SVG/Chart.js). Optional style direction: `references/chart-presets.md`. Done when chart fits viewBox and axis labels are human-readable.
3. **Deliver** — write `~/.agent/diagrams/<slug>.html`, open in browser. Done when path is returned.

Examples: `examples/*.html` + paired `.json`. PI route schema: `src/templates/chart/schemas.ts`.
