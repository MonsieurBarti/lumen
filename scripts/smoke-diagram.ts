/* Smoke test — render one HTML file per topology + open them in the browser. */
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";

import { type FgraphContent, generateDiagramTemplate } from "../src/templates/diagram/index.js";

const outputs: Array<{ name: string; title: string; content: FgraphContent }> = [
	{
		name: "smoke-sequence.html",
		title: 'Lumen v0.2 — type:"diagram" PI route',
		content: {
			topology: "sequence",
			participants: [
				{ name: "Agent", tone: "amber", sub: "CC / PI" },
				{ name: "lumen-generate_visual", tone: "cyan", sub: "PI tool" },
				{ name: "fgraph schema", tone: "purple", sub: "Typebox" },
				{ name: "diagram.ts", tone: "green", sub: "renderer" },
			],
			messages: [
				{ from: 0, to: 1, label: 'call({type:"diagram", content})' },
				{ from: 1, to: 2, label: "validate(content)" },
				{ from: 2, to: 1, label: "Static<TFgraph>", kind: "return" },
				{ from: 1, to: 3, label: "render(fgraph) → write → open" },
				{ from: 3, to: 0, label: "{ filePath, url }", kind: "return" },
			],
			legend: "deterministic — no LLM in the rendering path",
		},
	},
	{
		name: "smoke-layered.html",
		title: "Lumen architecture",
		content: {
			topology: "layered",
			layers: [
				{
					label: "Consumers",
					nodes: [
						{ name: "Claude Code plugin", tone: "cyan", sub: "/plugin install lumen" },
						{ name: "PI extension", tone: "green", sub: "lumen-generate_visual" },
					],
				},
				{
					label: "Source of truth",
					nodes: [{ name: "skills/ — 8 SKILL.md", tone: "purple", shape: "pill" }],
				},
				{
					label: "PI deterministic renderers",
					nodes: [
						{
							name: "src/templates/*.ts",
							tone: "amber",
							subMuted: "mermaid · diagram · …",
						},
					],
				},
				{
					label: "Output",
					nodes: [
						{
							name: "single-file HTML",
							tone: "cyan",
							subMuted: "offline-safe · file://",
						},
					],
				},
			],
		},
	},
	{
		name: "smoke-linear-flow.html",
		title: "RAG pipeline",
		content: {
			topology: "linear-flow",
			stages: [
				{ name: "Query" },
				{ name: "Embed", shape: "hexagon", tone: "cyan" },
				{ name: "VectorSearch", shape: "cylinder", tone: "purple" },
				{ name: "Retrieve" },
				{ name: "LLM", shape: "hexagon", tone: "amber" },
				{ name: "Response" },
			],
			edges: [
				{ from: 0, to: 1, semantic: "data" },
				{ from: 1, to: 2, semantic: "async", label: "embedding" },
				{ from: 2, to: 3, semantic: "data" },
				{ from: 3, to: 4, semantic: "data" },
				{ from: 4, to: 5, semantic: "data", style: "thick" },
			],
			legend: "RAG recipe from skills/lumen-diagram/templates/ai-patterns.md",
		},
	},
	{
		name: "smoke-radial-hub.html",
		title: "Agentic RAG",
		content: {
			topology: "radial-hub",
			hub: { name: "Agent", tone: "amber", shape: "hexagon", sub: "orchestrator" },
			spokes: [
				{ name: "Search", position: "top", semantic: "control" },
				{ name: "Calc", position: "top-right", semantic: "control" },
				{ name: "Code", position: "right", semantic: "control" },
				{ name: "Memory", position: "bottom-right", shape: "cylinder", semantic: "data" },
				{ name: "VectorDB", position: "bottom", shape: "cylinder", semantic: "data" },
				{ name: "Files", position: "bottom-left", shape: "folded", semantic: "data" },
				{
					name: "LLM",
					position: "left",
					shape: "hexagon",
					semantic: "control",
					direction: "out",
				},
			],
		},
	},
];

for (const { name, title, content } of outputs) {
	const html = generateDiagramTemplate({
		title,
		content,
		aesthetic: "dark-professional",
	});
	const path = `/tmp/${name}`;
	writeFileSync(path, html);
	console.log(`wrote ${path} (${html.length} bytes)`);
}

if (process.argv.includes("--open")) {
	for (const { name } of outputs) {
		spawnSync("open", [`/tmp/${name}`]);
	}
}
