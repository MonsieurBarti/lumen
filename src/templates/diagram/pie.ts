/**
 * Pie renderer — composition / proportion.
 *
 * SVG pie chart with labeled slices.
 */

import { escapeHtml } from "../shared.js";
import type { FgraphTone, PieContent } from "./schemas.js";

const PIE_CSS = `
  .fgraph-wrap.pie {
    position: relative;
    width: 100%;
    max-width: 700px;
    aspect-ratio: 1 / 1;
    margin: 24px auto 16px;
    background: var(--bg-panel);
    border: 1px solid rgba(34,211,238,0.35);
    border-radius: 10px;
    padding: 14px;
  }

  .pie-svg {
    position: absolute;
    left: 5%;
    top: 5%;
    width: 60%;
    height: 60%;
  }

  .pie-legend {
    position: absolute;
    right: 8%;
    top: 15%;
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    color: var(--text);
    z-index: 2;
  }
  .pie-legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 6px;
  }
  .pie-swatch {
    width: 10px;
    height: 10px;
    border-radius: 2px;
  }
  .pie-swatch.amber  { background: var(--amber); }
  .pie-swatch.cyan   { background: var(--cyan); }
  .pie-swatch.purple { background: var(--purple); }
  .pie-swatch.green  { background: var(--green); }
  .pie-swatch.red    { background: var(--red); }`;

function generateSlicePath(
	_index: number,
	total: number,
	value: number,
	totalValue: number,
): string {
	const startAngle = (total / totalValue) * 2 * Math.PI - Math.PI / 2;
	const endAngle = ((total + value) / totalValue) * 2 * Math.PI - Math.PI / 2;
	const x1 = 50 + 40 * Math.cos(startAngle);
	const y1 = 50 + 40 * Math.sin(startAngle);
	const x2 = 50 + 40 * Math.cos(endAngle);
	const y2 = 50 + 40 * Math.sin(endAngle);
	const largeArc = value / totalValue > 0.5 ? 1 : 0;
	return `M 50,50 L ${x1.toFixed(1)},${y1.toFixed(1)} A 40,40 0 ${largeArc},1 ${x2.toFixed(1)},${y2.toFixed(1)} Z`;
}

function generateBody(content: PieContent, ariaLabel: string): string {
	const { slices, legend } = content;
	const totalValue = slices.reduce((sum, s) => sum + s.value, 0);

	let current = 0;
	const paths = slices
		.map((slice, i) => {
			const tone: FgraphTone = slice.tone ?? "cyan";
			const d = generateSlicePath(i, current, slice.value, totalValue);
			current += slice.value;
			return `    <path d="${d}" class="${tone}" fill="var(--${tone})" stroke="var(--bg-panel)" stroke-width="1"/>`;
		})
		.join("\n");

	const legendItems = slices
		.map((slice) => {
			const tone = slice.tone ?? "cyan";
			const pct = ((slice.value / totalValue) * 100).toFixed(1);
			return `  <div class="pie-legend-item"><div class="pie-swatch ${tone}"></div>${escapeHtml(slice.name)} — ${pct}%</div>`;
		})
		.join("\n");

	const legendHtml = legend ? `\n  <div class="fgraph-legend">${escapeHtml(legend)}</div>` : "";

	return `<div class="fgraph-wrap pie" role="img" aria-label="${escapeHtml(ariaLabel)}">

  <!-- ── PIE ────────────────────────────────────── -->
  <svg class="pie-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
${paths}
  </svg>

  <!-- ── LEGEND ─────────────────────────────────── -->
  <div class="pie-legend">
${legendItems}
  </div>
${legendHtml}
</div>`;
}

export interface PieRenderInput {
	title: string;
	subtitle?: string;
	content: PieContent;
}

export function renderPieBody({ title, content }: PieRenderInput): {
	bodyHtml: string;
	topologyCss: string;
} {
	const ariaLabel = `Pie chart: ${title}. ${content.slices.map((s) => s.name).join(", ")}.`;
	return {
		bodyHtml: generateBody(content, ariaLabel),
		topologyCss: PIE_CSS,
	};
}
