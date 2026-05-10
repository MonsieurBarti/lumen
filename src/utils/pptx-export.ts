/// <reference lib="dom" />
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { closeBrowser, launchBrowserPage } from "./playwright-browser.js";

const DEFAULT_VIEWPORT = { width: 1280, height: 720 };
const BUNDLE_PATH = resolve(
	import.meta.dirname,
	"../../node_modules/dom-to-pptx/dist/dom-to-pptx.bundle.js",
);

export interface ExportOptions {
	htmlPath: string;
	outputPath: string;
	viewport?: { width: number; height: number };
}

export async function exportHtmlToPptx(options: ExportOptions): Promise<void> {
	const { htmlPath, outputPath, viewport = DEFAULT_VIEWPORT } = options;

	const { browser, page } = await launchBrowserPage(viewport);

	try {
		await page.goto(`file://${resolve(htmlPath)}`, { waitUntil: "networkidle" });

		await page.evaluate(() => {
			const slides = document.querySelectorAll(".slide");
			for (let i = 0; i < slides.length; i++) {
				const slide = slides.item(i);
				if (!slide || !(slide instanceof HTMLElement)) continue;
				slide.classList.add("visible");
				slide.style.display = "block";
				slide.style.visibility = "visible";
				slide.style.opacity = "1";
			}
			const style = document.createElement("style");
			style.textContent =
				".slide { display: block !important; visibility: visible !important; opacity: 1 !important; position: relative !important; }";
			document.head.appendChild(style);
		});

		const hasMermaid = await page.evaluate(() => document.querySelector(".mermaid") !== null);
		if (hasMermaid) {
			try {
				await page.waitForSelector(".mermaid svg", { timeout: 5000 });
			} catch {
				// eslint-disable-next-line no-console
				console.warn("Mermaid SVG rendering timeout — proceeding without vector diagrams.");
			}
		}

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
