import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { LUMEN_CAPABILITIES, LUMEN_COMPOSITES, LUMEN_PLAYBOOKS } from "../src/index.js";

const ROOT = join(import.meta.dirname, "..");
const SKILLS_DIR = join(ROOT, "skills");

const TIERS: ReadonlyArray<readonly [string, readonly string[]]> = [
	["skills", LUMEN_CAPABILITIES],
	["composites", LUMEN_COMPOSITES],
	["playbooks", LUMEN_PLAYBOOKS],
];

describe("skill manifest integrity", () => {
	for (const [tierDir, ids] of TIERS) {
		for (const skill of ids) {
			it(`${skill} (in ${tierDir}/) has a SKILL.md with required frontmatter`, () => {
				const path = join(ROOT, tierDir, skill, "SKILL.md");
				expect(existsSync(path), `Missing ${path}`).toBe(true);
				const body = readFileSync(path, "utf8");
				expect(body, "frontmatter must start at line 1").toMatch(/^---\n/);
				expect(body).toMatch(/^name: /m);
				expect(body).toMatch(/^description: /m);
				expect(body).toMatch(/^version: \d+\.\d+\.\d+/m);
			});

			it(`${skill} has a NOTICE.md (capabilities only; composites + playbooks are novel orchestration)`, () => {
				// lumen-mermaid is the one capability whose assets live in src/templates/shared.ts,
				// not in skills/lumen-mermaid/, so its provenance is in the file header.
				if (skill === "lumen-mermaid") return;
				// Composites and playbooks compose existing capabilities; their constituent
				// capabilities carry the upstream attribution.
				if (tierDir !== "skills") return;
				const path = join(ROOT, tierDir, skill, "NOTICE.md");
				expect(existsSync(path), `Missing ${path}`).toBe(true);
				const body = readFileSync(path, "utf8");
				expect(body.toLowerCase()).toContain("mit");
			});
		}
	}
});

describe("lumen-chart assets", () => {
	const DIR = join(SKILLS_DIR, "lumen-chart");

	const types = ["area", "bar", "bubble", "funnel", "line", "pie", "radar", "scatter", "table"];

	it("ships 9 chart-type schemas + shared", () => {
		for (const t of types) {
			expect(existsSync(join(DIR, "schemas", `schema-${t}.json`))).toBe(true);
		}
		expect(existsSync(join(DIR, "schemas", "schema-shared.json"))).toBe(true);
	});

	it("ships chart-recipes.md (English-only replacement for the Chinese gmdiagram refs)", () => {
		const path = join(DIR, "references", "chart-recipes.md");
		expect(existsSync(path)).toBe(true);
		const body = readFileSync(path, "utf8");
		expect(body).toContain("Nice Numbers");
		// Per-type recipe sections
		for (const t of ["Bar", "Line", "Pie", "Scatter", "Radar", "Funnel", "Bubble", "Table"]) {
			expect(body).toContain(`### ${t}`);
		}
	});

	it("ships 3 English-only example HTML+JSON pairs", () => {
		const examples = ["product-comparison", "team-performance", "team-skills"];
		for (const e of examples) {
			expect(existsSync(join(DIR, "examples", `${e}.html`))).toBe(true);
			expect(existsSync(join(DIR, "examples", `${e}.json`))).toBe(true);
		}
	});
});

describe("lumen-recap assets", () => {
	const DIR = join(SKILLS_DIR, "lumen-recap");

	it("ships recap-recipe.md lifted from visual-explainer", () => {
		const path = join(DIR, "references", "recap-recipe.md");
		expect(existsSync(path)).toBe(true);
		const body = readFileSync(path, "utf8");
		expect(body).toMatch(/Project identity|Architecture snapshot|Recent activity/);
	});
});

describe("lumen-fact-check assets", () => {
	const DIR = join(SKILLS_DIR, "lumen-fact-check");

	it("ships fact-check-recipe.md lifted from visual-explainer", () => {
		const path = join(DIR, "references", "fact-check-recipe.md");
		expect(existsSync(path)).toBe(true);
		const body = readFileSync(path, "utf8");
		expect(body).toMatch(/Phase 1|Extract claims|Verify against source/);
	});
});

describe("lumen-guide assets", () => {
	const DIR = join(SKILLS_DIR, "lumen-guide");

	it("ships components.css with card + lane + phase variants", () => {
		const path = join(DIR, "components", "components.css");
		expect(existsSync(path)).toBe(true);
		const css = readFileSync(path, "utf8");
		expect(css).toContain(".card");
		expect(css).toContain(".lane");
		expect(css).toContain(".phase");
	});

	it("ships single + split shells", () => {
		expect(existsSync(join(DIR, "shells", "single.html"))).toBe(true);
		expect(existsSync(join(DIR, "shells", "split.html"))).toBe(true);
	});

	it("ships base components (reset, typography, layout, tab-loader, theme-toggle)", () => {
		const expected = [
			"reset.css",
			"typography.css",
			"layout.css",
			"tab-loader.js",
			"theme-toggle.js",
		];
		for (const f of expected) {
			expect(existsSync(join(DIR, "components", f)), `Missing ${f}`).toBe(true);
		}
	});

	it("ships methodology references (frame-phase, output-ux, css-patterns, anti-patterns)", () => {
		const expected = [
			"frame-phase.md",
			"output-ux.md",
			"css-patterns.md",
			"anti-patterns.md",
			"design-phase-two-track.md",
			"tokens.md",
			"phase-3-generate.md",
		];
		for (const f of expected) {
			expect(existsSync(join(DIR, "references", f)), `Missing ${f}`).toBe(true);
		}
	});
});

describe("lumen-gallery assets", () => {
	const DIR = join(SKILLS_DIR, "lumen-gallery");

	it("ships 5 gallery templates", () => {
		const templates = [
			"pivot-gallery",
			"simple-gallery",
			"comparison-gallery",
			"audio-gallery",
			"multi-mode-gallery",
		];
		for (const t of templates) {
			expect(existsSync(join(DIR, "templates", `${t}.html`))).toBe(true);
		}
	});

	it("ships gallery-base.{css,js} runtime", () => {
		expect(existsSync(join(DIR, "templates", "gallery-base.css"))).toBe(true);
		expect(existsSync(join(DIR, "templates", "gallery-base.js"))).toBe(true);
	});

	it("ships 4 fixtures", () => {
		for (const f of ["audio.json", "comparison.json", "pivot.json", "simple.json"]) {
			expect(existsSync(join(DIR, "fixtures", f))).toBe(true);
		}
	});
});

describe("lumen-slides assets", () => {
	const DIR = join(SKILLS_DIR, "lumen-slides");

	it("ships slide-deck.html with SlideEngine", () => {
		const path = join(DIR, "templates", "slide-deck.html");
		expect(existsSync(path)).toBe(true);
		const body = readFileSync(path, "utf8");
		expect(body).toContain("<!DOCTYPE html>");
		expect(body.length).toBeGreaterThan(5000);
	});

	it("ships slide-deck-base.css from roxabi", () => {
		expect(existsSync(join(DIR, "templates", "slide-deck-base.css"))).toBe(true);
	});

	it("ships slide-patterns.md from both upstreams", () => {
		expect(existsSync(join(DIR, "references", "slide-patterns.md"))).toBe(true);
		expect(existsSync(join(DIR, "references", "slide-patterns-roxabi.md"))).toBe(true);
	});

	it("ships generate-slides recipe + libraries reference", () => {
		expect(existsSync(join(DIR, "references", "generate-slides-recipe.md"))).toBe(true);
		expect(existsSync(join(DIR, "references", "libraries.md"))).toBe(true);
	});
});

describe("lumen-diagram templates", () => {
	const TEMPLATES_DIR = join(SKILLS_DIR, "lumen-diagram", "templates");

	const expectedTopologies = [
		"radial-hub",
		"radial-ring",
		"linear-flow",
		"lane-swim",
		"layered",
		"deployment-tiers",
		"machine-clusters",
		"sequence",
		"state",
		"gantt",
		"pie",
		"er",
		"dep-graph",
		"dual-cluster",
		"system-architecture",
	];

	it("ships all 15 fgraph topologies referenced by the SKILL.md", () => {
		for (const name of expectedTopologies) {
			const path = join(TEMPLATES_DIR, `${name}.html`);
			expect(existsSync(path), `Missing template: ${path}`).toBe(true);
			expect(statSync(path).size, `Empty template: ${path}`).toBeGreaterThan(0);
		}
	});

	it("ships fgraph-base.css", () => {
		const path = join(TEMPLATES_DIR, "fgraph-base.css");
		expect(existsSync(path)).toBe(true);
		const css = readFileSync(path, "utf8");
		expect(css.length).toBeGreaterThan(100);
	});

	it("ships a NOTICE.md attributing the upstream", () => {
		const path = join(TEMPLATES_DIR, "NOTICE.md");
		expect(existsSync(path)).toBe(true);
		const notice = readFileSync(path, "utf8");
		expect(notice.toLowerCase()).toContain("roxabi-forge");
		expect(notice.toLowerCase()).toContain("mit");
	});

	it("does not ship unexpected files in templates/", () => {
		const expected = new Set([
			...expectedTopologies.map((n) => `${n}.html`),
			"fgraph-base.css",
			"NOTICE.md",
			"ai-patterns.md",
		]);
		const actual = new Set(readdirSync(TEMPLATES_DIR));
		const unexpected = [...actual].filter((f) => !expected.has(f));
		expect(unexpected, `Unexpected files: ${unexpected.join(", ")}`).toEqual([]);
	});

	it("ships ai-patterns.md restating fireworks-tech-graph recipes", () => {
		const path = join(TEMPLATES_DIR, "ai-patterns.md");
		expect(existsSync(path)).toBe(true);
		const body = readFileSync(path, "utf8");
		// One section heading per pattern
		for (const pattern of ["RAG", "Mem0", "Multi-agent", "Tool-call", "memory types"]) {
			expect(body).toContain(pattern);
		}
	});
});

describe("shared aesthetics (skills/_shared/aesthetics/)", () => {
	const AESTHETICS_DIR = join(SKILLS_DIR, "_shared", "aesthetics");

	const expectedAesthetics = ["dark-professional", "editorial", "blueprint", "terminal", "lyra"];

	for (const aesthetic of expectedAesthetics) {
		it(`ships ${aesthetic}.css`, () => {
			const path = join(AESTHETICS_DIR, `${aesthetic}.css`);
			expect(existsSync(path)).toBe(true);
			const css = readFileSync(path, "utf8");
			expect(css.length).toBeGreaterThan(200);
			// Each aesthetic must define the core fgraph token surface
			expect(css).toMatch(/--bg\s*:/);
			expect(css).toMatch(/--text\s*:/);
		});
	}

	it("ships a NOTICE.md with attribution", () => {
		const path = join(AESTHETICS_DIR, "NOTICE.md");
		expect(existsSync(path)).toBe(true);
		const body = readFileSync(path, "utf8");
		expect(body).toContain("roxabi-forge");
		expect(body).toContain("architecture-diagram-generator");
	});
});

describe("lumen-diagram examples", () => {
	const EXAMPLES_DIR = join(SKILLS_DIR, "lumen-diagram", "examples");

	const expectedExamples = [
		"web-app",
		"microservices",
		"aws-serverless",
		"dep-graph",
		"er-schema",
		"gantt-roadmap",
		"pie-composition",
		"sequence-api",
		"state-machine",
		"system-architecture",
	];

	for (const name of expectedExamples) {
		it(`ships examples/${name}.html`, () => {
			const path = join(EXAMPLES_DIR, `${name}.html`);
			expect(existsSync(path)).toBe(true);
			const body = readFileSync(path, "utf8");
			expect(body).toContain("<!DOCTYPE html>");
			expect(body.length).toBeGreaterThan(500);
		});
	}

	it("ships a NOTICE.md", () => {
		expect(existsSync(join(EXAMPLES_DIR, "NOTICE.md"))).toBe(true);
	});
});
