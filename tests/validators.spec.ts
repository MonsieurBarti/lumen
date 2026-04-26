import { describe, expect, it, vi } from "vitest";

import {
	generateDefaultFilename,
	sanitizeFilename,
	validateAesthetic,
	validateParams,
	validateTheme,
	validateVisualType,
} from "../src/utils/validators.js";

describe("validateVisualType", () => {
	it("accepts every documented type", () => {
		const types = [
			"architecture",
			"flowchart",
			"sequence",
			"er",
			"state",
			"table",
			"diff",
			"plan",
			"timeline",
			"dashboard",
			"slides",
			"mermaid_custom",
		];
		for (const t of types) {
			expect(validateVisualType(t)).toBe(t);
		}
	});

	it("throws on unknown string", () => {
		expect(() => validateVisualType("nope")).toThrow(/Invalid visual type/);
	});

	it("throws on non-string", () => {
		expect(() => validateVisualType(42)).toThrow();
		expect(() => validateVisualType(undefined)).toThrow();
	});
});

describe("validateAesthetic", () => {
	it("accepts the 8 documented palettes", () => {
		const aesthetics = [
			"blueprint",
			"editorial",
			"paper",
			"terminal",
			"dracula",
			"nord",
			"solarized",
			"gruvbox",
		];
		for (const a of aesthetics) {
			expect(validateAesthetic(a)).toBe(a);
		}
	});

	it("falls back to blueprint when undefined", () => {
		expect(validateAesthetic(undefined)).toBe("blueprint");
	});

	it("warns + falls back to blueprint on unknown", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		expect(validateAesthetic("monochrome")).toBe("blueprint");
		expect(warn).toHaveBeenCalled();
		warn.mockRestore();
	});
});

describe("validateTheme", () => {
	it("accepts light, dark, auto", () => {
		expect(validateTheme("light")).toBe("light");
		expect(validateTheme("dark")).toBe("dark");
		expect(validateTheme("auto")).toBe("auto");
	});

	it("falls back to auto when undefined", () => {
		expect(validateTheme(undefined)).toBe("auto");
	});

	it("warns + falls back to auto on unknown", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		expect(validateTheme("sepia")).toBe("auto");
		expect(warn).toHaveBeenCalled();
		warn.mockRestore();
	});
});

describe("validateParams", () => {
	const minValid = {
		type: "mermaid_custom",
		title: "Hello",
		content: "graph TD\nA-->B",
	};

	it("returns a normalized object for the minimum-valid input", () => {
		const result = validateParams(minValid);
		expect(result.type).toBe("mermaid_custom");
		expect(result.title).toBe("Hello");
		expect(result.content).toBe("graph TD\nA-->B");
		expect(result.aesthetic).toBe("blueprint");
		expect(result.theme).toBe("auto");
		expect(result.filename).toBeUndefined();
	});

	it("includes filename when supplied as a non-empty string", () => {
		const result = validateParams({ ...minValid, filename: "my-diagram.html" });
		expect(result.filename).toBe("my-diagram.html");
	});

	it("omits filename when supplied as an empty string", () => {
		const result = validateParams({ ...minValid, filename: "" });
		expect(result.filename).toBeUndefined();
	});

	it("accepts content as an array of objects (table data)", () => {
		const rows = [
			{ a: 1, b: "x" },
			{ a: 2, b: "y" },
		];
		const result = validateParams({ ...minValid, type: "table", content: rows });
		expect(result.content).toEqual(rows);
	});

	it("rejects null params", () => {
		expect(() => validateParams(null)).toThrow(/must be an object/);
	});

	it("rejects non-object params", () => {
		expect(() => validateParams("string")).toThrow(/must be an object/);
		expect(() => validateParams(42)).toThrow(/must be an object/);
	});

	it("rejects missing title", () => {
		expect(() => validateParams({ type: "mermaid_custom", content: "x" })).toThrow(/title/);
	});

	it("rejects empty title", () => {
		expect(() => validateParams({ ...minValid, title: "" })).toThrow(/title/);
	});

	it("rejects missing content", () => {
		expect(() => validateParams({ type: "mermaid_custom", title: "x" })).toThrow(/content/);
	});

	it("rejects content of wrong shape", () => {
		expect(() => validateParams({ ...minValid, content: 42 })).toThrow(/content/);
		expect(() => validateParams({ ...minValid, content: { not: "array" } })).toThrow(/content/);
		expect(() => validateParams({ ...minValid, content: [42, "x"] })).toThrow(/content/);
	});
});

describe("sanitizeFilename", () => {
	it("strips leading dots and slashes", () => {
		expect(sanitizeFilename("../foo.html")).toBe("foo.html");
		expect(sanitizeFilename("./bar.html")).toBe("bar.html");
		expect(sanitizeFilename("/abs/path.html")).toBe("abs-path.html");
	});

	it("replaces filesystem-unsafe chars with -", () => {
		expect(sanitizeFilename('a:b*c?d"e<f>g|h.html')).toBe("a-b-c-d-e-f-g-h.html");
	});

	it("appends .html when missing", () => {
		expect(sanitizeFilename("plain")).toBe("plain.html");
		expect(sanitizeFilename("already.html")).toBe("already.html");
	});
});

describe("generateDefaultFilename", () => {
	it("emits ISO-date prefix and slugified title", () => {
		const out = generateDefaultFilename("Hello, World!");
		expect(out).toMatch(/^\d{4}-\d{2}-\d{2}-hello-world\.html$/);
	});

	it("falls back to 'visual' when title produces empty slug", () => {
		const out = generateDefaultFilename("!!!");
		expect(out).toMatch(/^\d{4}-\d{2}-\d{2}-visual\.html$/);
	});
});
