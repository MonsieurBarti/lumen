#!/usr/bin/env node
import { dirname, join } from "node:path";
import { parseArgs } from "node:util";
import { exportHtmlToPptx } from "../utils/pptx-export.js";
import { getVersionedPath } from "../utils/versioned-file.js";

const { values, positionals } = parseArgs({
	allowPositionals: true,
	options: {
		output: { type: "string", short: "o" },
	},
});

const htmlPath = positionals[0];
if (!htmlPath) {
	console.error("Usage: lumen-export-slides <html-path> [--output <pptx-path>]");
	process.exit(1);
}

const outputPath = values.output
	? values.output
	: getVersionedPath(join(dirname(htmlPath), "deck.pptx"));

exportHtmlToPptx({ htmlPath, outputPath })
	.then(() => {
		console.log(`Exported to ${outputPath}`);
	})
	.catch((err) => {
		console.error("Export failed:", err);
		process.exit(1);
	});
