/**
 * Interactive bar chart renderer using Chart.js (CDN).
 * Returns chart HTML + CSS for the deterministic chart shell.
 */

import { renderLegend, seriesColor } from "./_shared.js";
import type { InteractiveBarContent } from "./schemas.js";

const CDN_SCRIPT = `<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>`;

export interface InteractiveChartResult {
	chartHtml: string;
	chartCss: string;
	legendHtml?: string;
	scripts: string[];
}

export function renderInteractiveBarBody({
	content,
}: {
	content: InteractiveBarContent;
}): InteractiveChartResult {
	const labels = content.series[0]?.data.map((d) => d.label) ?? [];
	const datasets = content.series.map((s, i) => ({
		label: s.name,
		data: s.data.map((d) => d.value),
		backgroundColor: seriesColor(i, s.color),
	}));

	const chartConfig = {
		type: content.variant === "stacked" ? "bar" : "bar",
		data: {
			labels,
			datasets,
		},
		options: {
			responsive: true,
			maintainAspectRatio: true,
			plugins: {
				legend: {
					display: !content.hideLegend,
				},
			},
			scales: {
				x: {
					title: {
						display: !!content.xAxisLabel,
						text: content.xAxisLabel,
					},
					stacked: content.variant === "stacked",
				},
				y: {
					title: {
						display: !!content.yAxisLabel,
						text: content.yAxisLabel,
					},
					stacked: content.variant === "stacked",
					beginAtZero: true,
				},
			},
		},
	};

	const canvasId = `chart-${Math.random().toString(36).slice(2, 9)}`;
	const chartHtml = `<canvas id="${canvasId}" class="chart-canvas"></canvas>`;
	const initScript = `<script>
(function() {
  const ctx = document.getElementById('${canvasId}').getContext('2d');
  new Chart(ctx, ${JSON.stringify(chartConfig)});
})();
</script>`;

	const chartCss = `
  .chart-canvas {
    width: 100%;
    height: 400px;
    display: block;
  }`;

	const legendHtml = content.hideLegend
		? undefined
		: renderLegend(
				content.series.map((s, i) => ({
					label: s.name,
					color: seriesColor(i, s.color),
				})),
			);

	return {
		chartHtml,
		chartCss,
		...(legendHtml !== undefined && { legendHtml }),
		scripts: [CDN_SCRIPT, initScript],
	};
}
