import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { LUMEN_CAPABILITIES, LUMEN_COMPOSITES, LUMEN_PLAYBOOKS } from "../src/index.js";

/**
 * Skill graph integrity — static checks against the tier model
 * (capabilities / composites / playbooks).
 *
 * Why static? Live LLM evals (does CC route prompt X to skill Y?) are
 * stochastic, expensive, and flaky in CI. These checks catch the
 * structural drift that breaks reliability deterministically:
 *
 *   - Atoms accidentally reference other skills (breaks atom contract).
 *   - Composites reference skills that don't exist (typo / rename rot).
 *   - Composites reference other composites (graph depth blow-up; Shiv's
 *     circular-dep + reliability-ceiling concerns).
 *   - Playbooks miss the "ask before acting" structural section.
 *   - Tier banners drift / disappear silently.
 *
 * Live eval harness can layer on top later. For now, these guard the
 * floor.
 */

const ROOT = join(import.meta.dirname, "..");

const TIER_BANNERS = {
	capability: "**Tier:** capability (atomic) — does not invoke other lumen skills.",
	composite: "**Tier:** composite (molecular)",
	playbook: "**Tier:** playbook (compound)",
} as const;

interface SkillSpec {
	id: string;
	tierDir: "skills" | "composites" | "playbooks";
	body: string;
}

function loadSkill(id: string, tierDir: "skills" | "composites" | "playbooks"): SkillSpec {
	const body = readFileSync(join(ROOT, tierDir, id, "SKILL.md"), "utf8");
	return { id, tierDir, body };
}

const allSkillIds: ReadonlySet<string> = new Set([
	...LUMEN_CAPABILITIES,
	...LUMEN_COMPOSITES,
	...LUMEN_PLAYBOOKS,
]);

/**
 * Extract the contents of a `## Heading` section (up to the next `## `
 * heading or end-of-file). Returns "" if the heading is absent.
 */
function extractSection(body: string, heading: string): string {
	const marker = `\n## ${heading}`;
	const start = body.indexOf(marker);
	if (start < 0) return "";
	const after = start + marker.length;
	const next = body.indexOf("\n## ", after);
	return next < 0 ? body.slice(after) : body.slice(after, next);
}

/**
 * Find every `lumen-<id>` token referenced in a body slice, excluding
 * the skill's own ID. We deliberately scope reference-integrity checks
 * to the section where invocation actually happens (Pipeline /
 * Default plan), so that incidental cross-references in
 * "Do NOT invoke" / "See also" don't trigger false positives.
 */
function referencedSkillIdsIn(text: string, selfId: string): Set<string> {
	const found = new Set<string>();
	const re = /\blumen-[a-z][a-z0-9-]*\b/g;
	const matches = text.match(re);
	if (!matches) return found;
	for (const m of matches) {
		if (m === selfId) continue;
		if (allSkillIds.has(m)) found.add(m);
	}
	return found;
}

describe("tier banners", () => {
	for (const id of LUMEN_CAPABILITIES) {
		it(`${id} declares the capability (atomic) tier banner`, () => {
			const spec = loadSkill(id, "skills");
			expect(spec.body).toContain(TIER_BANNERS.capability);
		});
	}
	for (const id of LUMEN_COMPOSITES) {
		it(`${id} declares the composite (molecular) tier banner`, () => {
			const spec = loadSkill(id, "composites");
			expect(spec.body).toContain(TIER_BANNERS.composite);
		});
	}
	for (const id of LUMEN_PLAYBOOKS) {
		it(`${id} declares the playbook (compound) tier banner`, () => {
			const spec = loadSkill(id, "playbooks");
			expect(spec.body).toContain(TIER_BANNERS.playbook);
		});
	}
});

// Note: the atom contract for capabilities is enforced by the tier banner
// test ("Tier: capability (atomic) — does not invoke other lumen skills").
// We deliberately do NOT grep capability Pipelines for `lumen-*` mentions,
// because capabilities legitimately cross-reference each other for context
// ("see lumen-mermaid for the shell pattern") — those are documentation
// redirects, not invocations, and a grep-based check can't distinguish
// them without becoming brittle. The agent-facing contract is the banner.

describe("composite structure", () => {
	for (const id of LUMEN_COMPOSITES) {
		it(`${id} has a Pipeline section`, () => {
			const spec = loadSkill(id, "composites");
			expect(spec.body).toMatch(/\n## Pipeline/);
		});
		it(`${id} has a Reliability contract section`, () => {
			const spec = loadSkill(id, "composites");
			expect(spec.body).toMatch(/\n## Reliability contract/);
		});
		it(`${id} Pipeline only invokes known capabilities (no broken refs, no composite-of-composite)`, () => {
			const spec = loadSkill(id, "composites");
			const pipeline = extractSection(spec.body, "Pipeline");
			const refs = referencedSkillIdsIn(pipeline, id);
			for (const ref of refs) {
				const isCapability = LUMEN_CAPABILITIES.some((c) => c === ref);
				expect(
					isCapability,
					`${id} Pipeline invokes ${ref}, which is not a capability. Composites may only call capabilities (atoms).`,
				).toBe(true);
			}
		});
	}
});

describe("playbook structure", () => {
	for (const id of LUMEN_PLAYBOOKS) {
		it(`${id} has a Default plan section`, () => {
			const spec = loadSkill(id, "playbooks");
			expect(spec.body).toMatch(/\n## Default plan/);
		});
		it(`${id} has a Decisions to surface section (human-in-the-loop contract)`, () => {
			const spec = loadSkill(id, "playbooks");
			expect(spec.body).toMatch(/\n## Decisions to surface/);
		});
		it(`${id} Default plan references at least one composite`, () => {
			const spec = loadSkill(id, "playbooks");
			const plan = extractSection(spec.body, "Default plan");
			const refs = referencedSkillIdsIn(plan, id);
			const composites = [...refs].filter((r) => LUMEN_COMPOSITES.some((c) => c === r));
			expect(
				composites.length,
				`${id} Default plan should orchestrate composites; found refs to: ${[...refs].join(", ") || "(none)"}`,
			).toBeGreaterThan(0);
		});
	}
});

describe("graph hygiene", () => {
	it("no skill ID appears in more than one tier", () => {
		const seen = new Map<string, string>();
		for (const id of LUMEN_CAPABILITIES) seen.set(id, "capability");
		for (const id of LUMEN_COMPOSITES) {
			expect(seen.has(id), `${id} is both a capability and a composite`).toBe(false);
			seen.set(id, "composite");
		}
		for (const id of LUMEN_PLAYBOOKS) {
			expect(seen.has(id), `${id} appears in multiple tiers`).toBe(false);
			seen.set(id, "playbook");
		}
	});

	it("the union LUMEN_SKILLS contains every tiered skill exactly once", () => {
		const total = LUMEN_CAPABILITIES.length + LUMEN_COMPOSITES.length + LUMEN_PLAYBOOKS.length;
		const unique = new Set([...LUMEN_CAPABILITIES, ...LUMEN_COMPOSITES, ...LUMEN_PLAYBOOKS]);
		expect(unique.size).toBe(total);
	});
});
