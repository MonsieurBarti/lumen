/**
 * Shared types for the lumen PI extension.
 * Lifted from @the-forge-flow/visual-explainer-pi: src/types.ts.
 *
 * v0.1.x ships only the `mermaid_custom` type fully wired. Other types are
 * declared so callers can pre-populate JSON, but `generateVisual` will throw
 * NotImplementedError for them until lumen-{diagram,chart,slides,...} land.
 */

export type VisualType =
	| "architecture"
	| "chart"
	| "diagram"
	| "flowchart"
	| "sequence"
	| "er"
	| "state"
	| "table"
	| "diff"
	| "plan"
	| "timeline"
	| "dashboard"
	| "slides"
	| "mermaid_custom";

export type Aesthetic =
	| "blueprint"
	| "editorial"
	| "paper"
	| "terminal"
	| "dracula"
	| "nord"
	| "solarized"
	| "gruvbox";

/**
 * Aesthetic palettes for fgraph (lumen-diagram) renderers. Loaded from
 * skills/_shared/aesthetics/{name}.css at render time. Shared across every
 * lumen renderer that produces fgraph / chart / guide / slide / gallery
 * output. Distinct from `Aesthetic` (which drives mermaid rendering through
 * PALETTES in src/templates/shared.ts).
 */
export type FgraphAesthetic = "blueprint" | "dark-professional" | "editorial" | "lyra" | "terminal";

/** Union accepted at the tool-param level; renderers narrow internally. */
export type AnyAesthetic = Aesthetic | FgraphAesthetic;

export type Theme = "light" | "dark" | "auto";

export interface GenerateVisualParams {
	type: VisualType;
	content: string | Record<string, unknown>[] | Record<string, unknown>;
	title: string;
	aesthetic?: AnyAesthetic;
	theme?: Theme;
	filename?: string;
}

export interface GenerateResult {
	filePath: string;
	previewSnippet: string;
	url: string;
}

export interface ExtensionState {
	recentFiles: string[];
	tempDirs: string[];
	defaultAesthetic: Aesthetic;
	defaultTheme: Theme;
}

export interface TemplateContext {
	title: string;
	content: unknown;
	aesthetic: Aesthetic;
	theme: Theme;
}

export interface Palette {
	[key: string]: string;
	bg: string;
	surface: string;
	surface2: string;
	surfaceElevated: string;
	border: string;
	borderBright: string;
	text: string;
	textDim: string;
	accent: string;
	accentDim: string;
	green: string;
	greenDim: string;
	orange: string;
	orangeDim: string;
	teal: string;
	tealDim: string;
	plum: string;
	plumDim: string;
}

export type FontPairing = {
	body: string;
	mono: string;
};
