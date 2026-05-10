/**
 * Theme resolver — discovers CSS themes for slide decks via hierarchical lookup.
 *
 * Resolution order (highest priority wins):
 *   1. <cwd>/_theme.css               — per-project override
 *   2. ~/.agent/lumen/_theme.css     — user-global override
 *   3. skills/_shared/aesthetics/{preset}.css — built-in fallback
 */

import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

import { loadAestheticCss } from "./aesthetic-loader.js";
import { isFgraphAesthetic } from "./validators.js";

export interface ResolvedTheme {
	css: string;
	source: "project" | "global" | "preset";
	path: string;
}

export async function resolveTheme(
	options: { cwd?: string; preset?: string } = {},
): Promise<ResolvedTheme> {
	const cwd = options.cwd ?? process.cwd();
	const preset = options.preset ?? "editorial";

	function isEnoent(err: unknown): boolean {
		return err instanceof Error && Reflect.get(err, "code") === "ENOENT";
	}

	const projectPath = join(cwd, "_theme.css");
	try {
		const css = await readFile(projectPath, "utf-8");
		return { css, source: "project", path: projectPath };
	} catch (err) {
		if (!isEnoent(err)) throw err;
	}

	const globalPath = join(homedir(), ".agent", "lumen", "_theme.css");
	try {
		const css = await readFile(globalPath, "utf-8");
		return { css, source: "global", path: globalPath };
	} catch (err) {
		if (!isEnoent(err)) throw err;
	}

	if (!isFgraphAesthetic(preset)) {
		throw new Error(`Unknown aesthetic preset: ${preset}`);
	}
	const css = loadAestheticCss(preset);
	return {
		css,
		source: "preset",
		path: `skills/_shared/aesthetics/${preset}.css`,
	};
}
