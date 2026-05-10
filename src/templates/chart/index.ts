/**
 * Public entry for the type:"chart" PI tool route (v0.2 slice 3).
 *
 * Dispatches to per-type chart renderers based on the ChartContent
 * discriminator, wraps the result in the standard chart HTML shell
 * (header + main + style block + aesthetic CSS).
 */

import type { FgraphAesthetic } from "../../types.js";
import { loadAestheticCss, renderChartShell } from "./_shared.js";
import { renderBarBody } from "./bar.js";
import { renderInteractiveBarBody } from "./interactive-bar.js";
import { renderInteractiveLineBody } from "./interactive-line.js";
import { renderLineBody } from "./line.js";
import { renderPieBody } from "./pie.js";
import { renderTableBody } from "./table.js";

export {
	parseChartContent,
	SUPPORTED_CHARTS,
	type BarContent,
	type BarSeries,
	type ChartContent,
	type DataPoint,
	type InteractiveBarContent,
	type InteractiveLineContent,
	type LineContent,
	type LineSeries,
	type PieContent,
	type PieSlice,
	type SupportedChart,
	type TableColumn,
	type TableContent,
	type TableRow,
} from "./schemas.js";

import type { ChartContent } from "./schemas.js";

export interface GenerateChartInput {
	title: string;
	subtitle?: string;
	content: ChartContent;
	aesthetic: FgraphAesthetic;
}

const CHART_LABEL: Record<ChartContent["chart"], string> = {
	bar: "Bar chart",
	pie: "Pie chart",
	line: "Line chart",
	table: "Comparison table",
	"interactive-bar": "Interactive bar chart",
	"interactive-line": "Interactive line chart",
};

/**
 * Render a single-file HTML chart from typed ChartContent. Returns the
 * complete HTML string; the caller writes it to disk + opens in browser
 * (see writeHtmlFile + openInBrowser in src/index.ts).
 */
export function generateChartTemplate(input: GenerateChartInput): string {
	const { title, subtitle, content, aesthetic } = input;
	const aestheticCss = loadAestheticCss(aesthetic);

	let result: { chartHtml: string; chartCss: string; legendHtml?: string };
	let scripts: string[] | undefined;

	switch (content.chart) {
		case "bar":
			result = renderBarBody({ title, content });
			break;
		case "pie":
			result = renderPieBody({ title, content });
			break;
		case "line":
			result = renderLineBody({ title, content });
			break;
		case "table":
			result = renderTableBody({ title, content });
			break;
		case "interactive-bar": {
			const r = renderInteractiveBarBody({ content });
			result = {
				chartHtml: r.chartHtml,
				chartCss: r.chartCss,
				...(r.legendHtml !== undefined && { legendHtml: r.legendHtml }),
			};
			scripts = r.scripts;
			break;
		}
		case "interactive-line": {
			const r = renderInteractiveLineBody({ content });
			result = {
				chartHtml: r.chartHtml,
				chartCss: r.chartCss,
				...(r.legendHtml !== undefined && { legendHtml: r.legendHtml }),
			};
			scripts = r.scripts;
			break;
		}
	}

	return renderChartShell({
		title,
		eyebrow: `Lumen · ${CHART_LABEL[content.chart]}`,
		subtitle,
		aestheticCss,
		chartCss: result.chartCss,
		chartHtml: result.chartHtml,
		legendHtml: result.legendHtml,
		scripts,
	});
}
