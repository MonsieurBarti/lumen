import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getVersionedPath } from "../src/utils/versioned-file.js";

describe("getVersionedPath", () => {
	it("returns base path when file does not exist", () => {
		const path = "/nonexistent/path/file.pptx";
		expect(getVersionedPath(path)).toBe(path);
	});

	it("returns _v2 when base file exists", () => {
		const dir = mkdtempSync(join(tmpdir(), "versioned-file-test-"));
		const basePath = join(dir, "deck.pptx");
		writeFileSync(basePath, "x");
		const result = getVersionedPath(basePath);
		expect(result).toBe(join(dir, "deck_v2.pptx"));
		rmSync(dir, { recursive: true });
	});

	it("returns _v3 when base and _v2 exist", () => {
		const dir = mkdtempSync(join(tmpdir(), "versioned-file-test-"));
		const basePath = join(dir, "deck.pptx");
		writeFileSync(basePath, "x");
		writeFileSync(join(dir, "deck_v2.pptx"), "x");
		const result = getVersionedPath(basePath);
		expect(result).toBe(join(dir, "deck_v3.pptx"));
		rmSync(dir, { recursive: true });
	});
});
