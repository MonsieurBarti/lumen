import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Guard against non-English content sneaking into shipped assets.
 *
 * Some upstreams we lift from (notably gmdiagram) ship Chinese-language
 * reference docs and example data. Before merging anything new under
 * skills/ or src/, check there's no CJK content. If we deliberately ship
 * a non-Latin string (e.g., a label inside a fixture), add it to ALLOWED.
 */

const ROOTS = ["skills", "src"];
const TEXT_EXTS = new Set([".md", ".json", ".html", ".css", ".js", ".ts", ".tsx", ".cjs"]);
const ALLOWED: ReadonlySet<string> = new Set([
	// Add explicit relative paths here ONLY when the non-Latin content is a
	// deliberate fixture or asset. Empty for now — v0.1 ships English only.
]);

const CJK_RANGES: ReadonlyArray<[number, number]> = [
	[0x3040, 0x309f], // Hiragana
	[0x30a0, 0x30ff], // Katakana
	[0x3400, 0x4dbf], // CJK Unified Ideographs Extension A
	[0x4e00, 0x9fff], // CJK Unified Ideographs
	[0xac00, 0xd7af], // Hangul Syllables
	[0xf900, 0xfaff], // CJK Compatibility Ideographs
];

function isCjk(codePoint: number): boolean {
	for (const [lo, hi] of CJK_RANGES) {
		if (codePoint >= lo && codePoint <= hi) return true;
	}
	return false;
}

function findCjkSample(text: string): { line: number; sample: string } | null {
	const lines = text.split("\n");
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i] ?? "";
		for (const ch of line) {
			const cp = ch.codePointAt(0);
			if (cp !== undefined && isCjk(cp)) {
				return { line: i + 1, sample: line.trim().slice(0, 120) };
			}
		}
	}
	return null;
}

function* walk(dir: string): Generator<string> {
	for (const entry of readdirSync(dir)) {
		const full = join(dir, entry);
		const st = statSync(full);
		if (st.isDirectory()) {
			yield* walk(full);
		} else if (st.isFile()) {
			yield full;
		}
	}
}

function relPath(absolute: string): string {
	const root = join(import.meta.dirname, "..");
	return absolute.startsWith(`${root}/`) ? absolute.slice(root.length + 1) : absolute;
}

describe("english-only content", () => {
	for (const root of ROOTS) {
		const absRoot = join(import.meta.dirname, "..", root);
		it(`${root}/ ships only English text (no CJK characters)`, () => {
			const offenders: string[] = [];
			for (const file of walk(absRoot)) {
				const ext = file.slice(file.lastIndexOf("."));
				if (!TEXT_EXTS.has(ext)) continue;
				const rel = relPath(file);
				if (ALLOWED.has(rel)) continue;
				const text = readFileSync(file, "utf8");
				const hit = findCjkSample(text);
				if (hit) {
					offenders.push(`${rel}:${hit.line} → ${hit.sample}`);
				}
			}
			expect(offenders, `Non-English content found:\n${offenders.join("\n")}`).toEqual([]);
		});
	}
});
