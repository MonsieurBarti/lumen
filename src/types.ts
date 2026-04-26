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

export type Theme = "light" | "dark" | "auto";

export interface GenerateVisualParams {
	type: VisualType;
	content: string | Record<string, unknown>[];
	title: string;
	aesthetic?: Aesthetic;
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
