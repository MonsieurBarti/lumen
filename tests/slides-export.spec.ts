import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import { exportHtmlToPptx } from "../src/utils/pptx-export.js";

const TWO_SLIDE_HTML = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Test</title>
<style>
.slide { width: 100%; height: 100vh; background: #111; color: #fff; display: flex; align-items: center; justify-content: center; }
</style>
</head><body>
<section class="slide"><h1>Slide 1</h1></section>
<section class="slide"><h1>Slide 2</h1></section>
</body></html>`;

describe("slides-export integration", () => {
	it("exports 2-slide HTML to PPTX with correct slide count", async () => {
		const dir = mkdtempSync(join(tmpdir(), "slides-export-test-"));
		const htmlPath = join(dir, "deck.html");
		const outputPath = join(dir, "deck.pptx");
		writeFileSync(htmlPath, TWO_SLIDE_HTML);

		await exportHtmlToPptx({ htmlPath, outputPath });

		const data = readFileSync(outputPath);
		const zip = await JSZip.loadAsync(data);
		const slideFiles = Object.keys(zip.files).filter(
			(name) => name.startsWith("ppt/slides/slide") && name.endsWith(".xml"),
		);
		expect(slideFiles.length).toBe(2);

		rmSync(dir, { recursive: true });
	}, 30000);
});
