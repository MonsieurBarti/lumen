import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Page } from "playwright";
import { describe, expect, it } from "vitest";
import { scopeCssPerSlide } from "../src/utils/css-scoper.js";
import { closeBrowser, launchBrowserPage } from "../src/utils/playwright-browser.js";

const SHARED_CLASS_HTML = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
.slide { width: 1280px; height: 720px; }
.title { color: red; }
</style></head><body>
<section class="slide"><h1 class="title">Slide 1</h1></section>
<section class="slide"><h1 class="title">Slide 2</h1></section>
</body></html>`;

async function loadHtml(page: Page, html: string): Promise<void> {
	const dir = mkdtempSync(join(tmpdir(), "scoper-test-"));
	const path = join(dir, "test.html");
	writeFileSync(path, html);
	await page.goto(`file://${path}`);
}

describe("css-scoper", () => {
	it("adds data-slide-index to each slide", async () => {
		const { browser, page } = await launchBrowserPage({ width: 1280, height: 720 });
		try {
			await loadHtml(page, SHARED_CLASS_HTML);
			await scopeCssPerSlide(page);
			const indices = await page.evaluate(() => {
				const slides = document.querySelectorAll(".slide");
				return Array.from(slides).map((s) => s.getAttribute("data-slide-index"));
			});
			expect(indices).toEqual(["0", "1"]);
		} finally {
			await closeBrowser(browser);
		}
	}, 15000);

	it("prefixes global styles with data-slide-index selectors", async () => {
		const { browser, page } = await launchBrowserPage({ width: 1280, height: 720 });
		try {
			await loadHtml(page, SHARED_CLASS_HTML);
			await scopeCssPerSlide(page);
			const styleText = await page.evaluate(() => {
				const style = document.querySelector("style");
				return style ? style.textContent : "";
			});
			expect(styleText).toContain('[data-slide-index="0"] .title');
			expect(styleText).toContain('[data-slide-index="1"] .title');
		} finally {
			await closeBrowser(browser);
		}
	}, 15000);
});
