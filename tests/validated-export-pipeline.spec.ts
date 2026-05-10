import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import JSZip from "jszip";
import type { Page } from "playwright";
import { describe, expect, it } from "vitest";
import { scopeCssPerSlide } from "../src/utils/css-scoper.js";
import { normalizeForExport } from "../src/utils/export-normalizer.js";
import { closeBrowser, launchBrowserPage } from "../src/utils/playwright-browser.js";
import { exportHtmlToPptx } from "../src/utils/pptx-export.js";
import { materializePseudoElements } from "../src/utils/pseudo-materializer.js";
import { validateSlideHtml } from "../src/utils/slide-validator.js";

const INTEGRATION_HTML = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
.slide { width: 1280px; height: 720px; position: relative; }
.title { color: red; font-size: 24px; }
.slide-2 .title { color: blue; }
.pseudo-target::before { content: "→"; color: green; font-size: 20px; }
.overflow-box { width: 100px; height: 100px; position: absolute; left: 1250px; top: 650px; }
</style></head><body>
<section class="slide slide-1">
  <h1 class="title">Slide 1</h1>
  <span class="pseudo-target">target</span>
  <div class="overflow-box">overflow</div>
</section>
<section class="slide slide-2">
  <h1 class="title">Slide 2</h1>
</section>
</body></html>`;

async function countSlidesInPptx(pptxPath: string): Promise<number> {
	const data = readFileSync(pptxPath);
	const zip = await JSZip.loadAsync(data);
	return Object.keys(zip.files).filter(
		(name) => name.startsWith("ppt/slides/slide") && name.endsWith(".xml"),
	).length;
}

async function loadHtml(page: Page, html: string): Promise<void> {
	const dir = mkdtempSync(join(tmpdir(), "pipeline-test-"));
	const path = join(dir, "test.html");
	writeFileSync(path, html);
	await page.goto(`file://${path}`);
}

describe("validated export pipeline", () => {
	it("exports 2-slide HTML with validation, scoping, and materialization", async () => {
		const dir = mkdtempSync(join(tmpdir(), "validated-export-test-"));
		const htmlPath = join(dir, "deck.html");
		const outputPath = join(dir, "deck.pptx");
		writeFileSync(htmlPath, INTEGRATION_HTML);

		await exportHtmlToPptx({ htmlPath, outputPath });

		expect(existsSync(outputPath)).toBe(true);
		expect(await countSlidesInPptx(outputPath)).toBe(2);

		rmSync(dir, { recursive: true });
	}, 30000);

	it("scopes CSS per slide preventing class bleed", async () => {
		const { browser, page } = await launchBrowserPage({ width: 1280, height: 720 });
		try {
			await loadHtml(page, INTEGRATION_HTML);
			await normalizeForExport(page);
			await scopeCssPerSlide(page);

			const scopedStyle = await page.evaluate(() => {
				const style = document.querySelector("style");
				return style ? style.textContent : "";
			});
			expect(scopedStyle).toContain('[data-slide-index="0"] .title');
			expect(scopedStyle).toContain('[data-slide-index="1"] .title');
		} finally {
			await closeBrowser(browser);
		}
	}, 15000);

	it("materializes pseudo-elements into real DOM nodes", async () => {
		const { browser, page } = await launchBrowserPage({ width: 1280, height: 720 });
		try {
			await loadHtml(page, INTEGRATION_HTML);
			await normalizeForExport(page);
			await materializePseudoElements(page);

			const hasMaterialized = await page.evaluate(() => {
				const target = document.querySelector(".pseudo-target");
				if (!target) return false;
				return target.querySelector(".pseudo-before") !== null;
			});
			expect(hasMaterialized).toBe(true);
		} finally {
			await closeBrowser(browser);
		}
	}, 15000);

	it("detects overflow in integration fixture", async () => {
		const { browser, page } = await launchBrowserPage({ width: 1280, height: 720 });
		try {
			await loadHtml(page, INTEGRATION_HTML);
			await normalizeForExport(page);
			const report = await validateSlideHtml(page);
			const slideReport = report.slides[0];
			if (!slideReport) throw new Error("expected slide report");
			const overflowIssues = slideReport.issues.filter((i) => i.type === "overflow");
			expect(overflowIssues.length).toBeGreaterThanOrEqual(1);
		} finally {
			await closeBrowser(browser);
		}
	}, 15000);
});
