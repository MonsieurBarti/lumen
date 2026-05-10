import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Page } from "playwright";
import { describe, expect, it } from "vitest";
import { closeBrowser, launchBrowserPage } from "../src/utils/playwright-browser.js";
import { validateSlideHtml } from "../src/utils/slide-validator.js";

const OVERFLOW_HTML = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
.slide { width: 1280px; height: 720px; position: relative; }
.box { width: 100px; height: 100px; position: absolute; left: 1250px; top: 650px; }
</style></head><body>
<section class="slide"><div class="box">overflow</div></section>
</body></html>`;

const DESCENDER_HTML = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
.slide { width: 1280px; height: 720px; position: relative; }
p { position: absolute; top: 710px; font-size: 16px; line-height: 24px; }
</style></head><body>
<section class="slide"><p>descender text</p></section>
</body></html>`;

const UNWRAPPED_HTML = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
.slide { width: 1280px; height: 720px; }
</style></head><body>
<section class="slide">bare text node</section>
</body></html>`;

const EMOJI_HTML = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
.slide { width: 1280px; height: 720px; }
</style></head><body>
<section class="slide"><p>hello world</p></section>
</body></html>`;

const CLEAN_HTML = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
.slide { width: 1280px; height: 720px; }
</style></head><body>
<section class="slide"><p>clean slide</p></section>
</body></html>`;

async function loadHtml(page: Page, html: string): Promise<void> {
	const dir = mkdtempSync(join(tmpdir(), "validator-test-"));
	const path = join(dir, "test.html");
	writeFileSync(path, html);
	await page.goto(`file://${path}`);
}

describe("slide-validator", () => {
	it("detects overflow", async () => {
		const { browser, page } = await launchBrowserPage({ width: 1280, height: 720 });
		try {
			await loadHtml(page, OVERFLOW_HTML);
			const report = await validateSlideHtml(page);
			const slideReport = report.slides[0];
			if (!slideReport) throw new Error("expected slide report");
			const overflowIssues = slideReport.issues.filter((i) => i.type === "overflow");
			expect(overflowIssues.length).toBeGreaterThanOrEqual(1);
			const issue = overflowIssues[0];
			if (!issue) throw new Error("expected issue");
			expect(issue.severity).toBe("error");
		} finally {
			await closeBrowser(browser);
		}
	}, 15000);

	it("detects descender clipping", async () => {
		const { browser, page } = await launchBrowserPage({ width: 1280, height: 720 });
		try {
			await loadHtml(page, DESCENDER_HTML);
			const report = await validateSlideHtml(page);
			const slideReport = report.slides[0];
			if (!slideReport) throw new Error("expected slide report");
			const descenderIssues = slideReport.issues.filter((i) => i.type === "descender-clipping");
			expect(descenderIssues.length).toBeGreaterThanOrEqual(1);
			const issue = descenderIssues[0];
			if (!issue) throw new Error("expected issue");
			expect(issue.severity).toBe("warn");
		} finally {
			await closeBrowser(browser);
		}
	}, 15000);

	it("detects unwrapped text nodes", async () => {
		const { browser, page } = await launchBrowserPage({ width: 1280, height: 720 });
		try {
			await loadHtml(page, UNWRAPPED_HTML);
			const report = await validateSlideHtml(page);
			const slideReport = report.slides[0];
			if (!slideReport) throw new Error("expected slide report");
			expect(slideReport.issues).toHaveLength(1);
			const issue = slideReport.issues[0];
			if (!issue) throw new Error("expected issue");
			expect(issue.type).toBe("unwrapped-text");
			expect(issue.severity).toBe("warn");
		} finally {
			await closeBrowser(browser);
		}
	}, 15000);

	it("detects emoji usage", async () => {
		const { browser, page } = await launchBrowserPage({ width: 1280, height: 720 });
		try {
			await loadHtml(page, EMOJI_HTML);
			const report = await validateSlideHtml(page);
			const slideReport = report.slides[0];
			if (!slideReport) throw new Error("expected slide report");
			expect(slideReport.issues).toHaveLength(0);
			// Now test with emoji
			const emojiHtml = EMOJI_HTML.replace("hello world", "hello 🌍 world");
			await loadHtml(page, emojiHtml);
			const emojiReport = await validateSlideHtml(page);
			const emojiSlide = emojiReport.slides[0];
			if (!emojiSlide) throw new Error("expected slide report");
			expect(emojiSlide.issues).toHaveLength(1);
			const issue = emojiSlide.issues[0];
			if (!issue) throw new Error("expected issue");
			expect(issue.type).toBe("emoji");
			expect(issue.severity).toBe("warn");
		} finally {
			await closeBrowser(browser);
		}
	}, 15000);

	it("reports clean slides with no issues", async () => {
		const { browser, page } = await launchBrowserPage({ width: 1280, height: 720 });
		try {
			await loadHtml(page, CLEAN_HTML);
			const report = await validateSlideHtml(page);
			const slideReport = report.slides[0];
			if (!slideReport) throw new Error("expected slide report");
			expect(slideReport.issues).toHaveLength(0);
		} finally {
			await closeBrowser(browser);
		}
	}, 15000);
});
