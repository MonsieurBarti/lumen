/**
 * Input validation utilities for lumen.
 * Lifted from @the-forge-flow/visual-explainer-pi: src/utils/validators.ts.
 * Adapted to avoid type casts: uses Set membership + Reflect.get + type guards.
 */

import type {
	Aesthetic,
	AnyAesthetic,
	FgraphAesthetic,
	GenerateVisualParams,
	Theme,
	VisualType,
} from "../types.js";

const VALID_VISUAL_TYPES: readonly VisualType[] = [
	"architecture",
	"chart",
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
];

const VALID_AESTHETICS: readonly Aesthetic[] = [
	"blueprint",
	"editorial",
	"paper",
	"terminal",
	"dracula",
	"nord",
	"solarized",
	"gruvbox",
];

const VALID_FGRAPH_AESTHETICS: readonly FgraphAesthetic[] = [
	"blueprint",
	"dark-professional",
	"editorial",
	"lyra",
	"terminal",
];

// Union of mermaid + fgraph aesthetics with duplicates collapsed.
const VALID_ANY_AESTHETICS: readonly AnyAesthetic[] = Array.from(
	new Set<AnyAesthetic>([...VALID_AESTHETICS, ...VALID_FGRAPH_AESTHETICS]),
);

const VALID_THEMES: readonly Theme[] = ["light", "dark", "auto"];

const VISUAL_TYPE_SET: ReadonlySet<string> = new Set(VALID_VISUAL_TYPES);
const AESTHETIC_SET: ReadonlySet<string> = new Set(VALID_AESTHETICS);
const FGRAPH_AESTHETIC_SET: ReadonlySet<string> = new Set(VALID_FGRAPH_AESTHETICS);
const ANY_AESTHETIC_SET: ReadonlySet<string> = new Set(VALID_ANY_AESTHETICS);
const THEME_SET: ReadonlySet<string> = new Set(VALID_THEMES);

function isVisualType(value: unknown): value is VisualType {
	return typeof value === "string" && VISUAL_TYPE_SET.has(value);
}

export function isAesthetic(value: unknown): value is Aesthetic {
	return typeof value === "string" && AESTHETIC_SET.has(value);
}

export function isFgraphAesthetic(value: unknown): value is FgraphAesthetic {
	return typeof value === "string" && FGRAPH_AESTHETIC_SET.has(value);
}

function isAnyAesthetic(value: unknown): value is AnyAesthetic {
	return typeof value === "string" && ANY_AESTHETIC_SET.has(value);
}

function isTheme(value: unknown): value is Theme {
	return typeof value === "string" && THEME_SET.has(value);
}

function isContent(value: unknown): value is GenerateVisualParams["content"] {
	if (typeof value === "string") return true;
	if (Array.isArray(value)) {
		return value.every((item) => typeof item === "object" && item !== null && !Array.isArray(item));
	}
	// Plain object — used by structured types (e.g. diagram fgraph content).
	return typeof value === "object" && value !== null;
}

export function validateVisualType(type: unknown): VisualType {
	if (!isVisualType(type)) {
		throw new Error(
			`Invalid visual type: ${String(type)}. Must be one of: ${VALID_VISUAL_TYPES.join(", ")}`,
		);
	}
	return type;
}

/**
 * Tool-level aesthetic validation. Accepts any value from either the mermaid
 * palette set OR the fgraph aesthetic set; renderers narrow at render time
 * (mermaid → narrow to Aesthetic with isAesthetic; diagram → narrow to
 * FgraphAesthetic with isFgraphAesthetic).
 */
export function validateAesthetic(aesthetic: unknown): AnyAesthetic {
	if (aesthetic === undefined) return "blueprint";
	if (!isAnyAesthetic(aesthetic)) {
		console.warn(`Invalid aesthetic: ${String(aesthetic)}. Falling back to "blueprint"`);
		return "blueprint";
	}
	return aesthetic;
}

export function validateTheme(theme: unknown): Theme {
	if (theme === undefined) return "auto";
	if (!isTheme(theme)) {
		console.warn(`Invalid theme: ${String(theme)}. Falling back to "auto"`);
		return "auto";
	}
	return theme;
}

export function validateParams(params: unknown): GenerateVisualParams {
	if (!params || typeof params !== "object") {
		throw new Error("Parameters must be an object");
	}

	const titleValue = Reflect.get(params, "title");
	if (typeof titleValue !== "string" || titleValue.length === 0) {
		throw new Error("title is required and must be a non-empty string");
	}

	const contentValue = Reflect.get(params, "content");
	if (!isContent(contentValue)) {
		throw new Error("content is required and must be a string or an array of objects");
	}

	const type = validateVisualType(Reflect.get(params, "type"));
	const aesthetic = validateAesthetic(Reflect.get(params, "aesthetic"));
	const theme = validateTheme(Reflect.get(params, "theme"));

	const result: GenerateVisualParams = {
		type,
		content: contentValue,
		title: titleValue,
		aesthetic,
		theme,
	};

	const filenameValue = Reflect.get(params, "filename");
	if (typeof filenameValue === "string" && filenameValue.length > 0) {
		result.filename = filenameValue;
	}

	return result;
}

export function sanitizeFilename(filename: string): string {
	const base = filename.replace(/^[./\\]+/, "").replace(/[\\/:*?"<>|]/g, "-");
	if (!base.endsWith(".html")) {
		return `${base}.html`;
	}
	return base;
}

export function generateDefaultFilename(title: string): string {
	const isoDate = new Date().toISOString();
	const timestamp = isoDate.slice(0, 10);
	const sanitized = title
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
	return `${timestamp}-${sanitized || "visual"}.html`;
}
