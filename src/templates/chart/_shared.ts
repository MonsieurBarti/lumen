/**
 * Shared helpers for chart renderers.
 * - HTML document shell (header + main with the chart SVG + legend)
 * - SVG canvas geometry constants (viewBox, plot margins)
 * - categorical color palette + per-series tone resolver
 *
 * Aesthetic CSS loading uses the shared utility at src/utils/aesthetic-loader.
 */

import { escapeHtml } from "../shared.js";

export { loadAestheticCss } from "../../utils/aesthetic-loader.js";

/* ────────────────────────────────────────────────────────────────────
   Canvas geometry — see chart-recipes.md
   ──────────────────────────────────────────────────────────────────── */
export const VIEWBOX_W = 800;
export const VIEWBOX_H = 480;
export const MARGIN_LEFT = 60;
export const MARGIN_RIGHT = 40;
export const MARGIN_TOP = 30;
export const MARGIN_BOTTOM = 60;
export const PLOT_W = VIEWBOX_W - MARGIN_LEFT - MARGIN_RIGHT;
export const PLOT_H = VIEWBOX_H - MARGIN_TOP - MARGIN_BOTTOM;

/* ────────────────────────────────────────────────────────────────────
   Categorical palette (8 hues, dark-professional anchor).
   When the caller supplies an explicit series.color, that wins.
   ──────────────────────────────────────────────────────────────────── */
export const CATEGORICAL_PALETTE = [
	"#22d3ee", // cyan     — frontend / accent
	"#34d399", // green    — backend / success
	"#a78bfa", // purple   — database / data
	"#fbbf24", // amber    — cloud / warn
	"#fb7185", // rose     — security / risk
	"#fb923c", // orange   — message bus / pipeline
	"#94a3b8", // slate    — external / neutral
	"#c084fc", // violet   — alt accent
] as const;

/**
 * Resolve a series color: caller override wins, else cycle the palette.
 * Cycle wraps for >8 series (parser caps before this in practice).
 */
export function seriesColor(index: number, override?: string): string {
	if (override !== undefined) return override;
	return CATEGORICAL_PALETTE[index % CATEGORICAL_PALETTE.length] as string;
}

/* ────────────────────────────────────────────────────────────────────
   Common chart CSS (axes, gridlines, marks, legend). Per-type CSS
   appended by each renderer.
   ──────────────────────────────────────────────────────────────────── */
export const BASE_CHART_CSS = `
  body {
    background: var(--bg);
    color: var(--text);
    font-family: 'Inter', system-ui, sans-serif;
    padding: 32px 24px 40px;
    max-width: 960px;
    margin: 0 auto;
  }
  header { margin-bottom: 20px; }
  .header-eyebrow {
    font-family: 'Space Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-muted);
  }
  h1 { font-size: 28px; font-weight: 700; margin: 6px 0 4px; font-family: 'Outfit', sans-serif; }
  .header-subtitle { color: var(--text-dim); font-size: 13px; margin: 0; max-width: 740px; }

  .chart-wrap {
    width: 100%;
    max-width: 880px;
    margin: 24px auto 16px;
    background: var(--bg-panel);
    border: 1px solid var(--border-bright);
    border-radius: 10px;
    padding: 14px;
  }
  .chart-svg {
    width: 100%;
    height: auto;
    display: block;
  }

  /* Axes + gridlines */
  .axis-line { stroke: var(--border-bright); stroke-width: 1; }
  .axis-tick { stroke: var(--border-bright); stroke-width: 1; }
  .axis-label {
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    fill: var(--text-muted);
  }
  .axis-title {
    font-family: 'Space Mono', monospace;
    font-size: 11px;
    font-weight: 700;
    fill: var(--text-dim);
    letter-spacing: 0.04em;
  }
  .gridline { stroke: var(--border); stroke-width: 0.5; stroke-dasharray: 2 3; }

  /* Legend (HTML, sits below the SVG) */
  .chart-legend {
    margin-top: 12px;
    display: flex;
    flex-wrap: wrap;
    gap: 6px 18px;
    justify-content: center;
    font-family: 'Space Mono', monospace;
    font-size: 11px;
    color: var(--text-dim);
  }
  .legend-swatch {
    display: inline-block;
    width: 12px;
    height: 12px;
    border-radius: 2px;
    margin-right: 6px;
    vertical-align: -1px;
  }`;

export interface ChartShellInput {
	title: string;
	eyebrow: string;
	subtitle?: string | undefined;
	aestheticCss: string;
	chartCss: string;
	chartHtml: string;
	legendHtml?: string | undefined;
}

/**
 * Wrap a chart body in the standard chart HTML shell. Returns a single-file
 * offline-safe HTML string.
 */
export function renderChartShell({
	title,
	eyebrow,
	subtitle,
	aestheticCss,
	chartCss,
	chartHtml,
	legendHtml,
}: ChartShellInput): string {
	const safeTitle = escapeHtml(title);
	const safeEyebrow = escapeHtml(eyebrow);
	const safeSubtitle = subtitle ? escapeHtml(subtitle) : "";

	return `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="generator" content="lumen / chart deterministic renderer">
<title>${safeTitle}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Inter:wght@300;400;500;600;700&family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
${aestheticCss}
${BASE_CHART_CSS}
${chartCss}
</style>
</head>
<body>

<header>
  <div class="header-eyebrow">${safeEyebrow}</div>
  <h1>${safeTitle}</h1>
  ${safeSubtitle ? `<p class="header-subtitle">${safeSubtitle}</p>` : ""}
</header>

<main>
<div class="chart-wrap">
${chartHtml}${legendHtml ? `\n${legendHtml}` : ""}
</div>
</main>

</body>
</html>`;
}

/** Build the standard legend block from a list of (label, color) pairs. */
export function renderLegend(items: Array<{ label: string; color: string }>): string {
	const inner = items
		.map(
			(item) =>
				`  <span><span class="legend-swatch" style="background:${item.color}"></span>${escapeHtml(item.label)}</span>`,
		)
		.join("\n");
	return `<div class="chart-legend">\n${inner}\n</div>`;
}
