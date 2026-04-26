/**
 * Aesthetic CSS loader — reads palette CSS files from skills/_shared/aesthetics/
 * at render time. Used by every deterministic renderer that produces fgraph or
 * chart output (and, eventually, slides / guides / recaps when those go
 * deterministic).
 *
 * Path resolution: tries two candidate directories in order, uses the first
 * that exists. Production install ships skills/ both at the package root
 * (per package.files) AND mirrored at dist/skills/ (per the prebuild script
 * in package.json), so either layout resolves cleanly.
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import type { FgraphAesthetic } from "../types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Candidate locations for the aesthetics CSS directory. Try each in order.
 *   - production install: <pkg>/dist/utils/ → <pkg>/dist/skills/_shared/aesthetics/
 *   - dev / vitest: src/utils/ → repo-root/skills/_shared/aesthetics/
 */
const CANDIDATE_AESTHETICS_DIRS = [
	join(__dirname, "..", "skills", "_shared", "aesthetics"),
	join(__dirname, "..", "..", "skills", "_shared", "aesthetics"),
] as const;

let resolvedAestheticsDir: string | undefined;

function resolveAestheticsDir(): string {
	if (resolvedAestheticsDir !== undefined) return resolvedAestheticsDir;
	for (const dir of CANDIDATE_AESTHETICS_DIRS) {
		if (existsSync(dir)) {
			resolvedAestheticsDir = dir;
			return dir;
		}
	}
	throw new Error(
		`Could not locate fgraph aesthetics directory. Tried: ${CANDIDATE_AESTHETICS_DIRS.join(", ")}. Ensure the package was built (bun run build) so dist/skills/ exists.`,
	);
}

const aestheticCache = new Map<FgraphAesthetic, string>();

/** Read and cache an aesthetic CSS file. */
export function loadAestheticCss(aesthetic: FgraphAesthetic): string {
	const cached = aestheticCache.get(aesthetic);
	if (cached !== undefined) return cached;
	const path = join(resolveAestheticsDir(), `${aesthetic}.css`);
	if (!existsSync(path)) {
		throw new Error(`Aesthetic CSS file not found: ${path}`);
	}
	const css = readFileSync(path, "utf-8");
	aestheticCache.set(aesthetic, css);
	return css;
}
