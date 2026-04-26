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
import { generateMermaidTemplate } from "./templates/mermaid.js";
import type { ExtensionState, GenerateResult, GenerateVisualParams } from "./types.js";
import { checkForUpdates } from "./update-check.js";
import { openInBrowser } from "./utils/browser-open.js";
import { createInitialState, writeHtmlFile } from "./utils/file-writer.js";
import { generateDefaultFilename, sanitizeFilename, validateParams } from "./utils/validators.js";

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

class NotImplementedError extends Error {
	constructor(type: string) {
		const wired = MERMAID_TYPES.join(", ");
		super(
			`Visual type "${type}" is not implemented in lumen v${LUMEN_VERSION}. Only mermaid types (${wired}) are wired through the PI tool today; other types land as their lumen-* skills are filled in. See PLAN.md.`,
		);
		this.name = "NotImplementedError";
	}
}

async function generateVisual(
	params: GenerateVisualParams,
	pi: ExtensionAPI,
	state: ExtensionState,
): Promise<GenerateResult> {
	const isDark = params.theme === "dark";

	if (!MERMAID_TYPES.includes(params.type)) {
		throw new NotImplementedError(params.type);
	}

	if (typeof params.content !== "string") {
		throw new Error(
			`Mermaid types require string content (the mermaid source); got ${typeof params.content}.`,
		);
	}

	const html = generateMermaidTemplate(
		params.title,
		{
			mermaidSyntax: params.content,
			caption: `${params.type} diagram`,
		},
		params.aesthetic ?? "blueprint",
		isDark,
	);

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
			"Generate a single-file HTML visualization (mermaid diagrams in v0.1.x; architecture, charts, slides, galleries, guides, recaps, and fact-checks land as their lumen-* skills are filled in). Opens result in browser.",
		promptSnippet: "Create a visual diagram",
		promptGuidelines: [
			"v0.1.x only `mermaid_custom`, `flowchart`, `sequence`, `er`, and `state` are fully wired through this tool. Other types throw NotImplementedError.",
			"Pass mermaid source as `content` for mermaid types.",
			"Pick an aesthetic from the 8 palettes (blueprint default).",
			"For other visual types, invoke the matching lumen-* skill directly until v0.2.",
		],
		parameters: Type.Object({
			type: StringEnum(
				[
					"architecture",
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
					] as const,
					{ description: "Visual aesthetic / theme palette" },
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
export { generateMermaidTemplate } from "./templates/mermaid.js";
export type { MermaidContent } from "./templates/mermaid.js";
export type {
	Aesthetic,
	ExtensionState,
	GenerateResult,
	GenerateVisualParams,
	Palette,
	Theme,
	VisualType,
} from "./types.js";
