import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
	LUMEN_CAPABILITIES,
	LUMEN_COMPOSITES,
	LUMEN_PLAYBOOKS,
	LUMEN_SKILLS,
} from "../src/index.js";

const ROOT = join(import.meta.dirname, "..");

const SKILL_ROOTS: ReadonlyArray<readonly [string, readonly string[]]> = [
	["skills", LUMEN_CAPABILITIES],
	["composites", LUMEN_COMPOSITES],
	["playbooks", LUMEN_PLAYBOOKS],
];

const PLATFORM_COMPAT = /Claude Code.*Pi.*OMP/i;

function readSkillFrontmatter(skillPath: string): string {
	const body = readFileSync(skillPath, "utf8");
	const end = body.indexOf("\n---", 4);
	expect(end).toBeGreaterThan(0);
	return body.slice(0, end + 4);
}

describe("cross-platform compatibility", () => {
	it("README documents Claude Code, Pi, and OMP install paths", () => {
		const readme = readFileSync(join(ROOT, "README.md"), "utf8");
		expect(readme).toMatch(/Claude Code/i);
		expect(readme).toMatch(/pi\.dev|PI coding agent/i);
		expect(readme).toMatch(/omp\.sh|OMP/i);
	});

	it("package.json exposes omp+pi source manifests and slides export bin", () => {
		const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")) as {
			omp?: { extensions?: string[]; skills?: string[] };
			pi?: { extensions?: string[]; skills?: string[] };
			bin?: Record<string, string>;
			files?: string[];
			keywords?: string[];
			scripts?: Record<string, string>;
		};
		const skillRoots = ["./skills", "./composites", "./playbooks"];
		for (const manifest of [pkg.omp, pkg.pi]) {
			expect(manifest?.extensions).toEqual(["./src/index.ts"]);
			expect(manifest?.skills).toEqual(skillRoots);
		}
		expect(existsSync(join(ROOT, "src/index.ts"))).toBe(true);
		expect(pkg.files).toEqual(expect.arrayContaining(["src", "skills", "dist"]));
		expect(pkg.scripts?.prepack).toMatch(/build/);
		expect(pkg.bin?.["lumen-export-slides"]).toBe("./dist/cli/export-slides.js");
		expect(pkg.keywords).toEqual(expect.arrayContaining(["agent-skills", "omp"]));
	});

	it("GitHub/OMP install does not require a committed dist/ tree", () => {
		const gitignore = readFileSync(join(ROOT, ".gitignore"), "utf8");
		expect(gitignore).toMatch(/^dist\/$/m);
		const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")) as {
			omp?: { extensions?: string[] };
			pi?: { extensions?: string[] };
		};
		for (const entry of [...(pkg.omp?.extensions ?? []), ...(pkg.pi?.extensions ?? [])]) {
			expect(entry.startsWith("./dist/"), `${entry} must not point at gitignored dist/`).toBe(
				false,
			);
			expect(existsSync(join(ROOT, entry))).toBe(true);
		}
	});

	it("extension uses named typebox import (OMP remaps default imports incorrectly)", () => {
		const src = readFileSync(join(ROOT, "src/index.ts"), "utf8");
		expect(src).toMatch(/import\s*\{\s*Type\s*\}\s*from\s*["']typebox["']/);
		expect(src).not.toMatch(/import\s+Type\s+from\s*["']typebox["']/);
		expect(src).not.toMatch(/from\s*["']@mariozechner\/pi-ai["']/);
	});

	it("ships platform path guidance for harness-agnostic asset resolution", () => {
		const path = join(ROOT, "skills/_shared/platform-paths.md");
		expect(existsSync(path)).toBe(true);
		const body = readFileSync(path, "utf8");
		expect(body).toMatch(/Claude Code/);
		expect(body).toMatch(/Pi/);
		expect(body).toMatch(/OMP/);
	});

	for (const [tierDir, ids] of SKILL_ROOTS) {
		for (const id of ids) {
			it(`${id} declares Agent Skills license + multi-harness compatibility`, () => {
				const fm = readSkillFrontmatter(join(ROOT, tierDir, id, "SKILL.md"));
				expect(fm).toMatch(/^license: MIT/m);
				expect(fm).toMatch(/^compatibility: /m);
				expect(fm).toMatch(PLATFORM_COMPAT);
			});
		}
	}

	it("registers every shipped skills/*/ directory (except _shared) in LUMEN_CAPABILITIES", () => {
		const onDisk = readdirSync(join(ROOT, "skills")).filter((d) => d !== "_shared");
		for (const dir of onDisk) {
			expect(
				LUMEN_CAPABILITIES as readonly string[],
				`${dir} exists on disk but is not in LUMEN_CAPABILITIES`,
			).toContain(dir);
		}
	});

	it("LUMEN_SKILLS matches on-disk tier directories", () => {
		const expected = [
			...LUMEN_CAPABILITIES.map((id) => `skills/${id}`),
			...LUMEN_COMPOSITES.map((id) => `composites/${id}`),
			...LUMEN_PLAYBOOKS.map((id) => `playbooks/${id}`),
		];
		for (const rel of expected) {
			expect(existsSync(join(ROOT, rel, "SKILL.md")), `missing ${rel}/SKILL.md`).toBe(true);
		}
		expect(LUMEN_SKILLS.length).toBe(expected.length);
	});
});
