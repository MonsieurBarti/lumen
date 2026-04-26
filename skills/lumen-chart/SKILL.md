---
name: lumen-chart
description: Generate single-file HTML+SVG data chart (bar, pie, line, area, scatter, radar, funnel, bubble, table). Invoke when user provides numeric data and asks for chart, graph, plot, trend, distribution, proportion, or comparison.
version: 0.1.0
---

# lumen-chart

Single-file HTML+SVG chart. Nice axis ticks. Offline-safe.

## When to invoke

Triggers: `chart`, `graph`, `plot`, `bar chart`, `pie chart`, `line chart`, `scatter`, `radar`, `funnel`, `bubble`, `comparison table`, `trend over time`, `distribution`, `proportion`, `feature matrix`.

## Pipeline (two-step, never skip Step 1)

1. **Extract JSON values** conforming to `schemas/schema-<type>.json`. Common axis + legend config in `schemas/schema-shared.json`.
2. **Render** following `references/chart-recipes.md` — covers per-type guidance, the Nice Numbers algorithm, and color palette guidance.

## Chart type → schema

| Need | Schema |
|---|---|
| categorical magnitude | `schema-bar.json` (vertical / horizontal / grouped / stacked) |
| proportion of whole | `schema-pie.json` (donut via inner radius) |
| time-series single/multi | `schema-line.json` (smooth / linear) |
| stacked time-series | `schema-area.json` |
| x,y correlation | `schema-scatter.json` (with optional trend line) |
| multi-dim profile | `schema-radar.json` |
| pipeline conversion | `schema-funnel.json` |
| x,y,size triplets | `schema-bubble.json` |
| structured comparison | `schema-table.json` (min/max highlighting) |

## Examples

3 paired `(name).html` + `(name).json` files in `examples/`:

| Use case | Files | Type |
|---|---|---|
| feature comparison matrix | `product-comparison` | table |
| team performance grid | `team-performance` | table |
| skills radar | `team-skills` | radar |

Open any HTML in browser; the JSON shows the input shape.

## Output

Single HTML file. SVG axes + grid + marks + legend inlined. No external deps. Opens via `file://`.

## Quality checks

- Axis labels human-readable (no 2.333…); use Nice Numbers
- Legend colors match data series colors
- Stacked totals never overflow viewBox
- `<title>` tooltips on each data mark
- Min 3 data points for line/area; min 2 categories for bar/pie
- Default to `viewBox="0 0 800 480"` so charts scale cleanly inside guides/recaps

## PI extension route (v0.1.x)

The `lumen-generate_visual` PI tool currently wires only mermaid types. For charts, follow this skill's pipeline directly. Deterministic chart renderer (`type: "chart"` route) lands in v0.2 alongside `src/utils/nice-numbers.ts`.

## Sources

- [`gmdiagram/gm-data-chart`](https://github.com/ZeroZ-lab/gmdiagram) (MIT) — chart-type schemas. The original Chinese-language reference docs were dropped; their algorithms are restated in English in `references/chart-recipes.md`.
- 3 English-only example pairs from gmdiagram's example set (`product-comparison`, `team-performance`, `team-skills`)
- `lumen-diagram/templates/aesthetics/` (this package) — 5 aesthetics shared with diagrams when embedding charts in guides/recaps
