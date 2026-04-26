# Chart rendering recipes

Per-type guidance for authoring single-file HTML+SVG charts. Pair each recipe with the matching schema in `../schemas/schema-<type>.json`.

All charts use a hybrid rendering approach:

| Layer | Tech | Used for |
|---|---|---|
| Geometry | native SVG (`<rect>`, `<circle>`, `<line>`, `<path>`) | bars, marks, axes, gridlines |
| Text | `<foreignObject>` + HTML | titles, axis labels, legends, data labels (proper text-wrap, no SVG-text quirks) |

Default canvas: `viewBox="0 0 800 480"`. Margins: 60 left, 40 right, 50 top, 60 bottom — adjust if the title is long or the legend is large.

## Nice Numbers (axis ticks)

Pre-compute axis ticks before rendering so labels are clean (`10, 20, 30` not `2.333, 4.667`).

**Inputs:** `min`, `max`, `desiredTickCount` (5–10 typical).
**Outputs:** `ticks[]`, `niceMin`, `niceMax`.

**Algorithm (Wilkinson):**

```
range        = max - min
unitSpacing  = range / (desiredTickCount - 1)
magnitude    = 10 ^ floor(log10(unitSpacing))
fraction     = unitSpacing / magnitude
niceFraction = fraction <= 1.5 ? 1
             : fraction <= 3   ? 2
             : fraction <= 7   ? 5
             : 10
niceSpacing  = niceFraction * magnitude
niceMin      = floor(min / niceSpacing) * niceSpacing
niceMax      = ceil(max / niceSpacing) * niceSpacing
ticks        = [niceMin, niceMin + niceSpacing, …, niceMax]
```

Apply this once per axis. For dual-axis charts (bubble, scatter) run it on each independently.

## Color palettes

Pick by intent:

- **Categorical** (independent series, max 8 hues): `#22d3ee #34d399 #a78bfa #fbbf24 #fb7185 #fb923c #94a3b8 #c084fc`. Tied to the `dark-professional` palette in `lumen-diagram/templates/aesthetics/dark-professional.css`.
- **Sequential** (low → high values, single hue ramp): `#cffafe → #06b6d4 → #0e7490` (cyan ramp); or `#fef3c7 → #f59e0b → #b45309` (amber ramp).
- **Diverging** (centered around zero, two hues + neutral midpoint): `#dc2626 → #f3f4f6 → #16a34a` (red-gray-green) or `#7c3aed → #f3f4f6 → #f59e0b` (violet-gray-amber).

Reuse the active aesthetic's tokens (`var(--cyan)`, `var(--green)`, `var(--purple)`, etc.) so charts dropped into a guide or recap match.

## Per-type recipes

### Bar

Vertical, horizontal, grouped, or stacked. Default vertical.

- Y axis: Nice Numbers from data range. Include zero for honest comparison.
- Bar width: `(plotWidth / categoryCount) * 0.7`; gap: 30% of slot.
- Grouped: split each slot among series (no extra gap inside group).
- Stacked: cumulative `y` per category; the topmost segment carries the total label if labeled.
- Always label axis titles. Always label series in a legend (skip legend only if single-series and the axis title is enough).

### Line

Single or multi-series time-series.

- X axis: categorical (dates, periods) or numeric (timestamps); Nice Numbers when numeric.
- Y axis: Nice Numbers; if all series share scale, share the Y axis (don't dual-axis casually).
- Line: `<path>` with `stroke-linejoin: round`, `stroke-linecap: round`.
- Smooth: `d="M x0 y0 C cp1x cp1y, cp2x cp2y, x1 y1 …"` with control points at ⅓ / ⅔ between adjacent points (Catmull-Rom-ish).
- Linear: `d="M x0 y0 L x1 y1 …"`. Pick smooth only when interpolation is meaningful.
- Mark each data point with `<circle r=3>` (toggleable via `showMarks`).

### Area

Stacked or overlaid filled areas. Same as line plus:

- `d` path closes back to the X axis (or the layer below in stacked mode).
- Fill at `fill-opacity: 0.6` for overlaid; `0.85` for stacked.
- Stacked: precompute `y_lower` and `y_upper` per series; layers ordered by long-term magnitude (largest at bottom).

### Pie / donut

- 2 to 12 slices. Beyond 12, merge smallest items into "Other".
- Donut: inner radius 50–65% of outer.
- Compute angles from cumulative percentages: each slice spans `(value / total) * 360°`.
- SVG arc path: `M cx cy L x0 y0 A r r 0 largeArc 1 x1 y1 Z`. `largeArc = sweep > 180°`.
- Labels outside the slice for slices < 8% (with leader line); inside otherwise.
- Always show a legend with both label and percentage.

### Scatter

x, y points; optional series grouping; optional trend line.

- X + Y axes: Nice Numbers, both independent.
- Marks: `<circle r=4>`. Vary by series via fill color.
- Trend line: linear regression `y = a + b·x` with `b = Σ((x-x̄)(y-ȳ)) / Σ((x-x̄)²)`. Render across the X axis range only (no extrapolation).
- Plot `R²` value if requested; place near the trend line end.

### Radar

Multi-dimensional comparison; max 8 axes for readability.

- Polygon grid with concentric rings (3–5 levels of the value range).
- Axes radiate from center at `(360° / N) * i`.
- Series rendered as a closed polygon; fill at `fill-opacity: 0.25`, stroke at full opacity.
- Mark each vertex with `<circle r=3>`.
- Axis labels just outside the outermost ring; ring labels along the top axis.

### Funnel

Pipeline conversion. Stages stacked vertically, narrowing.

- Each stage's width: `(value / max(values)) * fullWidth`.
- Trapezoid path between adjacent stages: `M x_l y_top L x_r y_top L x_r' y_bot L x_l' y_bot Z`.
- Always show absolute count and conversion-from-previous percentage.
- Stage colors: gradient from accent at top to muted at bottom (signals attrition).

### Bubble

x, y, size triplets. Like scatter plus size dimension.

- Size mapping: bubble area, not radius, scales with the size value. `r = sqrt(size / max_size) * max_radius`. Otherwise large bubbles dominate visually.
- Axes: same as scatter.
- Color encodes a 4th dimension (categorical) when needed. Beyond 4 dimensions, switch to small multiples instead.
- Min radius 4px, max ~40px (clamp so smallest are visible, largest don't overlap).

### Table / comparison matrix

Structured data with optional min/max highlighting per column.

- HTML `<table>` inside the page (no SVG needed).
- Sticky header (`position: sticky; top: 0`).
- Numeric columns: right-aligned, monospace digits (`font-variant-numeric: tabular-nums`).
- Min/max highlight: scan each numeric column once; mark min cell with `--green-dim` background, max with `--accent-dim`. Skip if column has fewer than 3 values.
- Verdict cells (when present): pill styling, color from `var(--green)` (good) / `var(--orange)` (caution) / `var(--red)` (bad).

## Quality checks

- Every chart has a title.
- Every axis is labeled (title + tick labels).
- Every series is in a legend OR explicit on the chart.
- Numeric labels human-readable (Nice Numbers; thousands separators; avoid 6+ decimal places).
- Honest scales: bar charts include zero unless explicitly broken (and the break is signaled).
- Color choices match data nature: categorical for groups, sequential for ordered, diverging for ±.
- Inline `<title>` tooltips on each data mark for on-hover detail.
- Min 3 data points for line/area; min 2 categories for bar/pie.
- `viewBox` declared so the chart scales when embedded in a guide or recap.
