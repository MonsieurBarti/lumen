/**
 * @the-forge-flow/lumen — PI coding agent extension entry point.
 *
 * Lifted from @the-forge-flow/visual-explainer-pi: src/index.ts. Adapted:
 *   - tool name `tff-generate_visual` → `lumen-generate_visual`
 *   - slash commands `visual-{reopen,list}` → `lumen-{reopen,list}`
 *   - in v0.1.x only `mermaid_custom` is wired through generateVisual; other
 *     types throw NotImplementedError until lumen-{diagram,chart,...} land.
 *
 * The same `skills/` tree is consumed by the Claude Code plugin
 * (`.claude-plugin/plugin.json`) and shipped to PI under `dist/skills/` via
 * the `prebuild` script in package.json.
 */

import { StringEnum } from "@mariozechner/pi-ai";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { defineTool } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import { generateDiagramTemplate, parseFgraphContent } from "./templates/diagram/index.js";
import { generateMermaidTemplate } from "./templates/mermaid.js";
import type {
	Aesthetic,
	ExtensionState,
	FgraphAesthetic,
	GenerateResult,
	GenerateVisualParams,
} from "./types.js";
import { checkForUpdates } from "./update-check.js";
import { openInBrowser } from "./utils/browser-open.js";
import { createInitialState, writeHtmlFile } from "./utils/file-writer.js";
import {
	generateDefaultFilename,
	isAesthetic,
	isFgraphAesthetic,
	sanitizeFilename,
	validateParams,
} from "./utils/validators.js";

// x-release-please-start-version
export const LUMEN_VERSION = "0.1.2";
// x-release-please-end

export const LUMEN_SKILLS = [
	"lumen-diagram",
	"lumen-chart",
	"lumen-mermaid",
	"lumen-slides",
	"lumen-gallery",
	"lumen-guide",
	"lumen-recap",
	"lumen-fact-check",
] as const;

export type LumenSkillId = (typeof LUMEN_SKILLS)[number];

const MERMAID_TYPES: readonly GenerateVisualParams["type"][] = [
	"flowchart",
	"sequence",
	"er",
	"state",
	"mermaid_custom",
];

const FGRAPH_TYPES: readonly GenerateVisualParams["type"][] = ["diagram"];

class NotImplementedError extends Error {
	constructor(type: string) {
		const wired = [...MERMAID_TYPES, ...FGRAPH_TYPES].join(", ");
		super(
			`Visual type "${type}" is not implemented in lumen v${LUMEN_VERSION}. Wired types: ${wired}. Other types land as their lumen-* skills are filled in.`,
		);
		this.name = "NotImplementedError";
	}
}

function narrowMermaidAesthetic(aesthetic: GenerateVisualParams["aesthetic"]): Aesthetic {
	if (aesthetic === undefined) return "blueprint";
	if (isAesthetic(aesthetic)) return aesthetic;
	console.warn(
		`Aesthetic "${aesthetic}" is fgraph-only; mermaid renderer falling back to "blueprint".`,
	);
	return "blueprint";
}

function narrowFgraphAesthetic(aesthetic: GenerateVisualParams["aesthetic"]): FgraphAesthetic {
	if (aesthetic === undefined) return "dark-professional";
	if (isFgraphAesthetic(aesthetic)) return aesthetic;
	console.warn(
		`Aesthetic "${aesthetic}" is mermaid-only; diagram renderer falling back to "dark-professional".`,
	);
	return "dark-professional";
}

async function renderMermaid(params: GenerateVisualParams): Promise<string> {
	if (typeof params.content !== "string") {
		throw new Error(
			`Mermaid types require string content (the mermaid source); got ${typeof params.content}.`,
		);
	}
	return generateMermaidTemplate(
		params.title,
		{
			mermaidSyntax: params.content,
			caption: `${params.type} diagram`,
		},
		narrowMermaidAesthetic(params.aesthetic),
		params.theme === "dark",
	);
}

async function renderDiagram(params: GenerateVisualParams): Promise<string> {
	if (typeof params.content === "string" || Array.isArray(params.content)) {
		const got = typeof params.content === "string" ? "string" : "array";
		throw new Error(
			`type:"diagram" requires structured content (an object describing an fgraph topology); got ${got}. See FgraphContent in src/templates/diagram/schemas.ts for the shape.`,
		);
	}
	const fgraphContent = parseFgraphContent(params.content);
	return generateDiagramTemplate({
		title: params.title,
		content: fgraphContent,
		aesthetic: narrowFgraphAesthetic(params.aesthetic),
	});
}

async function generateVisual(
	params: GenerateVisualParams,
	pi: ExtensionAPI,
	state: ExtensionState,
): Promise<GenerateResult> {
	let html: string;
	if (MERMAID_TYPES.includes(params.type)) {
		html = await renderMermaid(params);
	} else if (FGRAPH_TYPES.includes(params.type)) {
		html = await renderDiagram(params);
	} else {
		throw new NotImplementedError(params.type);
	}

	const filename = params.filename
		? sanitizeFilename(params.filename)
		: generateDefaultFilename(params.title);

	// Write the full HTML to disk. We intentionally do NOT clip the output —
	// truncating HTML at a byte boundary leaves unclosed tags/scripts and
	// silently corrupts every non-trivial diagram.
	const filePath = await writeHtmlFile(filename, html, state);

	await openInBrowser(filePath, pi);

	return {
		filePath,
		previewSnippet: `Generated ${params.type} visualization: ${params.title}`,
		url: `file://${filePath}`,
	};
}

export default function lumenExtension(pi: ExtensionAPI) {
	const state: ExtensionState = createInitialState();

	pi.on("session_start", async (_event, ctx) => {
		void checkForUpdates(pi).then((info) => {
			if (info?.updateAvailable) {
				ctx.ui.notify(
					`📦 Update available: ${info.latestVersion} (you have ${info.currentVersion}). Run: pi install npm:@the-forge-flow/lumen`,
					"info",
				);
			}
		});

		if (ctx.hasUI) {
			ctx.ui.notify("Lumen ready", "info");
		}
	});

	const generateVisualTool = defineTool({
		name: "lumen-generate_visual",
		label: "Generate Visual",
		description:
			'Generate a single-file HTML visualization. Wired routes: mermaid (flowchart/sequence/er/state/mermaid_custom — pass mermaid source as `content`) and fgraph diagram (type:"diagram" — pass a structured FgraphContent object as `content`, currently supporting topologies sequence / layered / linear-flow / radial-hub). Other types (architecture, charts, slides, galleries, guides, recaps, fact-checks) throw NotImplementedError; invoke the matching lumen-* skill directly. Opens result in browser.',
		promptSnippet: "Create a visual diagram",
		promptGuidelines: [
			"Mermaid types (`mermaid_custom`, `flowchart`, `sequence`, `er`, `state`): pass mermaid source as `content` (string).",
			'Fgraph diagram (`type:"diagram"`): pass a structured object as `content` with a `topology` discriminator. Supported topologies in v0.2: "sequence" (participants + messages), "layered" (layers of nodes), "linear-flow" (left→right pipeline of stages), "radial-hub" (hub + spokes at compass positions). See FgraphContent in src/templates/diagram/schemas.ts for the exact shape.',
			"Coordinates are computed from logical indices / compass positions — do NOT pass --x/--y; use participant/layer/stage/position vocabulary instead.",
			"Aesthetic: mermaid renderer accepts blueprint / editorial / paper / terminal / dracula / nord / solarized / gruvbox; diagram renderer accepts blueprint / dark-professional / editorial / lyra / terminal. Defaults: blueprint (mermaid), dark-professional (diagram).",
			"For visual types other than mermaid + diagram, invoke the matching lumen-* skill directly until that route lands.",
		],
		parameters: Type.Object({
			type: StringEnum(
				[
					"architecture",
					"diagram",
					"flowchart",
					"sequence",
					"er",
					"state",
					"table",
					"diff",
					"plan",
					"timeline",
					"dashboard",
					"slides",
					"mermaid_custom",
				] as const,
				{ description: "Type of visualization to generate" },
			),
			content: Type.Union([
				Type.String({ description: "Raw content (mermaid syntax, markdown)" }),
				Type.Array(Type.Record(Type.String(), Type.Unknown()), {
					description: "Structured data rows (for tables, charts)",
				}),
				Type.Object(
					{},
					{
						description:
							'Structured object content. Required for type:"diagram" — see FgraphContent shape (topology + topology-specific fields).',
						additionalProperties: true,
					},
				),
			]),
			title: Type.String({ description: "Title for the visualization" }),
			aesthetic: Type.Optional(
				StringEnum(
					[
						"blueprint",
						"editorial",
						"paper",
						"terminal",
						"dracula",
						"nord",
						"solarized",
						"gruvbox",
						"dark-professional",
						"lyra",
					] as const,
					{
						description:
							"Visual aesthetic / palette. First 8 are mermaid-only; dark-professional + lyra are diagram-only; blueprint / editorial / terminal work for both.",
					},
				),
			),
			theme: Type.Optional(
				StringEnum(["light", "dark", "auto"] as const, {
					description: "Color theme mode",
				}),
			),
			filename: Type.Optional(
				Type.String({ description: "Output filename (auto-generated if omitted)" }),
			),
		}),

		async execute(_toolCallId, rawParams, _signal, _onUpdate, _ctx) {
			const params = validateParams(rawParams);
			const result = await generateVisual(params, pi, state);

			return {
				content: [
					{
						type: "text",
						text: `${result.previewSnippet}\n\nOpened in browser: ${result.url}\nFile: ${result.filePath}`,
					},
				],
				details: {
					type: params.type,
					title: params.title,
					aesthetic: params.aesthetic,
					theme: params.theme,
					filePath: result.filePath,
					url: result.url,
				},
			};
		},
	});

	pi.registerTool(generateVisualTool);

	pi.registerCommand("lumen-reopen", {
		description: "Re-open a recently generated visual by index (1-10)",
		handler: async (args, ctx) => {
			const index = Number.parseInt(args, 10) - 1;
			if (index < 0 || index >= state.recentFiles.length) {
				if (ctx.hasUI) {
					ctx.ui.notify(`Invalid index. Use 1-${state.recentFiles.length}`, "error");
				}
				return;
			}
			const filePath = state.recentFiles[index];
			if (!filePath) return;
			await openInBrowser(filePath, pi);
			if (ctx.hasUI) {
				ctx.ui.notify(`Re-opened: ${filePath}`, "info");
			}
		},
	});

	pi.registerCommand("lumen-list", {
		description: "List recently generated lumen visuals",
		handler: async (_args, ctx) => {
			if (state.recentFiles.length === 0) {
				if (ctx.hasUI) {
					ctx.ui.notify("No recent visuals", "warning");
				}
				return;
			}
			const list = state.recentFiles.map((f, i) => `${i + 1}. ${f}`).join("\n");
			if (ctx.hasUI) {
				ctx.ui.notify(`Recent visuals:\n${list}`, "info");
			}
		},
	});

	pi.on("session_shutdown", async () => {
		state.tempDirs = [];
	});
}

export { generateArchitectureTemplate } from "./templates/architecture.js";
export type {
	ArchitectureContent,
	ArchitectureSection,
} from "./templates/architecture.js";
export {
	generateDiagramTemplate,
	parseFgraphContent,
	SUPPORTED_TOPOLOGIES,
	type FgraphContent,
	type FgraphEdge,
	type FgraphNode,
	type FgraphSemantic,
	type FgraphShape,
	type FgraphTone,
	type LayeredContent,
	type LinearFlowContent,
	type RadialHubContent,
	type RadialPosition,
	type RadialSpoke,
	type SequenceContent,
	type SequenceMessage,
	type SequenceParticipant,
	type SupportedTopology,
} from "./templates/diagram/index.js";
export { generateMermaidTemplate } from "./templates/mermaid.js";
export type { MermaidContent } from "./templates/mermaid.js";
export type {
	Aesthetic,
	AnyAesthetic,
	ExtensionState,
	FgraphAesthetic,
	GenerateResult,
	GenerateVisualParams,
	Palette,
	Theme,
	VisualType,
} from "./types.js";
