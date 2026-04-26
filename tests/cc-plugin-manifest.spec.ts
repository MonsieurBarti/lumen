import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Catch CC plugin manifest schema drift before install-time.
 *
 * Real bug class (caught at install time, not CI):
 *   - `author` must be an object {name,url?}, not a string.
 *   - `skills` must be a string path to the skills directory, not an array.
 *   - plugin.json version MUST match package.json version (release-please
 *     bumps both via the extra-files entry).
 */

const ROOT = join(import.meta.dirname, "..");

interface PluginManifest {
	name?: unknown;
	version?: unknown;
	description?: unknown;
	author?: unknown;
	license?: unknown;
	homepage?: unknown;
	skills?: unknown;
}

function readJson<T>(relative: string): T {
	const text = readFileSync(join(ROOT, relative), "utf8");
	return JSON.parse(text) as T;
}

describe("CC plugin manifest (.claude-plugin/plugin.json)", () => {
	const manifest = readJson<PluginManifest>(".claude-plugin/plugin.json");
	const pkg = readJson<{ version?: unknown }>("package.json");

	it("has the required top-level fields", () => {
		expect(typeof manifest.name).toBe("string");
		expect(typeof manifest.version).toBe("string");
		expect(typeof manifest.description).toBe("string");
		expect(typeof manifest.license).toBe("string");
	});

	it("declares author as an object with name (not a bare string)", () => {
		expect(manifest.author).not.toBeNull();
		expect(typeof manifest.author).toBe("object");
		expect(Array.isArray(manifest.author)).toBe(false);
		const author = manifest.author as { name?: unknown };
		expect(typeof author.name).toBe("string");
	});

	it("declares skills as a string path (CC discovers subdirs from this)", () => {
		expect(typeof manifest.skills).toBe("string");
		expect(Array.isArray(manifest.skills)).toBe(false);
		expect(manifest.skills).toMatch(/skills\/?$/);
	});

	it("version matches package.json version", () => {
		expect(typeof manifest.version).toBe("string");
		expect(typeof pkg.version).toBe("string");
		expect(manifest.version).toBe(pkg.version);
	});

	it("name matches the unscoped npm name segment", () => {
		expect(manifest.name).toBe("lumen");
	});
});

describe("CC marketplace manifest (.claude-plugin/marketplace.json)", () => {
	const marketplace = readJson<{
		name?: unknown;
		owner?: { name?: unknown; url?: unknown };
		plugins?: Array<{ name?: unknown; source?: unknown; description?: unknown }>;
	}>(".claude-plugin/marketplace.json");

	it("has owner as object with name + url", () => {
		expect(typeof marketplace.owner).toBe("object");
		expect(typeof marketplace.owner?.name).toBe("string");
		expect(typeof marketplace.owner?.url).toBe("string");
	});

	it("lists exactly one plugin pointing at this repo", () => {
		expect(Array.isArray(marketplace.plugins)).toBe(true);
		expect(marketplace.plugins?.length).toBe(1);
		expect(marketplace.plugins?.[0]?.name).toBe("lumen");
		expect(marketplace.plugins?.[0]?.source).toBe("./");
	});
});
