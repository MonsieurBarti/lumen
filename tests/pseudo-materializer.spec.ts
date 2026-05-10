import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Page } from "playwright";
import { describe, expect, it } from "vitest";
import { closeBrowser, launchBrowserPage } from "../src/utils/playwright-browser.js";
import { materializePseudoElements } from "../src/utils/pseudo-materializer.js";

const PSEUDO_HTML = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
.slide { width: 1280px; height: 720px; }
.target::before { content: "→"; color: red; }
.target::after { content: "←"; color: blue; }
</style></head><body>
<section class="slide"><span class="target">text</span></section>
</body></html>`;

async function loadHtml(page: Page, html: string): Promise<void> {
	const dir = mkdtempSync(join(tmpdir(), "materializer-test-"));
	const path = join(dir, "test.html");
	writeFileSync(path, html);
	await page.goto(`file://${path}`);
}

describe("pseudo-materializer", () => {
	it("creates real DOM elements for pseudo-elements", async () => {
		const { browser, page } = await launchBrowserPage({ width: 1280, height: 720 });
		try {
			await loadHtml(page, PSEUDO_HTML);
			await materializePseudoElements(page);
			const hasPseudoElements = await page.evaluate(() => {
				const target = document.querySelector(".target");
				if (!target) return false;
				return target.querySelectorAll(".pseudo-before, .pseudo-after").length === 2;
			});
			expect(hasPseudoElements).toBe(true);
		} finally {
			await closeBrowser(browser);
		}
	}, 15000);

	it("disables original pseudo-elements via data attribute", async () => {
		const { browser, page } = await launchBrowserPage({ width: 1280, height: 720 });
		try {
			await loadHtml(page, PSEUDO_HTML);
			await materializePseudoElements(page);
			const hasDataAttr = await page.evaluate(() => {
				const target = document.querySelector(".target");
				return target?.hasAttribute("data-pseudo-materialized") ?? false;
			});
			expect(hasDataAttr).toBe(true);

			const resetStyleExists = await page.evaluate(() => {
				return document.getElementById("pseudo-materializer-reset") !== null;
			});
			expect(resetStyleExists).toBe(true);
		} finally {
			await closeBrowser(browser);
		}
	}, 15000);

	it("skips pseudo-elements with empty content", async () => {
		const emptyPseudoHtml = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
.slide { width: 1280px; height: 720px; }
.target::before { content: ""; }
</style></head><body>
<section class="slide"><span class="target">text</span></section>
</body></html>`;

		const { browser, page } = await launchBrowserPage({ width: 1280, height: 720 });
		try {
			await loadHtml(page, emptyPseudoHtml);
			await materializePseudoElements(page);
			const hasPseudoBefore = await page.evaluate(() => {
				return document.querySelector(".target .pseudo-before") !== null;
			});
			expect(hasPseudoBefore).toBe(false);
		} finally {
			await closeBrowser(browser);
		}
	}, 15000);
});
