/**
 * Targeted tests to cover the optional-field ternaries that the
 * existing diagram + chart + mermaid suites leave on one side. See the
 * coverage report on `main` after PR #10 — branch coverage dropped to
 * ~76% because many `prop ? render : ""` branches only exercise one
 * side. Each test below names the source location it covers.
 */

import { describe, expect, it } from "vitest";

import { generateArchitectureTemplate } from "../src/templates/architecture.js";
import { seriesColor } from "../src/templates/chart/_shared.js";
import { generateChartTemplate } from "../src/templates/chart/index.js";
import { generateDiagramTemplate } from "../src/templates/diagram/index.js";
import { generateMermaidTemplate } from "../src/templates/mermaid.js";

/* ────────────────────────────────────────────────────────────────────
   diagram/_shared.ts — renderDocumentShell subtitle ternary (line 132)
   ──────────────────────────────────────────────────────────────────── */

describe("diagram shell — subtitle branch", () => {
	it("renders subtitle paragraph when subtitle is provided", () => {
		const html = generateDiagramTemplate({
			title: "With subtitle",
			subtitle: "An explanatory subtitle line",
			content: {
				topology: "linear-flow",
				stages: [{ name: "A" }, { name: "B" }],
			},
			aesthetic: "blueprint",
		});
		expect(html).toContain("header-subtitle");
		expect(html).toContain("An explanatory subtitle line");
	});

	it("omits subtitle paragraph when subtitle is absent", () => {
		const html = generateDiagramTemplate({
			title: "No subtitle",
			content: {
				topology: "linear-flow",
				stages: [{ name: "A" }, { name: "B" }],
			},
			aesthetic: "blueprint",
		});
		// `header-subtitle` is the CSS class name (always present in inlined CSS);
		// the *element* `<p class="header-subtitle">` only appears when subtitle is set.
		expect(html).not.toMatch(/<p class="header-subtitle"/);
	});
});

/* ────────────────────────────────────────────────────────────────────
   diagram nodes — optional tone / sub / subMuted absent branches
   (layered.ts, radial-hub.ts, linear-flow.ts, sequence.ts)
   ──────────────────────────────────────────────────────────────────── */

describe("diagram nodes — bare nodes without optional fields", () => {
	it("layered: renders nodes without tone / sub / subMuted", () => {
		const html = generateDiagramTemplate({
			title: "Bare layered",
			content: {
				topology: "layered",
				layers: [
					{ label: "L1", nodes: [{ name: "A" }] },
					{ label: "L2", nodes: [{ name: "B" }, { name: "C" }] },
				],
			},
			aesthetic: "blueprint",
		});
		expect(html).toContain("Bare layered");
		// No sub / subMuted blocks present.
		// `fgraph-sub` is a CSS class (always in inlined CSS); the actual
		// `<div class="fgraph-sub">` element only appears when sub/subMuted set.
		expect(html).not.toMatch(/<div class="fgraph-sub/);
	});

	it("layered: renders nodes WITH sub + subMuted (truthy branches)", () => {
		const html = generateDiagramTemplate({
			title: "Decorated layered",
			content: {
				topology: "layered",
				layers: [
					{
						label: "L1",
						nodes: [{ name: "A", tone: "cyan", sub: "primary", subMuted: "auxiliary" }],
					},
				],
			},
			aesthetic: "blueprint",
		});
		expect(html).toContain("fgraph-sub");
		expect(html).toContain("primary");
		expect(html).toContain("auxiliary");
		expect(html).toContain("muted");
	});

	it("radial-hub: bare hub + spokes without optional fields", () => {
		const html = generateDiagramTemplate({
			title: "Bare hub",
			content: {
				topology: "radial-hub",
				hub: { name: "Core" },
				spokes: [
					{ name: "S1", position: "top" },
					{ name: "S2", position: "right" },
				],
			},
			aesthetic: "blueprint",
		});
		expect(html).toContain("Core");
		// `fgraph-sub` is a CSS class (always in inlined CSS); the actual
		// `<div class="fgraph-sub">` element only appears when sub/subMuted set.
		expect(html).not.toMatch(/<div class="fgraph-sub/);
	});

	it("radial-hub: hub + spokes with sub + subMuted populated", () => {
		const html = generateDiagramTemplate({
			title: "Decorated hub",
			content: {
				topology: "radial-hub",
				hub: { name: "Core", sub: "the hub", subMuted: "central" },
				spokes: [{ name: "S1", position: "top", sub: "first", subMuted: "alpha" }],
			},
			aesthetic: "blueprint",
		});
		expect(html).toContain("the hub");
		expect(html).toContain("central");
		expect(html).toContain("first");
		expect(html).toContain("alpha");
	});

	it("linear-flow: bare stages without tone / sub / subMuted", () => {
		const html = generateDiagramTemplate({
			title: "Bare flow",
			content: {
				topology: "linear-flow",
				stages: [{ name: "A" }, { name: "B" }, { name: "C" }],
			},
			aesthetic: "blueprint",
		});
		expect(html).toContain("Bare flow");
		// `fgraph-sub` is a CSS class (always in inlined CSS); the actual
		// `<div class="fgraph-sub">` element only appears when sub/subMuted set.
		expect(html).not.toMatch(/<div class="fgraph-sub/);
	});

	it("linear-flow: stages with sub + subMuted populated", () => {
		const html = generateDiagramTemplate({
			title: "Decorated flow",
			content: {
				topology: "linear-flow",
				stages: [
					{ name: "A", tone: "cyan", sub: "input", subMuted: "user" },
					{ name: "B", tone: "amber", sub: "output", subMuted: "json" },
				],
			},
			aesthetic: "blueprint",
		});
		expect(html).toContain("input");
		expect(html).toContain("output");
	});
});

/* ────────────────────────────────────────────────────────────────────
   diagram edges — optional label + explicit edges array
   ──────────────────────────────────────────────────────────────────── */

describe("diagram edges — label + explicit-edges branches", () => {
	it("layered: explicit edges with labels (covers label-truthy branch)", () => {
		const html = generateDiagramTemplate({
			title: "Layered explicit",
			content: {
				topology: "layered",
				layers: [
					{ label: "L1", nodes: [{ name: "A" }] },
					{ label: "L2", nodes: [{ name: "B" }] },
					{ label: "L3", nodes: [{ name: "C" }] },
				],
				edges: [
					{ fromLayer: 0, toLayer: 1, semantic: "control", label: "step one" },
					{ fromLayer: 1, toLayer: 2, semantic: "data" },
				],
			},
			aesthetic: "blueprint",
		});
		expect(html).toContain("step one");
		expect(html).toContain("fgraph-lbl");
	});

	it("linear-flow: explicit edges (covers non-implicit branch)", () => {
		const html = generateDiagramTemplate({
			title: "Linear explicit",
			content: {
				topology: "linear-flow",
				stages: [{ name: "A" }, { name: "B" }, { name: "C" }],
				edges: [
					{ from: 0, to: 1, semantic: "data", label: "labelled" },
					{ from: 1, to: 2, semantic: "control" },
				],
			},
			aesthetic: "blueprint",
		});
		expect(html).toContain("labelled");
	});
});

/* ────────────────────────────────────────────────────────────────────
   radial-hub direction — out / in / both branches (lines 189-191)
   ──────────────────────────────────────────────────────────────────── */

describe("radial-hub spoke direction", () => {
	it("renders spokes with direction:'out' (marker-end only)", () => {
		const html = generateDiagramTemplate({
			title: "Out-only",
			content: {
				topology: "radial-hub",
				hub: { name: "H" },
				spokes: [{ name: "S", position: "top", direction: "out" }],
			},
			aesthetic: "blueprint",
		});
		expect(html).toMatch(/marker-end="url\(#fg-arr-\w+\)"/);
		// 'out' should NOT add the bidirectional marker-start.
		expect(html).not.toMatch(/marker-start="url\(#fg-arr-\w+-bi\)"/);
	});

	it("renders spokes with direction:'in' (marker-start with -bi)", () => {
		const html = generateDiagramTemplate({
			title: "In-only",
			content: {
				topology: "radial-hub",
				hub: { name: "H" },
				spokes: [{ name: "S", position: "right", direction: "in" }],
			},
			aesthetic: "blueprint",
		});
		expect(html).toMatch(/marker-start="url\(#fg-arr-\w+-bi\)"/);
	});

	it("renders spokes with direction:'both' (both bi-markers)", () => {
		const html = generateDiagramTemplate({
			title: "Bi",
			content: {
				topology: "radial-hub",
				hub: { name: "H" },
				spokes: [{ name: "S", position: "bottom", direction: "both" }],
			},
			aesthetic: "blueprint",
		});
		expect(html).toMatch(/marker-start="url\(#fg-arr-\w+-bi\)"/);
		expect(html).toMatch(/marker-end="url\(#fg-arr-\w+-bi\)"/);
	});
});

/* ────────────────────────────────────────────────────────────────────
   sequence — legend + tone-resolution branches
   ──────────────────────────────────────────────────────────────────── */

describe("sequence — legend + tone-resolution branches", () => {
	it("renders custom legend when provided", () => {
		const html = generateDiagramTemplate({
			title: "Custom legend",
			content: {
				topology: "sequence",
				participants: [
					{ name: "A", tone: "cyan" },
					{ name: "B", tone: "amber" },
				],
				messages: [{ from: 0, to: 1, label: "go" }],
				legend: "→ async dispatch",
			},
			aesthetic: "blueprint",
		});
		expect(html).toContain("→ async dispatch");
	});

	it("falls back to default legend when none provided", () => {
		const html = generateDiagramTemplate({
			title: "Default legend",
			content: {
				topology: "sequence",
				participants: [{ name: "A", tone: "cyan" }, { name: "B" }],
				messages: [{ from: 0, to: 1, label: "go" }],
			},
			aesthetic: "blueprint",
		});
		expect(html).toContain("solid = forward call");
	});

	it("resolves message tone from `to` participant when `from` lacks one", () => {
		// Participant 0 has no tone; participant 1 has cyan. The fromTone
		// branch in resolveMessageTone returns undefined and falls through
		// to the toTone path (sequence.ts:117-120).
		const html = generateDiagramTemplate({
			title: "To-fallback tone",
			content: {
				topology: "sequence",
				participants: [{ name: "Untoned" }, { name: "Cyan", tone: "cyan" }],
				messages: [{ from: 0, to: 1, label: "msg" }],
			},
			aesthetic: "blueprint",
		});
		// Edge tone should resolve to cyan (from the `to` participant).
		expect(html).toMatch(/fg-edge cyan/);
	});

	it("falls back to cyan when neither participant has a tone", () => {
		const html = generateDiagramTemplate({
			title: "Default tone",
			content: {
				topology: "sequence",
				participants: [{ name: "X" }, { name: "Y" }],
				messages: [{ from: 0, to: 1, label: "ping" }],
			},
			aesthetic: "blueprint",
		});
		// Both branches in resolveMessageTone return undefined → default cyan.
		expect(html).toMatch(/fg-edge cyan/);
	});
});

/* ────────────────────────────────────────────────────────────────────
   chart — subtitle + axis labels + single-series legend branches
   ──────────────────────────────────────────────────────────────────── */

describe("chart — optional-field branches", () => {
	it("renders chart subtitle when provided (chart/_shared.ts:151)", () => {
		const html = generateChartTemplate({
			title: "With subtitle",
			subtitle: "Q1 2026 metrics",
			content: {
				chart: "bar",
				series: [
					{
						name: "S",
						data: [
							{ label: "x", value: 1 },
							{ label: "y", value: 2 },
						],
					},
				],
			},
			aesthetic: "blueprint",
		});
		expect(html).toContain("header-subtitle");
		expect(html).toContain("Q1 2026 metrics");
	});

	it("bar chart with x + y axis labels (covers truthy axis branches)", () => {
		const html = generateChartTemplate({
			title: "Axis labels",
			content: {
				chart: "bar",
				xAxisLabel: "quarter",
				yAxisLabel: "revenue ($M)",
				series: [
					{
						name: "S",
						data: [
							{ label: "Q1", value: 5 },
							{ label: "Q2", value: 8 },
						],
					},
				],
			},
			aesthetic: "blueprint",
		});
		expect(html).toContain("axis-title");
		expect(html).toContain("quarter");
		expect(html).toContain("revenue ($M)");
	});

	it("line chart with x + y axis labels", () => {
		const html = generateChartTemplate({
			title: "Line w/ axes",
			content: {
				chart: "line",
				xAxisLabel: "month",
				yAxisLabel: "users",
				series: [
					{
						name: "S",
						data: [
							{ label: "Jan", value: 100 },
							{ label: "Feb", value: 120 },
							{ label: "Mar", value: 140 },
						],
					},
				],
			},
			aesthetic: "blueprint",
		});
		expect(html).toContain("axis-title");
		expect(html).toContain("month");
		expect(html).toContain("users");
	});

	it("line chart with single series (no legend rendered, line.ts:220)", () => {
		const html = generateChartTemplate({
			title: "Single series",
			content: {
				chart: "line",
				series: [
					{
						name: "Solo",
						data: [
							{ label: "Jan", value: 1 },
							{ label: "Feb", value: 2 },
							{ label: "Mar", value: 3 },
						],
					},
				],
			},
			aesthetic: "blueprint",
		});
		// Single-series line skips the legend block.
		// `chart-legend` is a CSS class (always in inlined CSS); the legend
		// element `<div class="chart-legend">` only appears when rendered.
		expect(html).not.toMatch(/<div class="chart-legend/);
	});

	it("line chart with multi-series (legend rendered)", () => {
		const html = generateChartTemplate({
			title: "Multi series",
			content: {
				chart: "line",
				series: [
					{
						name: "A",
						data: [
							{ label: "Jan", value: 1 },
							{ label: "Feb", value: 2 },
						],
					},
					{
						name: "B",
						data: [
							{ label: "Jan", value: 3 },
							{ label: "Feb", value: 4 },
						],
					},
				],
			},
			aesthetic: "blueprint",
		});
		expect(html).toContain("chart-legend");
	});

	it("line chart with hideLegend flag (multi-series, no legend)", () => {
		const html = generateChartTemplate({
			title: "Hidden legend",
			content: {
				chart: "line",
				hideLegend: true,
				series: [
					{
						name: "A",
						data: [
							{ label: "x", value: 1 },
							{ label: "y", value: 2 },
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
		// `chart-legend` is a CSS class (always in inlined CSS); the legend
		// element `<div class="chart-legend">` only appears when rendered.
		expect(html).not.toMatch(/<div class="chart-legend/);
	});

	it("seriesColor returns override when provided", () => {
		expect(seriesColor(0, "#abcdef")).toBe("#abcdef");
		expect(seriesColor(7, "#deadbe")).toBe("#deadbe");
	});

	it("seriesColor cycles palette when no override", () => {
		const c0 = seriesColor(0);
		const c1 = seriesColor(1);
		expect(c0).toMatch(/^#/);
		expect(c1).toMatch(/^#/);
		expect(c0).not.toBe(c1);
	});

	it("table with min/max highlighting (≥3 numeric values per column)", () => {
		const html = generateChartTemplate({
			title: "With highlights",
			content: {
				chart: "table",
				columns: [
					{ key: "name", label: "Name", type: "text" },
					{ key: "score", label: "Score", type: "number", highlight: true },
				],
				rows: [
					{ name: "A", score: 10 },
					{ name: "B", score: 50 },
					{ name: "C", score: 30 },
					{ name: "D", score: 90 },
				],
			},
			aesthetic: "blueprint",
		});
		// At least one cell-min and one cell-max class should appear.
		expect(html).toContain("cell-min");
		expect(html).toContain("cell-max");
	});

	it("table without highlights (no `highlight: true` columns)", () => {
		const html = generateChartTemplate({
			title: "No highlights",
			content: {
				chart: "table",
				columns: [
					{ key: "name", label: "Name", type: "text" },
					{ key: "score", label: "Score", type: "number" },
				],
				rows: [
					{ name: "A", score: 10 },
					{ name: "B", score: 50 },
				],
			},
			aesthetic: "blueprint",
		});
		// `cell-min` / `cell-max` are CSS class names (always in inlined CSS);
		// the actual `class="cell-min"` attribute only appears on highlighted cells.
		expect(html).not.toMatch(/class="[^"]*cell-min/);
		expect(html).not.toMatch(/class="[^"]*cell-max/);
	});
});

/* ────────────────────────────────────────────────────────────────────
   mermaid — caption ternary (mermaid.ts:106)
   ──────────────────────────────────────────────────────────────────── */

describe("mermaid — caption branch", () => {
	it("renders caption paragraph when caption provided", () => {
		const html = generateMermaidTemplate(
			"With caption",
			{
				mermaidSyntax: "graph TD\n  A --> B",
				caption: "An explanatory caption",
			},
			"blueprint",
			true,
		);
		expect(html).toContain('class="caption"');
		expect(html).toContain("An explanatory caption");
	});

	it("omits caption paragraph when caption is absent", () => {
		const html = generateMermaidTemplate(
			"No caption",
			{ mermaidSyntax: "graph TD\n  A --> B" },
			"blueprint",
			true,
		);
		expect(html).not.toContain('class="caption"');
	});
});

/* ────────────────────────────────────────────────────────────────────
   architecture — three-column with + without labelColor (lines 92-93)
   ──────────────────────────────────────────────────────────────────── */

describe("architecture — threeColumn labelColor branches", () => {
	it("renders threeColumn with labelColor on each column", () => {
		const html = generateArchitectureTemplate(
			"Coloured columns",
			{
				sections: [],
				threeColumn: [
					{ label: "Frontend", labelColor: "accent", content: "<p>web</p>" },
					{ label: "Backend", labelColor: "green", content: "<p>api</p>" },
					{ label: "Storage", labelColor: "teal", content: "<p>db</p>" },
				],
			},
			"blueprint",
			true,
		);
		expect(html).toContain("section--accent");
		expect(html).toContain("section--green");
		expect(html).toContain("var(--accent)");
	});

	it("renders threeColumn without labelColor (covers falsy branches at architecture.ts:92-93)", () => {
		const html = generateArchitectureTemplate(
			"Uncoloured",
			{
				sections: [],
				threeColumn: [
					{ label: "A", content: "<p>a</p>" },
					{ label: "B", content: "<p>b</p>" },
					{ label: "C", content: "<p>c</p>" },
				],
			},
			"blueprint",
			true,
		);
		// Falsy labelColor → empty class string + var(--text-dim) fallback.
		expect(html).toContain("var(--text-dim)");
		// No element actually applies the section--<color> classes (CSS class
		// definitions exist in the stylesheet regardless — match the attribute).
		expect(html).not.toMatch(/class="[^"]*section--(accent|green|orange|teal|plum)/);
	});
});
