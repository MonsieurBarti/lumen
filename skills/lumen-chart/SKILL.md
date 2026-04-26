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
2. **Render** following the per-type recipe in `references/render-<type>.md`. Compute axis ticks via Nice Numbers (see below).

## Chart type → schema + recipe

| Need | Schema | Recipe |
|---|---|---|
| categorical magnitude | `schema-bar.json` | `render-bar.md` (vertical / horizontal / grouped / stacked) |
| proportion of whole | `schema-pie.json` | `render-pie.md` (donut via inner radius) |
| time-series single/multi | `schema-line.json` | `render-line.md` (smooth / linear) |
| stacked time-series | `schema-area.json` | `render-area.md` |
| x,y correlation | `schema-scatter.json` | `render-scatter.md` (with optional trend line) |
| multi-dim profile | `schema-radar.json` | `render-radar.md` |
| pipeline conversion | `schema-funnel.json` | `render-funnel.md` |
| x,y,size triplets | `schema-bubble.json` | `render-bubble.md` |
| structured comparison | `schema-table.json` | `render-table.md` (min/max highlighting) |

## Nice Numbers (axis ticks)

Pre-compute ticks before rendering. Avoids floating-point math in render phase. Full spec in `references/axis-and-grid.md`.

**Inputs:** `min`, `max`, `desiredTickCount` (5–10).
**Outputs:** `ticks[]`, `niceMin`, `niceMax`.

**Algorithm:** `range = max − min`; `unitSpacing = range / (desiredTickCount − 1)`; pick magnitude 10ᵏ closest to `unitSpacing`; `niceSpacing = ceil(unitSpacing / magnitude) × magnitude`; emit ticks from `niceMin` in `niceSpacing` steps.

## Color palettes

`references/color-palettes.md` lists tested categorical + sequential + diverging palettes. Pick by intent:

- categorical (independent series) → categorical-N (max 8 hues)
- ordered (low → high values) → sequential
- centered around zero → diverging

## Examples

9 paired `(name).html` + `(name).json` files in `examples/`:

| Use case | Files |
|---|---|
| trend bar chart | `quarterly-revenue` |
| line chart | `monthly-active-users`, `website-traffic` |
| pie / donut | `browser-market-share` |
| funnel | `sales-pipeline` |
| scatter + trend | `study-hours-scores` |
| radar | `team-skills` |
| comparison table | `product-comparison`, `team-performance` |

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

- [`gmdiagram/gm-data-chart`](https://github.com/ZeroZ-lab/gmdiagram) (MIT) → schemas + render recipes + axis-and-grid + color palettes + 9 examples (see `NOTICE.md`)
- `roxabi-forge` → aesthetic system to apply when embedding charts in guides/recaps (lands in `_shared/aesthetics/` once a second skill consumes them)
