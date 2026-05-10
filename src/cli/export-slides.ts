#!/usr/bin/env node
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { parseArgs } from "node:util";
import { exportHtmlToPptx } from "../utils/pptx-export.js";
import { resolveTheme } from "../utils/theme-resolver.js";
import { getVersionedPath } from "../utils/versioned-file.js";

const { values, positionals } = parseArgs({
	allowPositionals: true,
	options: {
		output: { type: "string", short: "o" },
		preset: { type: "string" },
	},
});

const htmlPath = positionals[0] ?? "";
if (!htmlPath) {
	console.error("Usage: lumen-export-slides <html-path> [--output <pptx-path>] [--preset <name>]");
	process.exit(1);
}

const outputPath = values.output
	? values.output
	: getVersionedPath(join(dirname(htmlPath), "deck.pptx"));

async function main() {
	let finalHtmlPath = htmlPath;
	let tempDir: string | undefined;

	const html = readFileSync(htmlPath, "utf-8");

	try {
		const theme = await resolveTheme(values.preset ? { preset: values.preset } : {});
		const styleTag = `<style data-injected-theme="${theme.source}">\n${theme.css}\n</style>`;

		const existingInjectedRegex = /<style\s+data-injected-theme="[^"]*">[\s\S]*?<\/style>/i;

		let modifiedHtml: string;
		if (existingInjectedRegex.test(html)) {
			modifiedHtml = html.replace(existingInjectedRegex, styleTag);
		} else {
			const headCloseRegex = /<\/head>/i;
			if (headCloseRegex.test(html)) {
				modifiedHtml = html.replace(headCloseRegex, `${styleTag}\n</head>`);
			} else {
				modifiedHtml = html.replace(/<html[^>]*>/i, `$&\n<head>\n${styleTag}\n</head>`);
			}
		}

		tempDir = mkdtempSync(join(tmpdir(), "lumen-export-"));
		finalHtmlPath = join(tempDir, "deck.html");
		writeFileSync(finalHtmlPath, modifiedHtml);
	} catch (err) {
		if (values.preset) throw err;
		console.warn("Theme resolution failed, proceeding with original HTML:", err);
	}

	try {
		await exportHtmlToPptx({ htmlPath: finalHtmlPath, outputPath });
		console.log(`Exported to ${outputPath}`);
	} finally {
		if (tempDir) {
			rmSync(tempDir, { recursive: true, force: true });
		}
	}
}

main().catch((err) => {
	console.error("Export failed:", err);
	process.exit(1);
});
