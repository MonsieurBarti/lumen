import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import { exportHtmlToPptx } from "../src/utils/pptx-export.js";
import { resolveTheme } from "../src/utils/theme-resolver.js";

const TWO_SLIDE_HTML = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Test</title>
<style>
.slide { width: 100%; height: 100vh; background: #111; color: #fff; display: flex; align-items: center; justify-content: center; }
</style>
</head><body>
<section class="slide"><h1>Slide 1</h1></section>
<section class="slide"><h1>Slide 2</h1></section>
</body></html>`;

function injectTheme(html: string, themeSource: string, css: string): string {
	const styleTag = `<style data-injected-theme="${themeSource}">\n${css}\n</style>`;
	const existingInjectedRegex = /<style\s+data-injected-theme="[^"]*">[\s\S]*?<\/style>/i;
	if (existingInjectedRegex.test(html)) {
		return html.replace(existingInjectedRegex, styleTag);
	}
	const headCloseRegex = /<\/head>/i;
	if (headCloseRegex.test(html)) {
		return html.replace(headCloseRegex, `${styleTag}\n</head>`);
	}
	return html.replace(/<html[^>]*>/i, `$&\n<head>\n${styleTag}\n</head>`);
}

async function countSlidesInPptx(pptxPath: string): Promise<number> {
	const data = readFileSync(pptxPath);
	const zip = await JSZip.loadAsync(data);
	return Object.keys(zip.files).filter(
		(name) => name.startsWith("ppt/slides/slide") && name.endsWith(".xml"),
	).length;
}

describe("slides-export integration", () => {
	it("exports 2-slide HTML to PPTX with correct slide count", async () => {
		const dir = mkdtempSync(join(tmpdir(), "slides-export-test-"));
		const htmlPath = join(dir, "deck.html");
		const outputPath = join(dir, "deck.pptx");
		writeFileSync(htmlPath, TWO_SLIDE_HTML);

		await exportHtmlToPptx({ htmlPath, outputPath });
		expect(await countSlidesInPptx(outputPath)).toBe(2);

		rmSync(dir, { recursive: true });
	}, 30000);

	it("injects project theme and exports to PPTX", async () => {
		const dir = mkdtempSync(join(tmpdir(), "slides-export-theme-test-"));
		const htmlPath = join(dir, "deck.html");
		const outputPath = join(dir, "deck.pptx");
		writeFileSync(htmlPath, TWO_SLIDE_HTML);
		writeFileSync(join(dir, "_theme.css"), "/* project theme */\n.slide { background: #222; }");

		const theme = await resolveTheme({ cwd: dir });
		expect(theme.source).toBe("project");

		const modifiedHtml = injectTheme(TWO_SLIDE_HTML, theme.source, theme.css);
		const tempHtmlPath = join(dir, "deck-themed.html");
		writeFileSync(tempHtmlPath, modifiedHtml);

		await exportHtmlToPptx({ htmlPath: tempHtmlPath, outputPath });
		expect(await countSlidesInPptx(outputPath)).toBe(2);

		rmSync(dir, { recursive: true });
	}, 30000);

	it("falls back to preset theme when no custom theme exists", async () => {
		const dir = mkdtempSync(join(tmpdir(), "slides-export-preset-test-"));
		const htmlPath = join(dir, "deck.html");
		const outputPath = join(dir, "deck.pptx");
		writeFileSync(htmlPath, TWO_SLIDE_HTML);

		const theme = await resolveTheme({ cwd: dir });
		expect(theme.source).toBe("preset");
		expect(theme.css.length).toBeGreaterThan(0);

		const modifiedHtml = injectTheme(TWO_SLIDE_HTML, theme.source, theme.css);
		const tempHtmlPath = join(dir, "deck-themed.html");
		writeFileSync(tempHtmlPath, modifiedHtml);

		await exportHtmlToPptx({ htmlPath: tempHtmlPath, outputPath });
		expect(await countSlidesInPptx(outputPath)).toBe(2);

		rmSync(dir, { recursive: true });
	}, 30000);
});
