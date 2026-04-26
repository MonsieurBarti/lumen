# Chart presets — design language reference

Per-preset specs for the 5 chart presets declared in `../SKILL.md`. Each preset dictates **defaults** (gridline density, axis treatment, label conventions, annotation grammar). Aesthetics from `_shared/aesthetics/*.css` supply palette + typography; presets layer on top.

Composition rule: `aesthetic` × `preset` is the full design space. `aesthetic: lyra` + `preset: editorial-broadsheet` is valid. The LLM author may override per-chart when context warrants.

## How to apply a preset

1. **Pick the preset** based on audience and chart density (table below).
2. **Inline the preset's CSS fragment** in the chart's `<style>` block, using the active aesthetic's tokens (`var(--text)`, `var(--accent)`, etc.) — not hard-coded hex.
3. **Follow the annotation grammar** when adding labels, takeaway boxes, or footnotes.
4. **Skip the parts that don't apply** to your chart type. A pie chart has no gridlines; the rule still tells you to omit them, not invent them.

Cross-cutting defaults (apply in every preset):

- `viewBox="0 0 800 480"` unless the preset says otherwise
- Nice Numbers axis ticks (see `chart-recipes.md`)
- `<title>` tooltips on every data mark
- Axis labels human-readable (no `2.333…`)

| Preset | Density | Audience | Best chart types |
|---|---|---|---|
| `editorial-broadsheet` | low | newspaper readers | bar, line, single-series pie |
| `consulting-deck` | medium | execs / boards | bar (always with takeaway), funnel |
| `newsweekly` | high | engaged readers | line, area, scatter |
| `investment-bank` | very high | analysts | table, dual-axis line, dense bar |
| `swiss-grid` | very low | minimalist briefs | bar, line, pie |

---

## `editorial-broadsheet`

**Signal:** "I want one fact, beautifully framed."

Palette: aesthetic `--text` for axis & marks, **single accent** color for the data series, `--text-muted` for gridlines. No multi-color rainbow. If the chart is multi-series, prefer side-by-side bars in two shades of the accent rather than 5 different hues.

Typography: aesthetic `--font-serif` for the title, `--font-sans` for axis labels. Title weight 700, axis weight 400.

```css
.chart-editorial {
  --gridline-color: color-mix(in srgb, var(--text) 8%, transparent);
  --accent: var(--accent, #c14a36); /* fall back to a warm red */
}
.chart-editorial .gridline { stroke: var(--gridline-color); stroke-width: 1; }
.chart-editorial .gridline--vertical { display: none; } /* horizontal only */
.chart-editorial .axis-line { stroke: var(--text); stroke-width: 1.5; }
.chart-editorial .legend { display: none; }              /* never a legend */
.chart-editorial .endpoint-label {                       /* inline at line end */
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 600;
  fill: var(--accent);
}
.chart-editorial .title {
  font-family: var(--font-serif);
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.02em;
}
.chart-editorial .subtitle {
  font-family: var(--font-sans);
  font-size: 13px;
  color: var(--text-muted);
  letter-spacing: 0;
}
```

Annotation grammar: end-of-line labels for line charts, value-on-bar for bar charts. **Never a separate legend.** If two series, label each line at its right endpoint.

```html
<text class="endpoint-label" x="780" y="120">Enterprise — 18.4</text>
<text class="endpoint-label" x="780" y="240">SMB — 7.2</text>
```

Don't:
- Don't use 4+ colors. If you need 4 series, use a different preset.
- Don't add a separate legend box. Labels are inline.

---

## `consulting-deck`

**Signal:** "Every chart answers one question. The answer is at the top."

Palette: monochrome bars (one shade of the accent) with a single highlighted bar in a complementary color. Reserve color for emphasis, not decoration.

Typography: bold sans-serif title (the **action title** — see below), data labels in the same family at smaller size, source footnote in muted small.

```css
.chart-consulting {
  --action-title-color: var(--text);
  --highlight: var(--warning, #d97706);
  --bar-fill: color-mix(in srgb, var(--text) 75%, transparent);
}
.chart-consulting .gridline { display: none; } /* values go on bars */
.chart-consulting .bar { fill: var(--bar-fill); }
.chart-consulting .bar--highlight { fill: var(--highlight); }
.chart-consulting .bar-label {
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 600;
  fill: var(--text);
  text-anchor: middle;
}
.chart-consulting .action-title {
  font-family: var(--font-sans);
  font-size: 22px;
  font-weight: 700;
  line-height: 1.25;
}
.chart-consulting .takeaway {
  position: absolute;
  top: 8px; right: 8px;
  max-width: 240px;
  padding: 12px 14px;
  background: color-mix(in srgb, var(--accent) 12%, transparent);
  border-left: 3px solid var(--accent);
  font-size: 13px;
  line-height: 1.4;
}
.chart-consulting .source {
  font-family: var(--font-sans);
  font-size: 10px;
  color: var(--text-muted);
  letter-spacing: 0.04em;
}
```

**Action title** = a complete sentence stating the conclusion, not a label.
- ❌ "Quarterly Revenue"
- ✅ "Enterprise revenue grew 52% in Q4, outpacing SMB for the first time"

Annotation grammar: action title above, value-labels on every bar, takeaway box top-right, `Source: …` footnote bottom-left.

```html
<h2 class="action-title">Enterprise grew 52% in Q4 — first time outpacing SMB</h2>
<svg class="chart-consulting" viewBox="0 0 800 420">
  <!-- bars, with bar-labels showing values -->
</svg>
<div class="takeaway"><strong>So what:</strong> Re-allocate Q1 sales hires toward Enterprise.</div>
<p class="source">Source: Internal CRM, Q1–Q4 2025</p>
```

Don't:
- Don't use a generic noun-phrase title. The title IS the takeaway.
- Don't omit the source footnote. Decks without sources lose credibility.

---

## `newsweekly`

**Signal:** "Reader will study this for 30 seconds. Pack it with information."

Palette: high-saturation accent (often red or red-orange) for one focal series; muted neutrals for context series. Up to 4 series, but only 1 should be vivid.

Typography: condensed sans-serif preferred. High label density — annotate every meaningful inflection point inline.

```css
.chart-newsweekly {
  --accent-bar-color: var(--danger, #dc2626);
  --neutral-series: var(--text-muted);
}
.chart-newsweekly .gridline {
  stroke: color-mix(in srgb, var(--text) 6%, transparent);
  stroke-width: 0.75;
}
.chart-newsweekly .accent-bar {
  /* the colored vertical bar that sits on the left edge of the chart, full-height */
  fill: var(--accent-bar-color);
  width: 4px;
}
.chart-newsweekly .annotation {
  font-family: var(--font-sans);
  font-size: 11px;
  font-weight: 500;
  fill: var(--text);
}
.chart-newsweekly .annotation-arrow {
  stroke: var(--text);
  stroke-width: 1;
  marker-end: url(#arrow-tip);
  fill: none;
}
.chart-newsweekly .focal-series { stroke: var(--accent-bar-color); stroke-width: 2.5; }
.chart-newsweekly .context-series { stroke: var(--neutral-series); stroke-width: 1.25; }
```

Annotation grammar: dense — call out outliers, peaks, troughs, regime changes. Each callout is an `<text>` + an `<line>`/`<path>` arrow pointing to the data point.

```html
<svg class="chart-newsweekly" viewBox="0 0 800 480">
  <rect class="accent-bar" x="0" y="0" height="480" />
  <!-- gridlines, axes, focal-series, context-series -->
  <path class="annotation-arrow" d="M 540 100 Q 480 60 410 130" />
  <text class="annotation" x="545" y="100">Pricing change, Aug 2025</text>
</svg>
```

Don't:
- Don't leave outliers unannotated. Every visible spike or dip needs a 1-line explanation.
- Don't use 5+ vivid colors. 1 vivid focal series + muted context.

---

## `investment-bank`

**Signal:** "Numbers are the payload. Show them all."

Palette: minimal color — black/white/gray plus one accent for highlighting. Numbers are the visual primary.

Typography: monospaced numerics (`font-variant-numeric: tabular-nums`); proportional sans for labels. Decimal precision rules: percentages to 1dp, currency to 0dp for whole units / 2dp for fractional, basis points as integers.

```css
.chart-ibank {
  --tick-grid: color-mix(in srgb, var(--text) 12%, transparent);
}
.chart-ibank .gridline { stroke: var(--tick-grid); stroke-width: 0.5; }
.chart-ibank .gridline--minor { stroke-dasharray: 1 3; }
.chart-ibank text, .chart-ibank .data-label {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  font-size: 11px;
}
.chart-ibank .axis-label {
  font-family: var(--font-sans);
  font-size: 10px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  fill: var(--text-muted);
}
.chart-ibank .footnote {
  font-family: var(--font-mono);
  font-size: 9px;
  color: var(--text-muted);
  margin-top: 8px;
}
.chart-ibank .min-cell { background: color-mix(in srgb, var(--danger, #dc2626) 14%, transparent); }
.chart-ibank .max-cell { background: color-mix(in srgb, var(--success, #16a34a) 14%, transparent); }
```

Annotation grammar: dual-axis is normal (left = absolute, right = % change). Footnotes are numbered (`(1) Excludes FX impact`); footnote block sits below the chart in monospaced 9px.

For tables: highlight min/max cells with subtle background tint (not bold border — too noisy at scale).

```html
<table class="chart-ibank" role="table">
  <thead>
    <tr><th>Segment</th><th>Q1</th><th>Q2</th><th>Q3</th><th>Q4</th><th>FY YoY%</th></tr>
  </thead>
  <tbody>
    <tr><td>Enterprise</td><td>12.0</td><td>18.0</td><td class="max-cell">24.5</td><td>22.1</td><td>+38.2</td></tr>
    <tr><td>SMB</td><td>5.0</td><td>7.0</td><td class="min-cell">4.8</td><td>6.2</td><td>+4.1</td></tr>
  </tbody>
</table>
<p class="footnote">(1) USD millions, constant currency. (2) FY YoY excludes acquired revenue.</p>
```

Don't:
- Don't round aggressively. Precision is the product.
- Don't use rainbow palettes. Color is for highlighting, not decoration.

---

## `swiss-grid`

**Signal:** "One message. No noise."

Palette: 2 colors max — typically the aesthetic's `--text` and one accent. Generous whitespace; the chart occupies maybe 60% of its container.

Typography: clean sans-serif (Helvetica-family). No axis titles — units go in the subtitle. Tight grid alignment — every element snaps to a 4px or 8px grid.

```css
.chart-swiss {
  --hairline: color-mix(in srgb, var(--text) 10%, transparent);
}
.chart-swiss .gridline {
  stroke: var(--hairline);
  stroke-width: 0.5;
}
.chart-swiss .gridline--vertical { display: none; }
.chart-swiss .axis-line { stroke: var(--text); stroke-width: 1; }
.chart-swiss .axis-label--title { display: none; } /* units go in subtitle */
.chart-swiss .data-mark {
  fill: var(--accent, var(--text));
  stroke: none;
}
.chart-swiss .title {
  font-family: var(--font-sans);
  font-size: 20px;
  font-weight: 600;
  letter-spacing: -0.01em;
}
.chart-swiss .subtitle {
  font-family: var(--font-sans);
  font-size: 11px;
  color: var(--text-muted);
  letter-spacing: 0.02em;
  margin-bottom: 32px; /* enforced whitespace */
}
```

Annotation grammar: minimal. Subtitle carries the units. Inline labels only on extremes (max, min). No legend if single-series; if multi-series, a single-line legend below the chart.

```html
<h3 class="title">Quarterly revenue</h3>
<p class="subtitle">USD millions · 2025</p>
<svg class="chart-swiss" viewBox="0 0 800 360"><!-- chart geometry --></svg>
```

Don't:
- Don't add chart junk: no 3D effects, no shadows, no decorative borders.
- Don't fill empty space. Whitespace is the design.

---

## Preset → chart type interactions

| Preset / Type | bar | line | area | pie | scatter | radar | funnel | bubble | table |
|---|---|---|---|---|---|---|---|---|---|
| editorial-broadsheet | ✅ | ✅✅ | ✅ | ✅ (single-series) | ⚠️ (annotate heavily) | ❌ (too dense) | ✅ | ⚠️ | ⚠️ |
| consulting-deck | ✅✅ | ✅ | ⚠️ | ✅ | ❌ | ❌ | ✅✅ | ❌ | ✅ |
| newsweekly | ✅ | ✅✅ | ✅✅ | ❌ | ✅✅ | ⚠️ | ⚠️ | ✅ | ⚠️ |
| investment-bank | ✅✅ | ✅✅ | ✅ | ❌ | ✅ | ❌ | ⚠️ | ✅ | ✅✅ |
| swiss-grid | ✅✅ | ✅✅ | ⚠️ | ✅ | ✅ | ❌ | ⚠️ | ❌ | ✅ |

✅✅ ideal — ✅ works — ⚠️ possible but awkward — ❌ avoid

## When in doubt

`swiss-grid` is the safest default. It works for any audience and never looks wrong. Reach for the more opinionated presets (`consulting-deck`, `newsweekly`) only when you have a clear narrative reason.
