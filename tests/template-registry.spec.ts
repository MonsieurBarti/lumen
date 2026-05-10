import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const originalFs = await vi.importActual<typeof import("node:fs")>("node:fs");

vi.mock("node:fs", async (importOriginal) => {
	const mod = await importOriginal<typeof import("node:fs")>();
	return {
		...mod,
		existsSync: vi.fn(mod.existsSync),
		readFileSync: vi.fn(mod.readFileSync),
	};
});

const tempDir = join(tmpdir(), `lumen-registry-test-${Date.now()}`);

beforeAll(() => {
	mkdirSync(tempDir, { recursive: true });
});

afterAll(() => {
	rmSync(tempDir, { recursive: true, force: true });
});

let templateRegistry: typeof import("../src/utils/template-registry.js");

beforeEach(async () => {
	vi.resetModules();
	vi.mocked(existsSync).mockRestore?.();
	vi.mocked(readFileSync).mockRestore?.();
	templateRegistry = await import("../src/utils/template-registry.js");
});

describe("loadTemplateRegistry", () => {
	it("loads the real index.json and returns an object with version and patterns arrays", () => {
		const registry = templateRegistry.loadTemplateRegistry();
		expect(registry).toBeDefined();
		expect(typeof registry.version).toBe("string");
		expect(Array.isArray(registry.patterns)).toBe(true);
		expect(registry.patterns.length).toBeGreaterThan(0);
	});

	it("contains exactly 10 patterns", () => {
		const registry = templateRegistry.loadTemplateRegistry();
		expect(registry.patterns).toHaveLength(10);
	});

	it("returns the same cached object on second call", () => {
		const first = templateRegistry.loadTemplateRegistry();
		const second = templateRegistry.loadTemplateRegistry();
		expect(second).toBe(first);
	});

	it("throws a clear error when the registry file does not exist", () => {
		vi.mocked(existsSync).mockImplementation((path) => {
			if (typeof path === "string" && path.endsWith("index.json")) {
				return false;
			}
			return originalFs.existsSync(path);
		});
		expect(() => templateRegistry.loadTemplateRegistry()).toThrow(/not found/i);
		vi.mocked(existsSync).mockRestore();
	});

	it("throws when no template directory can be found", () => {
		vi.mocked(existsSync).mockImplementation(() => false);
		expect(() => templateRegistry.loadTemplateRegistry()).toThrow(/Could not locate/);
		vi.mocked(existsSync).mockRestore();
	});

	it("rejects invalid schema with a descriptive error", () => {
		const invalidPath = join(tempDir, "invalid-schema.json");
		originalFs.writeFileSync(
			invalidPath,
			JSON.stringify({ version: "1.0.0", patterns: "not-an-array" }),
		);

		vi.mocked(readFileSync).mockImplementation((path, options) => {
			if (typeof path === "string" && path.endsWith("index.json")) {
				return originalFs.readFileSync(invalidPath, options);
			}
			return originalFs.readFileSync(path, options);
		});

		expect(() => templateRegistry.loadTemplateRegistry()).toThrow(/array/);
		vi.mocked(readFileSync).mockRestore();
	});

	it("rejects a registry with wrong pattern count", () => {
		const path = join(tempDir, "wrong-count.json");
		originalFs.writeFileSync(
			path,
			JSON.stringify({ version: "1.0.0", patterns: [validPattern(0)] }),
		);
		vi.mocked(readFileSync).mockImplementation((p, options) => {
			if (typeof p === "string" && p.endsWith("index.json")) {
				return originalFs.readFileSync(path, options);
			}
			return originalFs.readFileSync(p, options);
		});
		expect(() => templateRegistry.loadTemplateRegistry()).toThrow(/exactly 10 patterns/);
		vi.mocked(readFileSync).mockRestore();
	});

	it("rejects a registry that is not a plain object", () => {
		const path = join(tempDir, "not-object.json");
		originalFs.writeFileSync(path, JSON.stringify("not-an-object"));
		vi.mocked(readFileSync).mockImplementation((p, options) => {
			if (typeof p === "string" && p.endsWith("index.json")) {
				return originalFs.readFileSync(path, options);
			}
			return originalFs.readFileSync(p, options);
		});
		expect(() => templateRegistry.loadTemplateRegistry()).toThrow(/JSON object/);
		vi.mocked(readFileSync).mockRestore();
	});

	it("rejects a registry with missing version string", () => {
		const path = join(tempDir, "no-version.json");
		originalFs.writeFileSync(
			path,
			JSON.stringify({ patterns: Array.from({ length: 10 }, (_, i) => validPattern(i)) }),
		);
		vi.mocked(readFileSync).mockImplementation((p, options) => {
			if (typeof p === "string" && p.endsWith("index.json")) {
				return originalFs.readFileSync(path, options);
			}
			return originalFs.readFileSync(p, options);
		});
		expect(() => templateRegistry.loadTemplateRegistry()).toThrow(/version/);
		vi.mocked(readFileSync).mockRestore();
	});

	it("rejects a pattern that is not an object", () => {
		const path = join(tempDir, "bad-pattern.json");
		const patterns = Array.from({ length: 10 }, (_, i) => validPattern(i));
		patterns[0] = "not-an-object" as unknown as ReturnType<
			typeof validPattern
		> as unknown as ReturnType<typeof validPattern>;
		originalFs.writeFileSync(path, JSON.stringify({ version: "1.0.0", patterns }));
		vi.mocked(readFileSync).mockImplementation((p, options) => {
			if (typeof p === "string" && p.endsWith("index.json")) {
				return originalFs.readFileSync(path, options);
			}
			return originalFs.readFileSync(p, options);
		});
		expect(() => templateRegistry.loadTemplateRegistry()).toThrow(/not an object/);
		vi.mocked(readFileSync).mockRestore();
	});

	it("rejects a pattern with a missing required field", () => {
		const path = join(tempDir, "missing-field.json");
		const patterns = Array.from({ length: 10 }, (_, i) => validPattern(i));
		(patterns[0] as Record<string, unknown>).name = undefined;
		originalFs.writeFileSync(path, JSON.stringify({ version: "1.0.0", patterns }));
		vi.mocked(readFileSync).mockImplementation((p, options) => {
			if (typeof p === "string" && p.endsWith("index.json")) {
				return originalFs.readFileSync(path, options);
			}
			return originalFs.readFileSync(p, options);
		});
		expect(() => templateRegistry.loadTemplateRegistry()).toThrow(/missing required field.*name/);
		vi.mocked(readFileSync).mockRestore();
	});

	it("rejects a pattern with invalid supports_reveal type", () => {
		const path = join(tempDir, "bad-bool.json");
		const patterns = Array.from({ length: 10 }, (_, i) => validPattern(i));
		first(patterns).supports_reveal = "yes" as unknown as boolean;
		originalFs.writeFileSync(path, JSON.stringify({ version: "1.0.0", patterns }));
		vi.mocked(readFileSync).mockImplementation((p, options) => {
			if (typeof p === "string" && p.endsWith("index.json")) {
				return originalFs.readFileSync(path, options);
			}
			return originalFs.readFileSync(p, options);
		});
		expect(() => templateRegistry.loadTemplateRegistry()).toThrow(/supports_reveal.*boolean/);
		vi.mocked(readFileSync).mockRestore();
	});

	it("rejects a pattern with an invalid array field", () => {
		const path = join(tempDir, "bad-array.json");
		const patterns = Array.from({ length: 10 }, (_, i) => validPattern(i));
		first(patterns).composition_variants = "centered" as unknown as string[];
		originalFs.writeFileSync(path, JSON.stringify({ version: "1.0.0", patterns }));
		vi.mocked(readFileSync).mockImplementation((p, options) => {
			if (typeof p === "string" && p.endsWith("index.json")) {
				return originalFs.readFileSync(path, options);
			}
			return originalFs.readFileSync(p, options);
		});
		expect(() => templateRegistry.loadTemplateRegistry()).toThrow(
			/composition_variants.*array of strings/,
		);
		vi.mocked(readFileSync).mockRestore();
	});

	it("rejects a pattern with an invalid string field", () => {
		const path = join(tempDir, "bad-string.json");
		const patterns = Array.from({ length: 10 }, (_, i) => validPattern(i));
		first(patterns).name = 42 as unknown as string;
		originalFs.writeFileSync(path, JSON.stringify({ version: "1.0.0", patterns }));
		vi.mocked(readFileSync).mockImplementation((p, options) => {
			if (typeof p === "string" && p.endsWith("index.json")) {
				return originalFs.readFileSync(path, options);
			}
			return originalFs.readFileSync(p, options);
		});
		expect(() => templateRegistry.loadTemplateRegistry()).toThrow(/name.*expected string/);
		vi.mocked(readFileSync).mockRestore();
	});

	it("rejects duplicate pattern_key values with a descriptive error", () => {
		const duplicatePath = join(tempDir, "duplicate-keys.json");
		const duplicateRegistry = {
			version: "1.0.0",
			patterns: Array.from({ length: 10 }, (_, i) => ({
				pattern_key: i < 2 ? "duplicate-key" : `key-${i}`,
				name: `Pattern ${i}`,
				description: "A test pattern",
				composition_variants: ["centered"],
				required_slots: [".slot"],
				optional_slots: [".opt"],
				css_class_contract: [".class"],
				supports_reveal: true,
			})),
		};
		originalFs.writeFileSync(duplicatePath, JSON.stringify(duplicateRegistry));

		vi.mocked(readFileSync).mockImplementation((p, options) => {
			if (typeof p === "string" && p.endsWith("index.json")) {
				return originalFs.readFileSync(duplicatePath, options);
			}
			return originalFs.readFileSync(p, options);
		});

		expect(() => templateRegistry.loadTemplateRegistry()).toThrow(/duplicate.*duplicate-key/i);
		vi.mocked(readFileSync).mockRestore();
	});

	it("rejects malformed JSON with a descriptive error", () => {
		const path = join(tempDir, "malformed.json");
		originalFs.writeFileSync(path, "{ not valid json");
		vi.mocked(readFileSync).mockImplementation((p, options) => {
			if (typeof p === "string" && p.endsWith("index.json")) {
				return originalFs.readFileSync(path, options);
			}
			return originalFs.readFileSync(p, options);
		});
		expect(() => templateRegistry.loadTemplateRegistry()).toThrow(/parse/i);
		vi.mocked(readFileSync).mockRestore();
	});
});

describe("getPatternByKey", () => {
	it("returns the title pattern for key 'title'", () => {
		const pattern = templateRegistry.getPatternByKey("title");
		expect(pattern).toBeDefined();
		expect(pattern?.pattern_key).toBe("title");
		expect(pattern?.name).toBe("Title Slide");
	});

	it("returns undefined for a nonexistent key", () => {
		expect(templateRegistry.getPatternByKey("nonexistent")).toBeUndefined();
	});

	it("does not re-parse the registry on second call with the same key", () => {
		const first = templateRegistry.getPatternByKey("title");
		const second = templateRegistry.getPatternByKey("title");
		expect(second).toBe(first);
	});
});

function validPattern(index: number) {
	return {
		pattern_key: `key-${index}`,
		name: `Pattern ${index}`,
		description: "A test pattern",
		composition_variants: ["centered"],
		required_slots: [".slot"],
		optional_slots: [".opt"],
		css_class_contract: [".class"],
		supports_reveal: true,
	};
}

function first<T>(arr: T[]): T {
	const el = arr[0];
	if (!el) throw new Error("expected non-empty array");
	return el;
}
