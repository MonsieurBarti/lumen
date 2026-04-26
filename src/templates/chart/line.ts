/**
 * Line chart renderer (single or multi-series).
 *
 * Layout (chart-recipes.md → Line):
 *   - X axis: categorical labels evenly distributed across plot width
 *   - Y axis: Nice Numbers from data range (does NOT force include zero —
 *     line charts about deltas are common)
 *   - Path: linear (M/L) or smooth (cubic Bezier with Catmull-Rom-ish
 *     control points at ⅓ / ⅔ between adjacent points)
 *   - Marks: <circle r=3> at each data point (toggleable via showMarks)
 */

import { formatTick, niceNumbers } from "../../utils/nice-numbers.js";
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
import type { LineContent, LineSeries } from "./schemas.js";

const LINE_CSS = `
  .line-path {
    fill: none;
    stroke-width: 2;
    stroke-linejoin: round;
    stroke-linecap: round;
    transition: stroke-width 0.15s;
  }
  .line-path:hover { stroke-width: 3; }
  .line-mark { transition: r 0.15s; }
  .line-mark:hover { r: 5; }
  .x-axis-label {
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    fill: var(--text-dim);
  }`;

interface PlotPoint {
	x: number;
	y: number;
	label: string;
	value: number;
}

function plotSeries(
	series: LineSeries,
	xLabels: string[],
	yScale: (v: number) => number,
): PlotPoint[] {
	const slotWidth = PLOT_W / Math.max(1, xLabels.length - 1);
	return series.data.map((point, i) => ({
		x: MARGIN_LEFT + i * slotWidth,
		y: yScale(point.value),
		label: point.label,
		value: point.value,
	}));
}

function linearPath(points: PlotPoint[]): string {
	if (points.length === 0) return "";
	const head = points[0];
	if (!head) return "";
	const tail = points
		.slice(1)
		.map((p) => `L ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
		.join(" ");
	return `M ${head.x.toFixed(2)} ${head.y.toFixed(2)} ${tail}`.trim();
}

function smoothPath(points: PlotPoint[]): string {
	if (points.length < 2) return linearPath(points);
	const first = points[0];
	if (!first) return "";

	const segments: string[] = [];
	for (let i = 1; i < points.length; i++) {
		const p0 = points[i - 2] ?? points[i - 1];
		const p1 = points[i - 1];
		const p2 = points[i];
		const p3 = points[i + 1] ?? points[i];
		if (!p0 || !p1 || !p2 || !p3) continue;
		const cp1x = p1.x + (p2.x - p0.x) / 6;
		const cp1y = p1.y + (p2.y - p0.y) / 6;
		const cp2x = p2.x - (p3.x - p1.x) / 6;
		const cp2y = p2.y - (p3.y - p1.y) / 6;
		segments.push(
			`C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`,
		);
	}
	return `M ${first.x.toFixed(2)} ${first.y.toFixed(2)} ${segments.join(" ")}`;
}

function generateAxes(
	xLabels: string[],
	yTicks: number[],
	yNiceMin: number,
	yNiceMax: number,
	yNiceSpacing: number,
	xAxisLabel?: string,
	yAxisLabel?: string,
): string {
	const yScale = (value: number): number =>
		MARGIN_TOP + (1 - (value - yNiceMin) / (yNiceMax - yNiceMin)) * PLOT_H;

	const slotWidth = PLOT_W / Math.max(1, xLabels.length - 1);

	const gridLines = yTicks
		.map((tick) => {
			const y = yScale(tick);
			return `    <line class="gridline" x1="${MARGIN_LEFT}" y1="${y}" x2="${MARGIN_LEFT + PLOT_W}" y2="${y}"/>`;
		})
		.join("\n");

	const yLabels = yTicks
		.map((tick) => {
			const y = yScale(tick);
			return `    <text class="axis-label" text-anchor="end" x="${MARGIN_LEFT - 6}" y="${y + 3}">${formatTick(tick, yNiceSpacing)}</text>`;
		})
		.join("\n");

	const xTicks = xLabels
		.map((label, i) => {
			const x = MARGIN_LEFT + i * slotWidth;
			return `    <text class="x-axis-label" text-anchor="middle" x="${x}" y="${MARGIN_TOP + PLOT_H + 16}">${escapeHtml(label)}</text>`;
		})
		.join("\n");

	const axisLines = `
    <line class="axis-line" x1="${MARGIN_LEFT}" y1="${MARGIN_TOP + PLOT_H}" x2="${MARGIN_LEFT + PLOT_W}" y2="${MARGIN_TOP + PLOT_H}"/>
    <line class="axis-line" x1="${MARGIN_LEFT}" y1="${MARGIN_TOP}" x2="${MARGIN_LEFT}" y2="${MARGIN_TOP + PLOT_H}"/>`;

	const yTitle = yAxisLabel
		? `\n    <text class="axis-title" text-anchor="middle" transform="rotate(-90)" x="${-(MARGIN_TOP + PLOT_H / 2)}" y="16">${escapeHtml(yAxisLabel)}</text>`
		: "";
	const xTitle = xAxisLabel
		? `\n    <text class="axis-title" text-anchor="middle" x="${MARGIN_LEFT + PLOT_W / 2}" y="${VIEWBOX_H - 12}">${escapeHtml(xAxisLabel)}</text>`
		: "";

	return `${gridLines}\n${axisLines}\n${yLabels}\n${xTicks}${yTitle}${xTitle}`;
}

function generateBody(content: LineContent): string {
	const xLabels = content.series[0]?.data.map((d) => d.label) ?? [];
	const allValues = content.series.flatMap((s) => s.data.map((d) => d.value));
	const dataMin = Math.min(...allValues);
	const dataMax = Math.max(...allValues);

	// Add a tiny padding so the chart doesn't touch top/bottom of the plot.
	const padding = (dataMax - dataMin) * 0.05;
	const { ticks, niceMin, niceMax, niceSpacing } = niceNumbers(
		dataMin - padding,
		dataMax + padding,
	);

	const yScale = (v: number): number =>
		MARGIN_TOP + (1 - (v - niceMin) / (niceMax - niceMin)) * PLOT_H;

	const axesSvg = generateAxes(
		xLabels,
		ticks,
		niceMin,
		niceMax,
		niceSpacing,
		content.xAxisLabel,
		content.yAxisLabel,
	);

	const curve = content.curve ?? "linear";
	const showMarks = content.showMarks ?? true;

	const seriesSvg = content.series
		.map((series, i) => {
			const points = plotSeries(series, xLabels, yScale);
			const color = seriesColor(i, series.color);
			const path = curve === "smooth" ? smoothPath(points) : linearPath(points);
			const pathSvg = `    <path class="line-path" d="${path}" stroke="${color}"/>`;

			if (!showMarks) return pathSvg;

			const marks = points
				.map((p) => {
					const tip = `${series.name} @ ${p.label}: ${p.value}`;
					return `    <circle class="line-mark" cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" r="3" fill="${color}"><title>${escapeHtml(tip)}</title></circle>`;
				})
				.join("\n");
			return `${pathSvg}\n${marks}`;
		})
		.join("\n");

	const ariaLabel = `Line chart with ${content.series.length} series across ${xLabels.length} points.`;

	return `<svg class="chart-svg" viewBox="0 0 ${VIEWBOX_W} ${VIEWBOX_H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${escapeHtml(ariaLabel)}">
${axesSvg}
${seriesSvg}
</svg>`;
}

export interface LineRenderInput {
	title: string;
	subtitle?: string;
	content: LineContent;
}

export function renderLineBody({ content }: LineRenderInput): {
	chartHtml: string;
	chartCss: string;
	legendHtml?: string;
} {
	const result: { chartHtml: string; chartCss: string; legendHtml?: string } = {
		chartHtml: generateBody(content),
		chartCss: LINE_CSS,
	};
	if (!content.hideLegend && content.series.length > 1) {
		result.legendHtml = renderLegend(
			content.series.map((s, i) => ({ label: s.name, color: seriesColor(i, s.color) })),
		);
	}
	return result;
}
