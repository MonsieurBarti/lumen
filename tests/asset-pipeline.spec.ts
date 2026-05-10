import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
	embedLocalImagesAsBase64,
	resolveImagePath,
	validateImageReferences,
} from "../src/utils/asset-pipeline.js";

// 1×1 transparent PNG, 67 bytes base64
const ONE_BY_ONE_PNG_B64 =
	"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

function makeTempDir(): string {
	return mkdtempSync(join(tmpdir(), "asset-pipeline-test-"));
}

function cleanup(dir: string): void {
	rmSync(dir, { recursive: true, force: true });
}

describe("validateImageReferences", () => {
	let dir: string;

	beforeEach(() => {
		dir = makeTempDir();
	});

	afterEach(() => {
		cleanup(dir);
	});

	it("returns exists: true for a present local file", () => {
		const imgPath = join(dir, "test.png");
		writeFileSync(imgPath, Buffer.from(ONE_BY_ONE_PNG_B64, "base64"));

		const html = `<img src="test.png">`;
		const refs = validateImageReferences(html, dir);

		expect(refs).toHaveLength(1);
		expect(refs[0]).toMatchObject({
			src: "test.png",
			exists: true,
			absolutePath: imgPath,
		});
	});

	it("returns exists: false for a missing local file", () => {
		const html = `<img src="missing.png">`;
		const refs = validateImageReferences(html, dir);

		expect(refs).toHaveLength(1);
		expect(refs[0]).toMatchObject({
			src: "missing.png",
			exists: false,
			absolutePath: null,
		});
	});

	it("parses CSS url() references", () => {
		const imgPath = join(dir, "bg.png");
		writeFileSync(imgPath, Buffer.from(ONE_BY_ONE_PNG_B64, "base64"));

		const html = `<style>.hero { background: url('bg.png'); }</style>`;
		const refs = validateImageReferences(html, dir);

		expect(refs).toHaveLength(1);
		expect(refs[0]).toMatchObject({
			src: "bg.png",
			exists: true,
			absolutePath: imgPath,
		});
	});

	it("deduplicates repeated references to the same file", () => {
		const imgPath = join(dir, "bg.png");
		writeFileSync(imgPath, Buffer.from(ONE_BY_ONE_PNG_B64, "base64"));

		const html = `
			<img src="bg.png">
			<style>.hero { background: url('bg.png'); }</style>
		`;
		const refs = validateImageReferences(html, dir);

		expect(refs).toHaveLength(1);
		expect(refs[0]?.src).toBe("bg.png");
	});

	it("resolves relative paths against baseDir", () => {
		const subDir = join(dir, "assets");
		mkdirSync(subDir);
		const imgPath = join(subDir, "icon.png");
		writeFileSync(imgPath, Buffer.from(ONE_BY_ONE_PNG_B64, "base64"));

		const html = `<img src="assets/icon.png">`;
		const refs = validateImageReferences(html, dir);

		expect(refs[0]?.exists).toBe(true);
		expect(refs[0]?.absolutePath).toBe(imgPath);
	});
});

describe("embedLocalImagesAsBase64", () => {
	let dir: string;

	beforeEach(() => {
		dir = makeTempDir();
	});

	afterEach(() => {
		cleanup(dir);
	});

	it("replaces local src with a valid data: URI", async () => {
		const imgPath = join(dir, "test.png");
		writeFileSync(imgPath, Buffer.from(ONE_BY_ONE_PNG_B64, "base64"));

		const html = `<img src="test.png">`;
		const result = await embedLocalImagesAsBase64(html, dir);

		expect(result).toContain("data:image/png;base64,");
		expect(result).toContain(ONE_BY_ONE_PNG_B64);
		expect(result).not.toContain('src="test.png"');
	});

	it("leaves external URLs untouched", async () => {
		const html = `<img src="https://example.com/img.png">`;
		const result = await embedLocalImagesAsBase64(html, dir);

		expect(result).toBe(html);
	});

	it("leaves data: URIs untouched", async () => {
		const html = `<img src="data:image/png;base64,abc">`;
		const result = await embedLocalImagesAsBase64(html, dir);

		expect(result).toBe(html);
	});

	it("throws on missing local file", async () => {
		const html = `<img src="missing.png">`;

		await expect(embedLocalImagesAsBase64(html, dir)).rejects.toThrow(/not found/);
	});

	it("throws on unsupported image format", async () => {
		const bmpPath = join(dir, "test.bmp");
		writeFileSync(bmpPath, Buffer.from("BM"));

		const html = `<img src="test.bmp">`;
		await expect(embedLocalImagesAsBase64(html, dir)).rejects.toThrow(/Unsupported image format/);
	});

	it("throws on image > 2 MB", async () => {
		const bigPath = join(dir, "big.png");
		writeFileSync(bigPath, Buffer.alloc(2 * 1024 * 1024 + 1));

		const html = `<img src="big.png">`;
		await expect(embedLocalImagesAsBase64(html, dir)).rejects.toThrow(/exceeds 2 MB/);
	});

	it("embeds CSS url() references as base64", async () => {
		const imgPath = join(dir, "bg.png");
		writeFileSync(imgPath, Buffer.from(ONE_BY_ONE_PNG_B64, "base64"));

		const html = `<style>.hero { background: url('bg.png'); }</style>`;
		const result = await embedLocalImagesAsBase64(html, dir);

		expect(result).toContain("data:image/png;base64,");
		expect(result).not.toContain("url('bg.png')");
	});
});

describe("resolveImagePath", () => {
	let dir: string;

	beforeEach(() => {
		dir = makeTempDir();
	});

	afterEach(() => {
		cleanup(dir);
	});

	it("returns absolute path for an existing file", () => {
		const imgPath = join(dir, "test.png");
		writeFileSync(imgPath, Buffer.from(ONE_BY_ONE_PNG_B64, "base64"));

		const resolved = resolveImagePath("test.png", dir);
		expect(resolved).toBe(imgPath);
	});

	it("returns null for a missing file", () => {
		const resolved = resolveImagePath("missing.png", dir);
		expect(resolved).toBeNull();
	});
});
