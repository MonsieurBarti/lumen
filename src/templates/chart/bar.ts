/**
 * Bar chart renderer (vertical, grouped or stacked).
 *
 * Layout (chart-recipes.md → Bar):
 *   - Y axis: Nice Numbers from data range, always includes zero
 *   - Bar slot width: plotWidth / categoryCount
 *   - Bar fill width within slot: 70% (gap = 30% of slot)
 *   - Grouped: split slot among series (no extra gap inside group)
 *   - Stacked: cumulative y per category, topmost segment carries the slot
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
import type { BarContent } from "./schemas.js";

const BAR_CSS = `
  .bar-rect { transition: opacity 0.15s; }
  .bar-rect:hover { opacity: 0.75; }
  .bar-category-label {
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    fill: var(--text-dim);
  }`;

interface BarRect {
	x: number;
	y: number;
	width: number;
	height: number;
	color: string;
	tip?: string;
}

function generateBars(content: BarContent): BarRect[] {
	const variant = content.variant ?? "grouped";
	const categories = content.series[0]?.data.map((d) => d.label) ?? [];
	const seriesCount = content.series.length;
	const categoryCount = categories.length;

	// Compute y range, always including zero for honest comparison.
	const allValues =
		variant === "stacked"
			? categories.map((_, ci) =>
					content.series.reduce((sum, s) => sum + (s.data[ci]?.value ?? 0), 0),
				)
			: content.series.flatMap((s) => s.data.map((d) => d.value));

	const dataMin = Math.min(0, ...allValues);
	const dataMax = Math.max(0, ...allValues);
	const { niceMin, niceMax } = niceNumbers(dataMin, dataMax);

	// Y position (px) for a given data value.
	const yScale = (value: number): number =>
		MARGIN_TOP + (1 - (value - niceMin) / (niceMax - niceMin)) * PLOT_H;
	const baselineY = yScale(0);

	const slotWidth = PLOT_W / categoryCount;
	const barFillRatio = 0.7; // 70% of slot is bar(s), 30% is gap
	const groupWidth = slotWidth * barFillRatio;
	const slotPadding = (slotWidth - groupWidth) / 2;

	const rects: BarRect[] = [];

	if (variant === "stacked") {
		// Single bar per category; segments stacked.
		for (let ci = 0; ci < categoryCount; ci++) {
			let cumulative = 0;
			const x = MARGIN_LEFT + ci * slotWidth + slotPadding;
			for (let si = 0; si < seriesCount; si++) {
				const series = content.series[si];
				if (!series) continue;
				const point = series.data[ci];
				if (!point) continue;
				const segTop = yScale(cumulative + point.value);
				const segBot = yScale(cumulative);
				const tip = point.tip ?? `${series.name}: ${point.value}`;
				rects.push({
					x,
					y: Math.min(segTop, segBot),
					width: groupWidth,
					height: Math.abs(segBot - segTop),
					color: seriesColor(si, series.color),
					tip,
				});
				cumulative += point.value;
			}
		}
	} else {
		// Grouped: split slot among series side-by-side.
		const barWidth = groupWidth / seriesCount;
		for (let ci = 0; ci < categoryCount; ci++) {
			for (let si = 0; si < seriesCount; si++) {
				const series = content.series[si];
				if (!series) continue;
				const point = series.data[ci];
				if (!point) continue;
				const x = MARGIN_LEFT + ci * slotWidth + slotPadding + si * barWidth;
				const top = yScale(point.value);
				const bot = baselineY;
				const tip = point.tip ?? `${series.name}: ${point.value}`;
				rects.push({
					x,
					y: Math.min(top, bot),
					width: barWidth,
					height: Math.abs(bot - top),
					color: seriesColor(si, series.color),
					tip,
				});
			}
		}
	}

	return rects;
}

function generateAxes(
	content: BarContent,
	yTicks: number[],
	yNiceMin: number,
	yNiceMax: number,
	yNiceSpacing: number,
): string {
	const categories = content.series[0]?.data.map((d) => d.label) ?? [];
	const slotWidth = PLOT_W / categories.length;

	const yScale = (value: number): number =>
		MARGIN_TOP + (1 - (value - yNiceMin) / (yNiceMax - yNiceMin)) * PLOT_H;

	// Gridlines + Y-axis tick labels
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

	const xLabels = categories
		.map((label, i) => {
			const x = MARGIN_LEFT + i * slotWidth + slotWidth / 2;
			return `    <text class="bar-category-label" text-anchor="middle" x="${x}" y="${MARGIN_TOP + PLOT_H + 16}">${escapeHtml(label)}</text>`;
		})
		.join("\n");

	const axisLines = `
    <line class="axis-line" x1="${MARGIN_LEFT}" y1="${MARGIN_TOP + PLOT_H}" x2="${MARGIN_LEFT + PLOT_W}" y2="${MARGIN_TOP + PLOT_H}"/>
    <line class="axis-line" x1="${MARGIN_LEFT}" y1="${MARGIN_TOP}" x2="${MARGIN_LEFT}" y2="${MARGIN_TOP + PLOT_H}"/>`;

	const yTitle = content.yAxisLabel
		? `\n    <text class="axis-title" text-anchor="middle" transform="rotate(-90)" x="${-(MARGIN_TOP + PLOT_H / 2)}" y="16">${escapeHtml(content.yAxisLabel)}</text>`
		: "";
	const xTitle = content.xAxisLabel
		? `\n    <text class="axis-title" text-anchor="middle" x="${MARGIN_LEFT + PLOT_W / 2}" y="${VIEWBOX_H - 12}">${escapeHtml(content.xAxisLabel)}</text>`
		: "";

	return `${gridLines}\n${axisLines}\n${yLabels}\n${xLabels}${yTitle}${xTitle}`;
}

function generateBody(content: BarContent): string {
	const variant = content.variant ?? "grouped";
	const ariaLabel = `Bar chart, ${variant} variant. ${content.series.length} series across ${content.series[0]?.data.length ?? 0} categories.`;

	// Compute y ticks once (same range used by both axes & bars).
	const allValues =
		variant === "stacked"
			? (content.series[0]?.data.map((_, ci) =>
					content.series.reduce((sum, s) => sum + (s.data[ci]?.value ?? 0), 0),
				) ?? [])
			: content.series.flatMap((s) => s.data.map((d) => d.value));
	const dataMin = Math.min(0, ...allValues);
	const dataMax = Math.max(0, ...allValues);
	const { ticks, niceMin, niceMax, niceSpacing } = niceNumbers(dataMin, dataMax);

	const axesSvg = generateAxes(content, ticks, niceMin, niceMax, niceSpacing);

	const bars = generateBars(content);
	const barsSvg = bars
		.map(
			(b) =>
				`    <rect class="bar-rect" x="${b.x.toFixed(2)}" y="${b.y.toFixed(2)}" width="${b.width.toFixed(2)}" height="${b.height.toFixed(2)}" fill="${b.color}"><title>${escapeHtml(b.tip ?? "")}</title></rect>`,
		)
		.join("\n");

	return `<svg class="chart-svg" viewBox="0 0 ${VIEWBOX_W} ${VIEWBOX_H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${escapeHtml(ariaLabel)}">
${axesSvg}
${barsSvg}
</svg>`;
}

export interface BarRenderInput {
	title: string;
	subtitle?: string;
	content: BarContent;
}

export function renderBarBody({ content }: BarRenderInput): {
	chartHtml: string;
	chartCss: string;
	legendHtml?: string;
} {
	const chartHtml = generateBody(content);
	const result: { chartHtml: string; chartCss: string; legendHtml?: string } = {
		chartHtml,
		chartCss: BAR_CSS,
	};
	if (!content.hideLegend && content.series.length > 1) {
		result.legendHtml = renderLegend(
			content.series.map((s, i) => ({ label: s.name, color: seriesColor(i, s.color) })),
		);
	}
	return result;
}
