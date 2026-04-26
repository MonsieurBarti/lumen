/* Smoke test — render one HTML file per chart type + open them in the browser. */
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";

import { type ChartContent, generateChartTemplate } from "../src/templates/chart/index.js";

const outputs: Array<{ name: string; title: string; subtitle?: string; content: ChartContent }> = [
	{
		name: "smoke-bar-grouped.html",
		title: "Quarterly revenue 2025",
		subtitle: "Revenue by segment, in $M (grouped bars)",
		content: {
			chart: "bar",
			variant: "grouped",
			yAxisLabel: "Revenue ($M)",
			series: [
				{
					name: "Enterprise",
					data: [
						{ label: "Q1", value: 12.4 },
						{ label: "Q2", value: 15.8 },
						{ label: "Q3", value: 18.2 },
						{ label: "Q4", value: 22.1 },
					],
				},
				{
					name: "SMB",
					data: [
						{ label: "Q1", value: 8.1 },
						{ label: "Q2", value: 9.2 },
						{ label: "Q3", value: 11.5 },
						{ label: "Q4", value: 13.7 },
					],
				},
				{
					name: "Self-serve",
					data: [
						{ label: "Q1", value: 4.2 },
						{ label: "Q2", value: 5.6 },
						{ label: "Q3", value: 7.8 },
						{ label: "Q4", value: 9.4 },
					],
				},
			],
		},
	},
	{
		name: "smoke-bar-stacked.html",
		title: "Issue throughput by severity",
		subtitle: "Stacked count per week",
		content: {
			chart: "bar",
			variant: "stacked",
			yAxisLabel: "Issues",
			series: [
				{
					name: "P0",
					color: "#fb7185",
					data: [
						{ label: "W1", value: 2 },
						{ label: "W2", value: 1 },
						{ label: "W3", value: 0 },
						{ label: "W4", value: 1 },
					],
				},
				{
					name: "P1",
					color: "#fbbf24",
					data: [
						{ label: "W1", value: 5 },
						{ label: "W2", value: 7 },
						{ label: "W3", value: 4 },
						{ label: "W4", value: 6 },
					],
				},
				{
					name: "P2",
					color: "#34d399",
					data: [
						{ label: "W1", value: 12 },
						{ label: "W2", value: 14 },
						{ label: "W3", value: 18 },
						{ label: "W4", value: 16 },
					],
				},
			],
		},
	},
	{
		name: "smoke-pie.html",
		title: "Engineering time allocation",
		subtitle: "Q4 2025 (donut, innerRadius=0.55)",
		content: {
			chart: "pie",
			innerRadius: 0.55,
			slices: [
				{ label: "Feature work", value: 42 },
				{ label: "Bug fixes", value: 18 },
				{ label: "Infra / CI", value: 12 },
				{ label: "Code review", value: 14 },
				{ label: "Meetings", value: 10 },
				{ label: "Other", value: 4 },
			],
		},
	},
	{
		name: "smoke-line.html",
		title: "API latency p50 / p95 / p99",
		subtitle: "Last 30 days, in ms (smooth)",
		content: {
			chart: "line",
			curve: "smooth",
			yAxisLabel: "Latency (ms)",
			series: [
				{
					name: "p50",
					data: [
						{ label: "D1", value: 42 },
						{ label: "D5", value: 45 },
						{ label: "D10", value: 41 },
						{ label: "D15", value: 48 },
						{ label: "D20", value: 44 },
						{ label: "D25", value: 46 },
						{ label: "D30", value: 43 },
					],
				},
				{
					name: "p95",
					data: [
						{ label: "D1", value: 180 },
						{ label: "D5", value: 195 },
						{ label: "D10", value: 175 },
						{ label: "D15", value: 220 },
						{ label: "D20", value: 200 },
						{ label: "D25", value: 215 },
						{ label: "D30", value: 190 },
					],
				},
				{
					name: "p99",
					data: [
						{ label: "D1", value: 420 },
						{ label: "D5", value: 480 },
						{ label: "D10", value: 410 },
						{ label: "D15", value: 540 },
						{ label: "D20", value: 470 },
						{ label: "D25", value: 510 },
						{ label: "D30", value: 460 },
					],
				},
			],
		},
	},
	{
		name: "smoke-table.html",
		title: "Diagram renderer comparison",
		subtitle: "v0.2 slice 3 deliverables",
		content: {
			chart: "table",
			columns: [
				{ key: "type", label: "Chart type", type: "text" },
				{ key: "renderer", label: "Renderer", type: "text" },
				{ key: "loc", label: "LOC", type: "number", highlight: true },
				{ key: "tests", label: "Tests", type: "number", highlight: true },
				{ key: "status", label: "Status", type: "verdict" },
			],
			rows: [
				{ type: "bar", renderer: "bar.ts", loc: 195, tests: 9, status: "good" },
				{ type: "pie", renderer: "pie.ts", loc: 145, tests: 7, status: "good" },
				{ type: "line", renderer: "line.ts", loc: 200, tests: 8, status: "good" },
				{ type: "table", renderer: "table.ts", loc: 150, tests: 6, status: "good" },
			],
		},
	},
];

for (const { name, title, subtitle, content } of outputs) {
	const input: {
		title: string;
		subtitle?: string;
		content: ChartContent;
		aesthetic: "dark-professional";
	} = {
		title,
		content,
		aesthetic: "dark-professional",
	};
	if (subtitle !== undefined) input.subtitle = subtitle;
	const html = generateChartTemplate(input);
	const path = `/tmp/${name}`;
	writeFileSync(path, html);
	console.log(`wrote ${path} (${html.length} bytes)`);
}

if (process.argv.includes("--open")) {
	for (const { name } of outputs) {
		spawnSync("open", [`/tmp/${name}`]);
	}
}
