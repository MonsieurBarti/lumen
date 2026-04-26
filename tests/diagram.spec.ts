import { describe, expect, it } from "vitest";

import {
	type FgraphContent,
	SUPPORTED_TOPOLOGIES,
	generateDiagramTemplate,
	parseFgraphContent,
} from "../src/templates/diagram/index.js";

/* ────────────────────────────────────────────────────────────────────
   parseFgraphContent — schema validation tests
   ──────────────────────────────────────────────────────────────────── */

describe("parseFgraphContent", () => {
	it("rejects non-object input", () => {
		expect(() => parseFgraphContent(null)).toThrow(/plain object/);
		expect(() => parseFgraphContent("nope")).toThrow(/plain object/);
		expect(() => parseFgraphContent(42)).toThrow(/plain object/);
		expect(() => parseFgraphContent([])).toThrow(/not an array/);
	});

	it("rejects unknown topology", () => {
		expect(() => parseFgraphContent({ topology: "spaghetti" })).toThrow(/topology/);
		expect(() => parseFgraphContent({})).toThrow(/topology/);
	});

	it("lists the 4 supported topologies in error", () => {
		try {
			parseFgraphContent({ topology: "spaghetti" });
		} catch (e) {
			const msg = e instanceof Error ? e.message : String(e);
			for (const t of SUPPORTED_TOPOLOGIES) {
				expect(msg).toContain(t);
			}
		}
	});

	describe("sequence", () => {
		const valid: FgraphContent = {
			topology: "sequence",
			participants: [
				{ name: "Agent", tone: "amber" },
				{ name: "Tool", tone: "cyan" },
			],
			messages: [{ from: 0, to: 1, label: "call()" }],
		};

		it("accepts a minimal valid sequence", () => {
			const parsed = parseFgraphContent(valid);
			expect(parsed.topology).toBe("sequence");
			if (parsed.topology === "sequence") {
				expect(parsed.participants).toHaveLength(2);
				expect(parsed.messages).toHaveLength(1);
			}
		});

		it("rejects fewer than 2 participants", () => {
			expect(() => parseFgraphContent({ ...valid, participants: [{ name: "Solo" }] })).toThrow(
				/at least 2/,
			);
		});

		it("rejects more than 6 participants", () => {
			const seven = Array.from({ length: 7 }, (_, i) => ({ name: `P${i}` }));
			expect(() => parseFgraphContent({ ...valid, participants: seven })).toThrow(/at most 6/);
		});

		it("rejects more than 15 messages", () => {
			const sixteen = Array.from({ length: 16 }, () => ({
				from: 0,
				to: 1,
				label: "x",
			}));
			expect(() => parseFgraphContent({ ...valid, messages: sixteen })).toThrow(/at most 15/);
		});

		it("rejects out-of-range participant indices", () => {
			expect(() =>
				parseFgraphContent({
					...valid,
					messages: [{ from: 0, to: 5, label: "x" }],
				}),
			).toThrow(/index/);
		});

		it("rejects self-message", () => {
			expect(() =>
				parseFgraphContent({
					...valid,
					messages: [{ from: 0, to: 0, label: "x" }],
				}),
			).toThrow(/self-message/);
		});

		it("rejects invalid kind", () => {
			expect(() =>
				parseFgraphContent({
					...valid,
					messages: [{ from: 0, to: 1, label: "x", kind: "shouty" }],
				}),
			).toThrow(/kind/);
		});
	});

	describe("layered", () => {
		const valid: FgraphContent = {
			topology: "layered",
			layers: [
				{ label: "Frontend", nodes: [{ name: "Web" }] },
				{ label: "Backend", nodes: [{ name: "API" }, { name: "Worker" }] },
			],
		};

		it("accepts a minimal valid layered", () => {
			const parsed = parseFgraphContent(valid);
			expect(parsed.topology).toBe("layered");
		});

		it("rejects fewer than 2 layers", () => {
			expect(() =>
				parseFgraphContent({
					topology: "layered",
					layers: [{ label: "Solo", nodes: [{ name: "X" }] }],
				}),
			).toThrow(/at least 2/);
		});

		it("rejects more than 4 nodes per layer", () => {
			expect(() =>
				parseFgraphContent({
					topology: "layered",
					layers: [
						{
							label: "Crowded",
							nodes: [{ name: "A" }, { name: "B" }, { name: "C" }, { name: "D" }, { name: "E" }],
						},
						{ label: "Other", nodes: [{ name: "Y" }] },
					],
				}),
			).toThrow(/at most 4/);
		});

		it("rejects edge with out-of-range layer index", () => {
			expect(() =>
				parseFgraphContent({
					...valid,
					edges: [{ fromLayer: 0, toLayer: 99 }],
				}),
			).toThrow(/index/);
		});
	});

	describe("linear-flow", () => {
		const valid: FgraphContent = {
			topology: "linear-flow",
			stages: [{ name: "A" }, { name: "B" }, { name: "C" }],
		};

		it("accepts a minimal valid linear-flow", () => {
			const parsed = parseFgraphContent(valid);
			expect(parsed.topology).toBe("linear-flow");
		});

		it("rejects fewer than 2 stages", () => {
			expect(() =>
				parseFgraphContent({ topology: "linear-flow", stages: [{ name: "Solo" }] }),
			).toThrow(/at least 2/);
		});

		it("rejects more than 7 stages", () => {
			const eight = Array.from({ length: 8 }, (_, i) => ({ name: `S${i}` }));
			expect(() => parseFgraphContent({ topology: "linear-flow", stages: eight })).toThrow(
				/at most 7/,
			);
		});
	});

	describe("radial-hub", () => {
		const valid: FgraphContent = {
			topology: "radial-hub",
			hub: { name: "Agent", tone: "amber" },
			spokes: [
				{ name: "Search", position: "top" },
				{ name: "Memory", position: "right", shape: "cylinder" },
			],
		};

		it("accepts a minimal valid radial-hub", () => {
			const parsed = parseFgraphContent(valid);
			expect(parsed.topology).toBe("radial-hub");
		});

		it("rejects missing hub", () => {
			expect(() => parseFgraphContent({ topology: "radial-hub", spokes: valid.spokes })).toThrow(
				/hub/,
			);
		});

		it("rejects fewer than 2 spokes", () => {
			expect(() =>
				parseFgraphContent({
					topology: "radial-hub",
					hub: { name: "H" },
					spokes: [{ name: "Lonely", position: "top" }],
				}),
			).toThrow(/at least 2/);
		});

		it("rejects duplicate spoke positions", () => {
			expect(() =>
				parseFgraphContent({
					topology: "radial-hub",
					hub: { name: "H" },
					spokes: [
						{ name: "A", position: "top" },
						{ name: "B", position: "top" },
					],
				}),
			).toThrow(/duplicate position/);
		});

		it("rejects unknown position", () => {
			expect(() =>
				parseFgraphContent({
					topology: "radial-hub",
					hub: { name: "H" },
					spokes: [
						{ name: "A", position: "top" },
						{ name: "B", position: "south-pacific" },
					],
				}),
			).toThrow(/position/);
		});

		it("rejects invalid direction", () => {
			expect(() =>
				parseFgraphContent({
					topology: "radial-hub",
					hub: { name: "H" },
					spokes: [
						{ name: "A", position: "top", direction: "sideways" },
						{ name: "B", position: "right" },
					],
				}),
			).toThrow(/direction/);
		});
	});

	describe("shared field validation", () => {
		it("rejects bad tone in node", () => {
			expect(() =>
				parseFgraphContent({
					topology: "linear-flow",
					stages: [{ name: "A", tone: "magenta" }, { name: "B" }],
				}),
			).toThrow(/tone/);
		});

		it("rejects bad shape", () => {
			expect(() =>
				parseFgraphContent({
					topology: "linear-flow",
					stages: [{ name: "A", shape: "triangle" }, { name: "B" }],
				}),
			).toThrow(/shape/);
		});

		it("rejects bad semantic on edge", () => {
			expect(() =>
				parseFgraphContent({
					topology: "linear-flow",
					stages: [{ name: "A" }, { name: "B" }],
					edges: [{ from: 0, to: 1, semantic: "telepathy" }],
				}),
			).toThrow(/semantic/);
		});
	});
});

/* ────────────────────────────────────────────────────────────────────
   generateDiagramTemplate — end-to-end render tests
   ──────────────────────────────────────────────────────────────────── */

describe("generateDiagramTemplate", () => {
	function expectValidHtml(html: string) {
		expect(html).toMatch(/^<!DOCTYPE html>/);
		expect(html).toContain("</html>");
		// Aesthetic CSS was loaded and inlined.
		expect(html).toContain("--bg:");
		// Base diagram CSS was inlined.
		expect(html).toContain(".fgraph-edges");
		// SVG arrow markers present.
		expect(html).toContain("fg-arr-cyan");
		// Single-file: no external <link> tags except google fonts preconnect.
		const linkTags = html.match(/<link [^>]*>/g) ?? [];
		for (const tag of linkTags) {
			expect(tag).toMatch(/fonts\.(googleapis|gstatic)/);
		}
	}

	it("renders sequence into a single-file HTML", () => {
		const html = generateDiagramTemplate({
			title: "Agent → Tool",
			content: {
				topology: "sequence",
				participants: [
					{ name: "Agent", tone: "amber" },
					{ name: "Tool", tone: "cyan", sub: "PI tool" },
				],
				messages: [
					{ from: 0, to: 1, label: "invoke()" },
					{ from: 1, to: 0, label: "result", kind: "return" },
				],
			},
			aesthetic: "dark-professional",
		});
		expectValidHtml(html);
		expect(html).toContain("Agent → Tool");
		expect(html).toContain("invoke()");
		expect(html).toContain("fg-seq-participant");
		expect(html).toContain("fg-lifeline");
		// Return message gets dashed class.
		expect(html).toMatch(/fg-edge \w+ dashed/);
	});

	it("renders layered into a single-file HTML", () => {
		const html = generateDiagramTemplate({
			title: "App stack",
			content: {
				topology: "layered",
				layers: [
					{ label: "Frontend", nodes: [{ name: "Web", tone: "cyan" }] },
					{
						label: "Backend",
						nodes: [
							{ name: "API", tone: "green" },
							{ name: "Worker", tone: "green" },
						],
					},
					{ label: "Storage", nodes: [{ name: "Postgres", shape: "cylinder", tone: "purple" }] },
				],
			},
			aesthetic: "blueprint",
		});
		expectValidHtml(html);
		expect(html).toContain("App stack");
		expect(html).toContain("layer-frame");
		expect(html).toContain("Frontend");
		expect(html).toContain("Storage");
		// Single-node layer renders as `wide`, plus the cylinder shape.
		expect(html).toMatch(/fgraph-node purple[^"]*\bcylinder/);
	});

	it("renders linear-flow with implicit chain edges", () => {
		const html = generateDiagramTemplate({
			title: "RAG pipeline",
			content: {
				topology: "linear-flow",
				stages: [
					{ name: "Query" },
					{ name: "Embed", shape: "hexagon", tone: "cyan" },
					{ name: "VectorSearch", shape: "cylinder", tone: "purple" },
					{ name: "LLM", shape: "hexagon", tone: "amber" },
					{ name: "Response" },
				],
			},
			aesthetic: "editorial",
		});
		expectValidHtml(html);
		expect(html).toContain("RAG pipeline");
		// 4 implicit edges between 5 stages.
		const edgeCount = (html.match(/fg-edge purple/g) ?? []).length;
		expect(edgeCount).toBeGreaterThanOrEqual(4);
	});

	it("renders radial-hub with bidirectional spoke arrows by default", () => {
		const html = generateDiagramTemplate({
			title: "Agentic RAG",
			content: {
				topology: "radial-hub",
				hub: { name: "Agent", tone: "amber", shape: "hexagon" },
				spokes: [
					{ name: "Search", position: "top", semantic: "control" },
					{ name: "Calc", position: "right", semantic: "control" },
					{ name: "Memory", position: "bottom", shape: "cylinder", semantic: "data" },
					{ name: "LLM", position: "left", shape: "hexagon", semantic: "control" },
				],
			},
			aesthetic: "lyra",
		});
		expectValidHtml(html);
		expect(html).toContain("Agentic RAG");
		// Hub uses the .hub width modifier.
		expect(html).toContain("fgraph-node hub");
		// Default direction "both" → marker-start + marker-end with -bi suffix.
		expect(html).toContain("fg-arr-cyan-bi");
	});

	it("escapes HTML entities in titles and labels", () => {
		const html = generateDiagramTemplate({
			title: '<script>alert("xss")</script>',
			content: {
				topology: "linear-flow",
				stages: [{ name: "<bad>" }, { name: "good" }],
			},
			aesthetic: "dark-professional",
		});
		expect(html).not.toContain("<script>alert");
		expect(html).toContain("&lt;script&gt;");
		expect(html).toContain("&lt;bad&gt;");
	});

	it("loads each of the 5 fgraph aesthetics without error", () => {
		const aesthetics = ["blueprint", "dark-professional", "editorial", "lyra", "terminal"] as const;
		for (const aesthetic of aesthetics) {
			const html = generateDiagramTemplate({
				title: `Aesthetic check: ${aesthetic}`,
				content: {
					topology: "linear-flow",
					stages: [{ name: "A" }, { name: "B" }],
				},
				aesthetic,
			});
			expect(html).toContain(`Aesthetic check: ${aesthetic}`);
			// All aesthetics define at least the --bg token.
			expect(html).toMatch(/--bg:\s*#/);
		}
	});
});
