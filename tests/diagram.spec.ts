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

	it("lists all supported topologies in error", () => {
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

	describe("radial-ring", () => {
		const valid: FgraphContent = {
			topology: "radial-ring",
			nodes: [{ name: "A" }, { name: "B" }, { name: "C" }],
			edges: [{ from: 0, to: 1 }],
		};

		it("accepts a minimal valid radial-ring", () => {
			const parsed = parseFgraphContent(valid);
			expect(parsed.topology).toBe("radial-ring");
		});

		it("rejects fewer than 2 nodes", () => {
			expect(() =>
				parseFgraphContent({ topology: "radial-ring", nodes: [{ name: "Solo" }] }),
			).toThrow(/at least 2/);
		});

		it("rejects edge with out-of-range index", () => {
			expect(() => parseFgraphContent({ ...valid, edges: [{ from: 0, to: 99 }] })).toThrow(/index/);
		});
	});

	describe("lane-swim", () => {
		const valid: FgraphContent = {
			topology: "lane-swim",
			lanes: [
				{ label: "L1", nodes: [{ name: "A" }] },
				{ label: "L2", nodes: [{ name: "B" }] },
			],
		};

		it("accepts a minimal valid lane-swim", () => {
			const parsed = parseFgraphContent(valid);
			expect(parsed.topology).toBe("lane-swim");
		});

		it("rejects fewer than 2 lanes", () => {
			expect(() =>
				parseFgraphContent({
					topology: "lane-swim",
					lanes: [{ label: "Solo", nodes: [{ name: "X" }] }],
				}),
			).toThrow(/at least 2/);
		});

		it("rejects more than 4 nodes per lane", () => {
			const nodes = Array.from({ length: 5 }, (_, i) => ({ name: `N${i}` }));
			expect(() =>
				parseFgraphContent({
					topology: "lane-swim",
					lanes: [
						{ label: "Crowded", nodes },
						{ label: "Other", nodes: [{ name: "Y" }] },
					],
				}),
			).toThrow(/at most 4/);
		});
	});

	describe("deployment-tiers", () => {
		const valid: FgraphContent = {
			topology: "deployment-tiers",
			tiers: [
				{ label: "Web", nodes: [{ name: "Nginx" }] },
				{ label: "App", nodes: [{ name: "API" }] },
			],
		};

		it("accepts a minimal valid deployment-tiers", () => {
			const parsed = parseFgraphContent(valid);
			expect(parsed.topology).toBe("deployment-tiers");
		});

		it("rejects fewer than 2 tiers", () => {
			expect(() =>
				parseFgraphContent({
					topology: "deployment-tiers",
					tiers: [{ label: "Solo", nodes: [{ name: "X" }] }],
				}),
			).toThrow(/at least 2/);
		});

		it("rejects edge with out-of-range layer index", () => {
			expect(() =>
				parseFgraphContent({ ...valid, edges: [{ fromLayer: 0, toLayer: 99 }] }),
			).toThrow(/index/);
		});
	});

	describe("machine-clusters", () => {
		const valid: FgraphContent = {
			topology: "machine-clusters",
			hosts: [
				{ name: "Host-A", nodes: [{ name: "Svc1" }] },
				{ name: "Host-B", nodes: [{ name: "Svc2" }] },
			],
		};

		it("accepts a minimal valid machine-clusters", () => {
			const parsed = parseFgraphContent(valid);
			expect(parsed.topology).toBe("machine-clusters");
		});

		it("rejects fewer than 2 hosts", () => {
			expect(() =>
				parseFgraphContent({
					topology: "machine-clusters",
					hosts: [{ name: "Solo", nodes: [{ name: "X" }] }],
				}),
			).toThrow(/at least 2/);
		});
	});

	describe("state", () => {
		const valid: FgraphContent = {
			topology: "state",
			states: [{ name: "Idle", initial: true }, { name: "Running" }, { name: "Done", final: true }],
			transitions: [
				{ from: 0, to: 1, label: "start" },
				{ from: 1, to: 2, label: "finish" },
			],
		};

		it("accepts a minimal valid state", () => {
			const parsed = parseFgraphContent(valid);
			expect(parsed.topology).toBe("state");
		});

		it("rejects fewer than 2 states", () => {
			expect(() =>
				parseFgraphContent({
					topology: "state",
					states: [{ name: "Solo" }],
					transitions: [{ from: 0, to: 0, label: "x" }],
				}),
			).toThrow(/at least 2/);
		});

		it("rejects transition with out-of-range index", () => {
			expect(() =>
				parseFgraphContent({ ...valid, transitions: [{ from: 0, to: 99, label: "x" }] }),
			).toThrow(/index/);
		});
	});

	describe("gantt", () => {
		const valid: FgraphContent = {
			topology: "gantt",
			tasks: [
				{ name: "Design", start: 0, duration: 5 },
				{ name: "Build", start: 5, duration: 10 },
			],
		};

		it("accepts a minimal valid gantt", () => {
			const parsed = parseFgraphContent(valid);
			expect(parsed.topology).toBe("gantt");
		});

		it("rejects negative start", () => {
			expect(() =>
				parseFgraphContent({
					topology: "gantt",
					tasks: [{ name: "Bad", start: -1, duration: 1 }],
				}),
			).toThrow(/start/);
		});

		it("rejects zero duration", () => {
			expect(() =>
				parseFgraphContent({
					topology: "gantt",
					tasks: [{ name: "Bad", start: 0, duration: 0 }],
				}),
			).toThrow(/duration/);
		});
	});

	describe("pie", () => {
		const valid: FgraphContent = {
			topology: "pie",
			slices: [
				{ name: "A", value: 30 },
				{ name: "B", value: 70 },
			],
		};

		it("accepts a minimal valid pie", () => {
			const parsed = parseFgraphContent(valid);
			expect(parsed.topology).toBe("pie");
		});

		it("rejects fewer than 2 slices", () => {
			expect(() =>
				parseFgraphContent({ topology: "pie", slices: [{ name: "Solo", value: 1 }] }),
			).toThrow(/at least 2/);
		});

		it("rejects non-positive value", () => {
			expect(() =>
				parseFgraphContent({
					topology: "pie",
					slices: [
						{ name: "A", value: 1 },
						{ name: "B", value: 0 },
					],
				}),
			).toThrow(/value/);
		});
	});

	describe("er", () => {
		const valid: FgraphContent = {
			topology: "er",
			entities: [
				{
					name: "User",
					attributes: [{ name: "id", type: "int", key: true }],
				},
				{
					name: "Post",
					attributes: [{ name: "userId", type: "int" }],
				},
			],
			relationships: [{ from: 0, to: 1, type: "1:N" }],
		};

		it("accepts a minimal valid er", () => {
			const parsed = parseFgraphContent(valid);
			expect(parsed.topology).toBe("er");
		});

		it("rejects fewer than 2 entities", () => {
			expect(() =>
				parseFgraphContent({
					topology: "er",
					entities: [{ name: "Solo", attributes: [] }],
					relationships: [],
				}),
			).toThrow(/at least 2/);
		});

		it("rejects relationship with out-of-range index", () => {
			expect(() => parseFgraphContent({ ...valid, relationships: [{ from: 0, to: 99 }] })).toThrow(
				/index/,
			);
		});
	});

	describe("dep-graph", () => {
		const valid: FgraphContent = {
			topology: "dep-graph",
			nodes: [{ name: "A" }, { name: "B" }],
			edges: [{ from: 0, to: 1 }],
		};

		it("accepts a minimal valid dep-graph", () => {
			const parsed = parseFgraphContent(valid);
			expect(parsed.topology).toBe("dep-graph");
		});

		it("rejects fewer than 2 nodes", () => {
			expect(() =>
				parseFgraphContent({ topology: "dep-graph", nodes: [{ name: "Solo" }], edges: [] }),
			).toThrow(/at least 2/);
		});

		it("rejects edge with out-of-range index", () => {
			expect(() => parseFgraphContent({ ...valid, edges: [{ from: 0, to: 99 }] })).toThrow(/index/);
		});
	});

	describe("dual-cluster", () => {
		const valid: FgraphContent = {
			topology: "dual-cluster",
			clusterA: { label: "Before", nodes: [{ name: "A1" }] },
			clusterB: { label: "After", nodes: [{ name: "B1" }] },
			edges: [{ fromCluster: "A", fromIdx: 0, toCluster: "B", toIdx: 0 }],
		};

		it("accepts a minimal valid dual-cluster", () => {
			const parsed = parseFgraphContent(valid);
			expect(parsed.topology).toBe("dual-cluster");
		});

		it("rejects out-of-range fromIdx", () => {
			expect(() =>
				parseFgraphContent({
					...valid,
					edges: [{ fromCluster: "A", fromIdx: 5, toCluster: "B", toIdx: 0 }],
				}),
			).toThrow(/fromIdx/);
		});

		it("rejects invalid cluster id", () => {
			expect(() =>
				parseFgraphContent({
					...valid,
					edges: [{ fromCluster: "C", fromIdx: 0, toCluster: "B", toIdx: 0 }],
				}),
			).toThrow(/fromCluster/);
		});
	});

	describe("system-architecture", () => {
		const valid: FgraphContent = {
			topology: "system-architecture",
			zones: [
				{ label: "Z1", nodes: [{ name: "A" }] },
				{ label: "Z2", nodes: [{ name: "B" }] },
				{ label: "Z3", nodes: [{ name: "C" }] },
			],
			edges: [{ from: 0, to: 1 }],
		};

		it("accepts a minimal valid system-architecture", () => {
			const parsed = parseFgraphContent(valid);
			expect(parsed.topology).toBe("system-architecture");
		});

		it("rejects fewer than 3 zones", () => {
			expect(() =>
				parseFgraphContent({
					topology: "system-architecture",
					zones: [
						{ label: "Z1", nodes: [{ name: "A" }] },
						{ label: "Z2", nodes: [{ name: "B" }] },
					],
				}),
			).toThrow(/at least 3/);
		});

		it("rejects edge with out-of-range global node index", () => {
			expect(() => parseFgraphContent({ ...valid, edges: [{ from: 0, to: 99 }] })).toThrow(/index/);
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

	it("includes SVG arrow markers when edges are present", () => {
		const html = generateDiagramTemplate({
			title: "Edges",
			content: {
				topology: "linear-flow",
				stages: [{ name: "A" }, { name: "B" }],
			},
			aesthetic: "dark-professional",
		});
		expect(html).toContain("fg-arr-cyan");
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

	it("renders radial-ring into HTML", () => {
		const html = generateDiagramTemplate({
			title: "Peers",
			content: {
				topology: "radial-ring",
				nodes: [{ name: "A" }, { name: "B" }, { name: "C" }],
				edges: [{ from: 0, to: 1 }],
			},
			aesthetic: "dark-professional",
		});
		expectValidHtml(html);
		expect(html).toContain("Peers");
		expect(html).toContain("ring-node");
	});

	it("renders lane-swim into HTML", () => {
		const html = generateDiagramTemplate({
			title: "Swim",
			content: {
				topology: "lane-swim",
				lanes: [
					{ label: "L1", nodes: [{ name: "A" }] },
					{ label: "L2", nodes: [{ name: "B" }] },
				],
			},
			aesthetic: "blueprint",
		});
		expectValidHtml(html);
		expect(html).toContain("lane-frame");
	});

	it("renders deployment-tiers into HTML", () => {
		const html = generateDiagramTemplate({
			title: "Deploy",
			content: {
				topology: "deployment-tiers",
				tiers: [
					{ label: "Edge", nodes: [{ name: "CDN" }], replicas: 3 },
					{ label: "App", nodes: [{ name: "API" }] },
				],
			},
			aesthetic: "editorial",
		});
		expectValidHtml(html);
		expect(html).toContain("replica-badge");
	});

	it("renders machine-clusters into HTML", () => {
		const html = generateDiagramTemplate({
			title: "Cluster",
			content: {
				topology: "machine-clusters",
				hosts: [
					{ name: "Host-A", nodes: [{ name: "Svc1" }] },
					{ name: "Host-B", nodes: [{ name: "Svc2" }] },
				],
			},
			aesthetic: "lyra",
		});
		expectValidHtml(html);
		expect(html).toContain("host-frame");
	});

	it("renders state machine into HTML", () => {
		const html = generateDiagramTemplate({
			title: "FSM",
			content: {
				topology: "state",
				states: [{ name: "Idle", initial: true }, { name: "Run" }, { name: "Done", final: true }],
				transitions: [{ from: 0, to: 1, label: "start" }],
			},
			aesthetic: "terminal",
		});
		expectValidHtml(html);
		expect(html).toContain("state-node");
		expect(html).toContain("initial");
		expect(html).toContain("final");
	});

	it("renders gantt into HTML", () => {
		const html = generateDiagramTemplate({
			title: "Roadmap",
			content: {
				topology: "gantt",
				tasks: [
					{ name: "Design", start: 0, duration: 5 },
					{ name: "Build", start: 5, duration: 10 },
				],
			},
			aesthetic: "dark-professional",
		});
		expectValidHtml(html);
		expect(html).toContain("gantt-bar");
	});

	it("renders pie into HTML", () => {
		const html = generateDiagramTemplate({
			title: "Share",
			content: {
				topology: "pie",
				slices: [
					{ name: "A", value: 30 },
					{ name: "B", value: 70 },
				],
			},
			aesthetic: "blueprint",
		});
		expectValidHtml(html);
		expect(html).toContain("<path");
	});

	it("renders er into HTML", () => {
		const html = generateDiagramTemplate({
			title: "Schema",
			content: {
				topology: "er",
				entities: [
					{ name: "User", attributes: [{ name: "id", type: "int", key: true }] },
					{ name: "Post", attributes: [{ name: "title" }] },
				],
				relationships: [{ from: 0, to: 1, type: "1:N" }],
			},
			aesthetic: "editorial",
		});
		expectValidHtml(html);
		expect(html).toContain("er-entity");
	});

	it("renders dep-graph into HTML", () => {
		const html = generateDiagramTemplate({
			title: "Deps",
			content: {
				topology: "dep-graph",
				nodes: [{ name: "A" }, { name: "B" }],
				edges: [{ from: 0, to: 1 }],
			},
			aesthetic: "lyra",
		});
		expectValidHtml(html);
		expect(html).toContain("dep-node");
	});

	it("renders dual-cluster into HTML", () => {
		const html = generateDiagramTemplate({
			title: "Compare",
			content: {
				topology: "dual-cluster",
				clusterA: { label: "Before", nodes: [{ name: "A1" }] },
				clusterB: { label: "After", nodes: [{ name: "B1" }] },
				edges: [{ fromCluster: "A", fromIdx: 0, toCluster: "B", toIdx: 0 }],
			},
			aesthetic: "terminal",
		});
		expectValidHtml(html);
		expect(html).toContain("cluster-frame");
	});

	it("renders system-architecture into HTML", () => {
		const html = generateDiagramTemplate({
			title: "System",
			content: {
				topology: "system-architecture",
				zones: [
					{ label: "Edge", nodes: [{ name: "CDN" }] },
					{ label: "App", nodes: [{ name: "API" }] },
					{ label: "Data", nodes: [{ name: "DB" }] },
				],
			},
			aesthetic: "dark-professional",
		});
		expectValidHtml(html);
		expect(html).toContain("sys-zone-frame");
	});
});
