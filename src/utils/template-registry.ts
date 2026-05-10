/**
 * Slide template registry loader — reads and validates the lumen-slides
 * pattern metadata from skills/lumen-slides/_templates/index.json.
 *
 * Path resolution: tries two candidate directories in order, uses the first
 * that exists. Production install ships skills/ both at the package root AND
 * mirrored at dist/skills/ (per the prebuild script in package.json).
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const CANDIDATE_TEMPLATE_DIRS = [
	join(__dirname, "..", "skills", "lumen-slides", "_templates"),
	join(__dirname, "..", "..", "skills", "lumen-slides", "_templates"),
] as const;

let resolvedTemplateDir: string | undefined;

function resolveTemplateDir(): string {
	if (resolvedTemplateDir !== undefined) return resolvedTemplateDir;
	for (const dir of CANDIDATE_TEMPLATE_DIRS) {
		if (existsSync(dir)) {
			resolvedTemplateDir = dir;
			return dir;
		}
	}
	throw new Error(
		`Could not locate slide template directory. Tried: ${CANDIDATE_TEMPLATE_DIRS.join(", ")}. Ensure the package was built (bun run build) so dist/skills/ exists.`,
	);
}

export interface SlidePattern {
	pattern_key: string;
	name: string;
	description: string;
	composition_variants: string[];
	required_slots: string[];
	optional_slots: string[];
	css_class_contract: string[];
	supports_reveal: boolean;
}

export interface TemplateRegistry {
	version: string;
	patterns: SlidePattern[];
}

const REQUIRED_PATTERN_FIELDS: readonly (keyof SlidePattern)[] = [
	"pattern_key",
	"name",
	"description",
	"composition_variants",
	"required_slots",
	"optional_slots",
	"css_class_contract",
	"supports_reveal",
];

let cachedRegistry: TemplateRegistry | undefined;
let cachedPatternMap: Map<string, SlidePattern> | undefined;

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
	if (!Array.isArray(value)) return false;
	return value.every((item) => typeof item === "string");
}

function isBoolean(value: unknown): value is boolean {
	return typeof value === "boolean";
}

function isPattern(value: unknown, index: number): value is SlidePattern {
	if (!isPlainObject(value)) {
		throw new Error(`Pattern at index ${index} is not an object`);
	}
	for (const field of REQUIRED_PATTERN_FIELDS) {
		const fieldValue = Reflect.get(value, field);
		if (fieldValue === undefined) {
			throw new Error(`Pattern at index ${index} is missing required field: ${field}`);
		}
		if (field === "supports_reveal") {
			if (!isBoolean(fieldValue)) {
				throw new Error(
					`Pattern at index ${index} has invalid type for ${field}: expected boolean, got ${typeof fieldValue}`,
				);
			}
		} else if (
			field === "composition_variants" ||
			field === "required_slots" ||
			field === "optional_slots" ||
			field === "css_class_contract"
		) {
			if (!isStringArray(fieldValue)) {
				throw new Error(
					`Pattern at index ${index} has invalid type for ${field}: expected array of strings`,
				);
			}
		} else if (typeof fieldValue !== "string") {
			throw new Error(
				`Pattern at index ${index} has invalid type for ${field}: expected string, got ${typeof fieldValue}`,
			);
		}
	}
	return true;
}

function validateRegistry(value: unknown): TemplateRegistry {
	if (!isPlainObject(value)) {
		throw new Error("Template registry must be a JSON object");
	}

	const version = Reflect.get(value, "version");
	if (typeof version !== "string") {
		throw new Error(`Template registry must have a string 'version' field; got ${typeof version}`);
	}

	const patterns = Reflect.get(value, "patterns");
	if (!Array.isArray(patterns)) {
		throw new Error(
			`Template registry must have an array 'patterns' field; got ${typeof patterns}`,
		);
	}
	if (patterns.length !== 10) {
		throw new Error(`Template registry must contain exactly 10 patterns; found ${patterns.length}`);
	}

	const validatedPatterns: SlidePattern[] = [];
	const seenKeys = new Set<string>();

	for (let i = 0; i < patterns.length; i++) {
		const pattern = patterns[i];
		if (!isPattern(pattern, i)) {
			throw new Error(`Pattern at index ${i} failed validation`);
		}
		if (seenKeys.has(pattern.pattern_key)) {
			throw new Error(
				`Duplicate pattern_key "${pattern.pattern_key}" at index ${i}. Each pattern_key must be unique.`,
			);
		}
		seenKeys.add(pattern.pattern_key);
		validatedPatterns.push(pattern);
	}

	return { version, patterns: validatedPatterns };
}

/** Load and validate the slide template registry. Cached after first call. */
export function loadTemplateRegistry(): TemplateRegistry {
	if (cachedRegistry !== undefined) return cachedRegistry;

	const path = join(resolveTemplateDir(), "index.json");
	if (!existsSync(path)) {
		throw new Error(`Template registry file not found: ${path}`);
	}

	const raw = readFileSync(path, "utf-8");
	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch (cause) {
		throw new Error(
			`Failed to parse template registry JSON at ${path}: ${cause instanceof Error ? cause.message : String(cause)}`,
		);
	}

	cachedRegistry = validateRegistry(parsed);
	return cachedRegistry;
}

/** Look up a slide pattern by its pattern_key. Uses the cached registry. */
export function getPatternByKey(key: string): SlidePattern | undefined {
	if (cachedPatternMap === undefined) {
		const registry = loadTemplateRegistry();
		cachedPatternMap = new Map(registry.patterns.map((p) => [p.pattern_key, p]));
	}
	return cachedPatternMap.get(key);
}
