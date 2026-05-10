/// <reference lib="dom" />
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Page } from "playwright";
import { scopeCssPerSlide } from "./css-scoper.js";
import { normalizeForExport } from "./export-normalizer.js";
import { closeBrowser, launchBrowserPage } from "./playwright-browser.js";
import { materializePseudoElements } from "./pseudo-materializer.js";
import {
	type ValidationReport,
	formatValidationReport,
	validateSlideHtml,
} from "./slide-validator.js";

const DEFAULT_VIEWPORT = { width: 1280, height: 720 };
const BUNDLE_PATH = resolve(
	import.meta.dirname,
	"../../node_modules/dom-to-pptx/dist/dom-to-pptx.bundle.js",
);
const VALIDATION_RETRIES = 3;
const VALIDATION_RETRY_DELAY_MS = 2000;

export interface ExportOptions {
	htmlPath: string;
	outputPath: string;
	viewport?: { width: number; height: number };
}

async function runValidationWithRetry(page: Page): Promise<ValidationReport> {
	let lastError: unknown;
	for (let attempt = 0; attempt <= VALIDATION_RETRIES; attempt++) {
		try {
			const hasMermaid = await page.evaluate(() => document.querySelector(".mermaid") !== null);
			if (hasMermaid) {
				await page.waitForSelector(".mermaid svg", { timeout: 5000 });
			}
			return await validateSlideHtml(page);
		} catch (err) {
			lastError = err;
			if (attempt < VALIDATION_RETRIES) {
				await new Promise((r) => setTimeout(r, VALIDATION_RETRY_DELAY_MS));
			}
		}
	}
	throw lastError;
}

export async function exportHtmlToPptx(options: ExportOptions): Promise<void> {
	const { htmlPath, outputPath, viewport = DEFAULT_VIEWPORT } = options;

	const { browser, page } = await launchBrowserPage(viewport);

	try {
		await page.goto(`file://${resolve(htmlPath)}`, { waitUntil: "networkidle" });

		// T04: force 1280x720 canvas rules and disable animations
		await normalizeForExport(page);

		// T01 + T06: validate with transient retry
		const report = await runValidationWithRetry(page);
		if (report.slides.some((s) => s.issues.length > 0)) {
			const formatted = formatValidationReport(report);
			for (const line of formatted.split("\n")) {
				if (line.trim()) {
					// eslint-disable-next-line no-console
					console.warn(line);
				}
			}
		}

		// T02: scope CSS per slide to prevent class bleed
		await scopeCssPerSlide(page);

		// T03: materialize pseudo-elements into real DOM nodes
		await materializePseudoElements(page);

		await page.addScriptTag({ path: BUNDLE_PATH });

		const pptxBuffer = await page.evaluate(async () => {
			const slides = document.querySelectorAll(".slide");
			// @ts-expect-error dom-to-pptx bundle exposes domToPptx globally
			const { exportToPptx } = window.domToPptx;
			const blob = await exportToPptx(Array.from(slides), {
				skipDownload: true,
				svgAsVector: true,
			});
			return new Uint8Array(await blob.arrayBuffer());
		});

		writeFileSync(outputPath, Buffer.from(pptxBuffer));
	} finally {
		await closeBrowser(browser);
	}
}
