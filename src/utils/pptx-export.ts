/// <reference lib="dom" />
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "playwright";

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

	const browser = await chromium.launch();
	const page = await browser.newPage({ viewport });

	try {
		await page.goto(`file://${resolve(htmlPath)}`, { waitUntil: "networkidle" });

		await page.evaluate(() => {
			const slides = document.querySelectorAll(".slide");
			for (let i = 0; i < slides.length; i++) {
				const slide = slides.item(i);
				if (!slide) continue;
				slide.classList.add("visible");
				(slide as HTMLElement).style.display = "block";
				(slide as HTMLElement).style.visibility = "visible";
				(slide as HTMLElement).style.opacity = "1";
			}
			const style = document.createElement("style");
			style.textContent =
				".slide { display: block !important; visibility: visible !important; opacity: 1 !important; position: relative !important; }";
			document.head.appendChild(style);
		});

		try {
			await page.waitForSelector(".mermaid svg", { timeout: 5000 });
		} catch {
			// eslint-disable-next-line no-console
			console.warn("Mermaid SVG rendering timeout — proceeding without vector diagrams.");
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
			return Array.from(new Uint8Array(await blob.arrayBuffer()));
		});

		writeFileSync(outputPath, Buffer.from(pptxBuffer));
	} finally {
		await browser.close();
	}
}
