/**
 * Pie / donut chart renderer.
 *
 * Layout (chart-recipes.md → Pie / donut):
 *   - 2–12 slices (parser caps)
 *   - Donut: inner radius is fraction of outer (0.5–0.65 recommended)
 *   - Slice angles from cumulative percentages
 *   - SVG arc path: pie uses M cx cy L x0 y0 A r r 0 largeArc 1 x1 y1 Z;
 *     donut uses M outer-start A outer-end L inner-end A inner-start Z
 *   - Slice labels rendered inside for slices ≥ 6% (skipped otherwise; the
 *     legend always carries label + percentage)
 */

import { escapeHtml } from "../shared.js";
import {
	MARGIN_LEFT,
	MARGIN_TOP,
	PLOT_H,
	PLOT_W,
	VIEWBOX_H,
	VIEWBOX_W,
	renderLegend,
	seriesColor,
} from "./_shared.js";
import type { PieContent } from "./schemas.js";

const PIE_CSS = `
  .pie-slice { transition: opacity 0.15s, transform 0.15s; transform-origin: center; transform-box: fill-box; }
  .pie-slice:hover { opacity: 0.85; transform: scale(1.02); }
  .pie-slice-label {
    font-family: 'Space Mono', monospace;
    font-size: 11px;
    font-weight: 700;
    fill: var(--bg);
    pointer-events: none;
  }`;

const LABEL_VISIBILITY_THRESHOLD = 0.06; // 6% — smaller slices get legend-only

interface SlicePosition {
	startAngle: number;
	endAngle: number;
	color: string;
	label: string;
	value: number;
	pct: number;
}

function computeSlicePositions(content: PieContent): SlicePosition[] {
	const total = content.slices.reduce((acc, s) => acc + s.value, 0);
	let cursor = -Math.PI / 2; // start at 12 o'clock
	return content.slices.map((slice, i) => {
		const pct = slice.value / total;
		const sweep = pct * 2 * Math.PI;
		const start = cursor;
		const end = cursor + sweep;
		cursor = end;
		return {
			startAngle: start,
			endAngle: end,
			color: seriesColor(i, slice.color),
			label: slice.label,
			value: slice.value,
			pct,
		};
	});
}

function arcPath(
	cx: number,
	cy: number,
	rOuter: number,
	rInner: number,
	startAngle: number,
	endAngle: number,
): string {
	const sweep = endAngle - startAngle;
	const largeArc = sweep > Math.PI ? 1 : 0;
	const cos = Math.cos;
	const sin = Math.sin;

	const x0 = cx + rOuter * cos(startAngle);
	const y0 = cy + rOuter * sin(startAngle);
	const x1 = cx + rOuter * cos(endAngle);
	const y1 = cy + rOuter * sin(endAngle);

	if (rInner === 0) {
		return `M ${cx.toFixed(2)} ${cy.toFixed(2)} L ${x0.toFixed(2)} ${y0.toFixed(2)} A ${rOuter.toFixed(2)} ${rOuter.toFixed(2)} 0 ${largeArc} 1 ${x1.toFixed(2)} ${y1.toFixed(2)} Z`;
	}

	const xi0 = cx + rInner * cos(startAngle);
	const yi0 = cy + rInner * sin(startAngle);
	const xi1 = cx + rInner * cos(endAngle);
	const yi1 = cy + rInner * sin(endAngle);

	return `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${rOuter.toFixed(2)} ${rOuter.toFixed(2)} 0 ${largeArc} 1 ${x1.toFixed(2)} ${y1.toFixed(2)} L ${xi1.toFixed(2)} ${yi1.toFixed(2)} A ${rInner.toFixed(2)} ${rInner.toFixed(2)} 0 ${largeArc} 0 ${xi0.toFixed(2)} ${yi0.toFixed(2)} Z`;
}

function generateBody(content: PieContent): string {
	const cx = MARGIN_LEFT + PLOT_W / 2;
	const cy = MARGIN_TOP + PLOT_H / 2;
	const rOuter = Math.min(PLOT_W, PLOT_H) / 2 - 20;
	const innerFraction = content.innerRadius ?? 0;
	const rInner = innerFraction * rOuter;

	const positions = computeSlicePositions(content);

	const sliceSvg = positions
		.map((pos) => {
			const tip = `${pos.label}: ${pos.value} (${(pos.pct * 100).toFixed(1)}%)`;
			return `    <path class="pie-slice" d="${arcPath(cx, cy, rOuter, rInner, pos.startAngle, pos.endAngle)}" fill="${pos.color}"><title>${escapeHtml(tip)}</title></path>`;
		})
		.join("\n");

	// Inline labels for visible slices (≥6%). Position at midpoint along the
	// arc bisector, between inner and outer radius (or at 60% radius for pie).
	const labelRadius = rInner > 0 ? (rInner + rOuter) / 2 : rOuter * 0.62;
	const labelSvg = positions
		.filter((pos) => pos.pct >= LABEL_VISIBILITY_THRESHOLD)
		.map((pos) => {
			const midAngle = (pos.startAngle + pos.endAngle) / 2;
			const lx = cx + labelRadius * Math.cos(midAngle);
			const ly = cy + labelRadius * Math.sin(midAngle);
			return `    <text class="pie-slice-label" text-anchor="middle" x="${lx.toFixed(2)}" y="${(ly + 4).toFixed(2)}">${(pos.pct * 100).toFixed(0)}%</text>`;
		})
		.join("\n");

	const ariaLabel = `Pie chart with ${content.slices.length} slices: ${content.slices.map((s) => s.label).join(", ")}.`;

	return `<svg class="chart-svg" viewBox="0 0 ${VIEWBOX_W} ${VIEWBOX_H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${escapeHtml(ariaLabel)}">
${sliceSvg}
${labelSvg}
</svg>`;
}

export interface PieRenderInput {
	title: string;
	subtitle?: string;
	content: PieContent;
}

export function renderPieBody({ content }: PieRenderInput): {
	chartHtml: string;
	chartCss: string;
	legendHtml: string;
} {
	const total = content.slices.reduce((acc, s) => acc + s.value, 0);
	const legendHtml = renderLegend(
		content.slices.map((s, i) => ({
			label: `${s.label} — ${((s.value / total) * 100).toFixed(1)}%`,
			color: seriesColor(i, s.color),
		})),
	);
	return {
		chartHtml: generateBody(content),
		chartCss: PIE_CSS,
		legendHtml,
	};
}
