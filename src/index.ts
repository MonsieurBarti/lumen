/**
 * @the-forge-flow/lumen — PI coding agent extension entry point.
 *
 * The same `skills/` directory is consumed by the Claude Code plugin
 * (`.claude-plugin/plugin.json`) and shipped to PI under `dist/skills/`
 * via the `prebuild` script in package.json.
 *
 * This module is intentionally minimal at v0.1.0: tools, commands, and
 * hooks are added incrementally as skill implementations land.
 */

export const LUMEN_VERSION = "0.1.0";

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

export type { LumenExtensionContext } from "./types.js";
