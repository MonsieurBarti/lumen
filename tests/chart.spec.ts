import { describe, expect, it } from "vitest";

import {
	type ChartContent,
	SUPPORTED_CHARTS,
	generateChartTemplate,
	parseChartContent,
} from "../src/templates/chart/index.js";

/* ────────────────────────────────────────────────────────────────────
   parseChartContent — schema validation
   ──────────────────────────────────────────────────────────────────── */

describe("parseChartContent", () => {
	it("rejects non-object input", () => {
		expect(() => parseChartContent(null)).toThrow(/plain object/);
		expect(() => parseChartContent("nope")).toThrow(/plain object/);
		expect(() => parseChartContent(42)).toThrow(/plain object/);
		expect(() => parseChartContent([])).toThrow(/not an array/);
	});

	it("rejects unknown chart type", () => {
		expect(() => parseChartContent({ chart: "spaghetti" })).toThrow(/chart/);
		expect(() => parseChartContent({})).toThrow(/chart/);
	});

	it("lists the 4 supported chart types in error", () => {
		try {
			parseChartContent({ chart: "spaghetti" });
		} catch (e) {
			const msg = e instanceof Error ? e.message : String(e);
			for (const t of SUPPORTED_CHARTS) {
				expect(msg).toContain(t);
			}
		}
	});

	describe("bar", () => {
		const valid: ChartContent = {
			chart: "bar",
			series: [
				{
					name: "Revenue",
					data: [
						{ label: "Q1", value: 10 },
						{ label: "Q2", value: 20 },
					],
				},
			],
		};

		it("accepts a minimal valid bar", () => {
			const parsed = parseChartContent(valid);
			expect(parsed.chart).toBe("bar");
		});

		it("rejects 0 series", () => {
			expect(() => parseChartContent({ chart: "bar", series: [] })).toThrow(/at least 1/);
		});

		it("rejects more than 8 series", () => {
			const nine = Array.from({ length: 9 }, (_, i) => ({
				name: `S${i}`,
				data: [
					{ label: "A", value: 1 },
					{ label: "B", value: 2 },
				],
			}));
			expect(() => parseChartContent({ chart: "bar", series: nine })).toThrow(/at most 8/);
		});

		it("rejects mismatched x labels across series", () => {
			expect(() =>
				parseChartContent({
					chart: "bar",
					series: [
						{
							name: "A",
							data: [
								{ label: "Q1", value: 1 },
								{ label: "Q2", value: 2 },
							],
						},
						{
							name: "B",
							data: [
								{ label: "Q1", value: 1 },
								{ label: "Q3", value: 2 },
							],
						},
					],
				}),
			).toThrow(/labels must match/);
		});

		it("rejects horizontal direction in slice 3", () => {
			expect(() => parseChartContent({ ...valid, direction: "horizontal" })).toThrow(
				/not supported in slice 3/,
			);
		});

		it("rejects bad variant", () => {
			expect(() => parseChartContent({ ...valid, variant: "donut" })).toThrow(/variant/);
		});

		it("rejects bad hex color", () => {
			expect(() =>
				parseChartContent({
					chart: "bar",
					series: [
						{
							name: "A",
							color: "red",
							data: [
								{ label: "x", value: 1 },
								{ label: "y", value: 2 },
							],
						},
					],
				}),
			).toThrow(/hex color/);
		});

		it("accepts a valid 6-digit hex color", () => {
			const parsed = parseChartContent({
				chart: "bar",
				series: [
					{
						name: "A",
						color: "#abcdef",
						data: [
							{ label: "x", value: 1 },
							{ label: "y", value: 2 },
						],
					},
				],
			});
			if (parsed.chart === "bar") {
				expect(parsed.series[0]?.color).toBe("#abcdef");
			}
		});
	});

	describe("pie", () => {
		const valid: ChartContent = {
			chart: "pie",
			slices: [
				{ label: "A", value: 30 },
				{ label: "B", value: 70 },
			],
		};

		it("accepts a minimal valid pie", () => {
			const parsed = parseChartContent(valid);
			expect(parsed.chart).toBe("pie");
		});

		it("rejects fewer than 2 slices", () => {
			expect(() =>
				parseChartContent({ chart: "pie", slices: [{ label: "Solo", value: 100 }] }),
			).toThrow(/at least 2/);
		});

		it("rejects more than 12 slices", () => {
			const thirteen = Array.from({ length: 13 }, (_, i) => ({ label: `S${i}`, value: 1 }));
			expect(() => parseChartContent({ chart: "pie", slices: thirteen })).toThrow(/at most 12/);
		});

		it("rejects negative slice value", () => {
			expect(() =>
				parseChartContent({
					chart: "pie",
					slices: [
						{ label: "A", value: -5 },
						{ label: "B", value: 10 },
					],
				}),
			).toThrow(/non-negative/);
		});

		it("rejects all-zero slices", () => {
			expect(() =>
				parseChartContent({
					chart: "pie",
					slices: [
						{ label: "A", value: 0 },
						{ label: "B", value: 0 },
					],
				}),
			).toThrow(/positive total/);
		});

		it("rejects innerRadius outside [0, 1)", () => {
			expect(() => parseChartContent({ ...valid, innerRadius: 1 })).toThrow(/\[0, 1\)/);
			expect(() => parseChartContent({ ...valid, innerRadius: -0.1 })).toThrow(/\[0, 1\)/);
		});
	});

	describe("line", () => {
		const valid: ChartContent = {
			chart: "line",
			series: [
				{
					name: "Latency",
					data: [
						{ label: "D1", value: 100 },
						{ label: "D2", value: 110 },
						{ label: "D3", value: 95 },
					],
				},
			],
		};

		it("accepts a minimal valid line", () => {
			const parsed = parseChartContent(valid);
			expect(parsed.chart).toBe("line");
		});

		it("rejects fewer than 3 data points per series", () => {
			expect(() =>
				parseChartContent({
					chart: "line",
					series: [
						{
							name: "A",
							data: [
								{ label: "x", value: 1 },
								{ label: "y", value: 2 },
							],
						},
					],
				}),
			).toThrow(/at least 3/);
		});

		it("rejects bad curve type", () => {
			expect(() => parseChartContent({ ...valid, curve: "bouncy" })).toThrow(/curve/);
		});
	});

	describe("table", () => {
		const valid: ChartContent = {
			chart: "table",
			columns: [
				{ key: "name", label: "Name" },
				{ key: "score", label: "Score", type: "number" },
			],
			rows: [
				{ name: "alpha", score: 90 },
				{ name: "beta", score: 70 },
			],
		};

		it("accepts a minimal valid table", () => {
			const parsed = parseChartContent(valid);
			expect(parsed.chart).toBe("table");
		});

		it("rejects duplicate column keys", () => {
			expect(() =>
				parseChartContent({
					chart: "table",
					columns: [
						{ key: "x", label: "X" },
						{ key: "x", label: "Other X" },
					],
					rows: [{ x: 1 }],
				}),
			).toThrow(/unique/);
		});

		it("rejects rows missing a declared column", () => {
			expect(() =>
				parseChartContent({
					chart: "table",
					columns: [
						{ key: "a", label: "A" },
						{ key: "b", label: "B" },
					],
					rows: [{ a: "x" }],
				}),
			).toThrow(/required/);
		});

		it("rejects non-number cell in number column", () => {
			expect(() =>
				parseChartContent({
					chart: "table",
					columns: [
						{ key: "score", label: "Score", type: "number" },
						{ key: "name", label: "Name" },
					],
					rows: [{ score: "high", name: "x" }],
				}),
			).toThrow(/finite number/);
		});

		it("rejects unknown verdict value", () => {
			expect(() =>
				parseChartContent({
					chart: "table",
					columns: [
						{ key: "v", label: "V", type: "verdict" },
						{ key: "n", label: "N" },
					],
					rows: [{ v: "meh", n: "x" }],
				}),
			).toThrow(/verdict/);
		});
	});
});

/* ────────────────────────────────────────────────────────────────────
   generateChartTemplate — end-to-end render tests
   ──────────────────────────────────────────────────────────────────── */

describe("generateChartTemplate", () => {
	function expectValidHtml(html: string) {
		expect(html).toMatch(/^<!DOCTYPE html>/);
		expect(html).toContain("</html>");
		expect(html).toContain("--bg:");
		expect(html).toContain(".chart-wrap");
		const linkTags = html.match(/<link [^>]*>/g) ?? [];
		for (const tag of linkTags) {
			expect(tag).toMatch(/fonts\.(googleapis|gstatic)/);
		}
	}

	it("renders bar (grouped)", () => {
		const html = generateChartTemplate({
			title: "Quarterly revenue",
			content: {
				chart: "bar",
				series: [
					{
						name: "Enterprise",
						data: [
							{ label: "Q1", value: 12 },
							{ label: "Q2", value: 18 },
							{ label: "Q3", value: 22 },
						],
					},
					{
						name: "SMB",
						data: [
							{ label: "Q1", value: 5 },
							{ label: "Q2", value: 7 },
							{ label: "Q3", value: 9 },
						],
					},
				],
			},
			aesthetic: "dark-professional",
		});
		expectValidHtml(html);
		expect(html).toContain("Quarterly revenue");
		expect(html).toContain('class="bar-rect"');
		// Multi-series → legend rendered.
		expect(html).toContain("chart-legend");
		expect(html).toContain("Enterprise");
	});

	it("renders bar (stacked) without separate gridlines per series", () => {
		const html = generateChartTemplate({
			title: "Stacked",
			content: {
				chart: "bar",
				variant: "stacked",
				series: [
					{
						name: "A",
						data: [
							{ label: "x", value: 5 },
							{ label: "y", value: 10 },
						],
					},
					{
						name: "B",
						data: [
							{ label: "x", value: 3 },
							{ label: "y", value: 4 },
						],
					},
				],
			},
			aesthetic: "blueprint",
		});
		expectValidHtml(html);
		// Stacked: same number of bars as grouped but stacked vertically.
		const bars = html.match(/class="bar-rect"/g);
		expect(bars?.length).toBe(4); // 2 categories × 2 series
	});

	it("renders pie with computed slice paths and inline percentage labels", () => {
		const html = generateChartTemplate({
			title: "Allocation",
			content: {
				chart: "pie",
				slices: [
					{ label: "A", value: 50 },
					{ label: "B", value: 30 },
					{ label: "C", value: 20 },
				],
			},
			aesthetic: "dark-professional",
		});
		expectValidHtml(html);
		expect(html).toContain('class="pie-slice"');
		// 3 slices → 3 paths.
		const paths = html.match(/class="pie-slice"/g);
		expect(paths?.length).toBe(3);
		// Inline label for slices ≥ 6%.
		expect(html).toContain('class="pie-slice-label"');
		// Legend includes percentages.
		expect(html).toMatch(/A — \d+\.\d%/);
	});

	it("renders pie as donut when innerRadius > 0", () => {
		const pie = generateChartTemplate({
			title: "Pie",
			content: {
				chart: "pie",
				slices: [
					{ label: "A", value: 60 },
					{ label: "B", value: 40 },
				],
			},
			aesthetic: "dark-professional",
		});
		const donut = generateChartTemplate({
			title: "Donut",
			content: {
				chart: "pie",
				innerRadius: 0.55,
				slices: [
					{ label: "A", value: 60 },
					{ label: "B", value: 40 },
				],
			},
			aesthetic: "dark-professional",
		});
		// Pie path uses M cx cy L (line to outer); donut has no L cx cy.
		expect(pie).toContain(`M ${(60 + (800 - 60 - 40) / 2).toFixed(2)}`);
		// Both render successfully.
		expect(donut).toContain('class="pie-slice"');
	});

	it("renders line (linear) with marks by default", () => {
		const html = generateChartTemplate({
			title: "Latency",
			content: {
				chart: "line",
				series: [
					{
						name: "p50",
						data: [
							{ label: "D1", value: 40 },
							{ label: "D2", value: 45 },
							{ label: "D3", value: 42 },
							{ label: "D4", value: 48 },
						],
					},
				],
			},
			aesthetic: "dark-professional",
		});
		expectValidHtml(html);
		expect(html).toContain('class="line-path"');
		// Linear path uses M and L commands only.
		expect(html).toMatch(/d="M [\d.]+ [\d.]+ L [\d.]+/);
		// Default showMarks=true → 4 circles.
		const marks = html.match(/class="line-mark"/g);
		expect(marks?.length).toBe(4);
	});

	it("renders line (smooth) with cubic Bezier control points", () => {
		const html = generateChartTemplate({
			title: "Smooth",
			content: {
				chart: "line",
				curve: "smooth",
				series: [
					{
						name: "x",
						data: [
							{ label: "a", value: 1 },
							{ label: "b", value: 5 },
							{ label: "c", value: 3 },
							{ label: "d", value: 7 },
						],
					},
				],
			},
			aesthetic: "dark-professional",
		});
		expectValidHtml(html);
		// Smooth uses C (cubic) commands.
		expect(html).toMatch(/class="line-path"[^>]+d="M [\d.]+ [\d.]+ C /);
	});

	it("respects showMarks=false", () => {
		const html = generateChartTemplate({
			title: "No marks",
			content: {
				chart: "line",
				showMarks: false,
				series: [
					{
						name: "x",
						data: [
							{ label: "a", value: 1 },
							{ label: "b", value: 2 },
							{ label: "c", value: 3 },
						],
					},
				],
			},
			aesthetic: "dark-professional",
		});
		// .line-mark CSS class definition is always inlined; no <circle> mark
		// elements should be emitted.
		expect(html).not.toContain('class="line-mark"');
	});

	it("renders table with min/max highlighting", () => {
		const html = generateChartTemplate({
			title: "Comparison",
			content: {
				chart: "table",
				columns: [
					{ key: "name", label: "Name" },
					{ key: "score", label: "Score", type: "number", highlight: true },
				],
				rows: [
					{ name: "a", score: 50 },
					{ name: "b", score: 95 },
					{ name: "c", score: 30 },
				],
			},
			aesthetic: "blueprint",
		});
		expectValidHtml(html);
		expect(html).toContain('class="lumen-table"');
		// b has max (95) → cell-max class
		expect(html).toMatch(/cell-max[^>]*>95/);
		// c has min (30) → cell-min class
		expect(html).toMatch(/cell-min[^>]*>30/);
	});

	it("renders table with verdict pills", () => {
		const html = generateChartTemplate({
			title: "Verdicts",
			content: {
				chart: "table",
				columns: [
					{ key: "feature", label: "Feature" },
					{ key: "verdict", label: "Verdict", type: "verdict" },
				],
				rows: [
					{ feature: "auth", verdict: "good" },
					{ feature: "search", verdict: "caution" },
					{ feature: "checkout", verdict: "bad" },
				],
			},
			aesthetic: "dark-professional",
		});
		expect(html).toContain('class="verdict good"');
		expect(html).toContain('class="verdict caution"');
		expect(html).toContain('class="verdict bad"');
	});

	it("escapes HTML in titles and cell values", () => {
		const html = generateChartTemplate({
			title: "<script>alert(1)</script>",
			content: {
				chart: "table",
				columns: [
					{ key: "x", label: "X" },
					{ key: "y", label: "Y" },
				],
				rows: [{ x: "<img onerror=alert(1)>", y: "ok" }],
			},
			aesthetic: "dark-professional",
		});
		expect(html).not.toContain("<script>alert");
		expect(html).not.toContain("<img onerror");
		expect(html).toContain("&lt;script&gt;");
	});

	it("loads each of the 5 fgraph aesthetics for chart output", () => {
		const aesthetics = ["blueprint", "dark-professional", "editorial", "lyra", "terminal"] as const;
		for (const aesthetic of aesthetics) {
			const html = generateChartTemplate({
				title: `Aesthetic: ${aesthetic}`,
				content: {
					chart: "bar",
					series: [
						{
							name: "x",
							data: [
								{ label: "a", value: 1 },
								{ label: "b", value: 2 },
							],
						},
					],
				},
				aesthetic,
			});
			expect(html).toContain(`Aesthetic: ${aesthetic}`);
			expect(html).toMatch(/--bg:\s*#/);
		}
	});
});
