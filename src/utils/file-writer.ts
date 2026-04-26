/**
 * File writing utilities for lumen.
 * Lifted from @the-forge-flow/visual-explainer-pi: src/utils/file-writer.ts.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import type { ExtensionState } from "../types.js";

const OUTPUT_DIR = join(homedir(), ".agent", "lumen");

export async function ensureOutputDir(): Promise<string> {
	try {
		await mkdir(OUTPUT_DIR, { recursive: true });
		return OUTPUT_DIR;
	} catch (error) {
		throw new Error(`Failed to create output directory: ${OUTPUT_DIR}: ${error}`);
	}
}

export async function writeHtmlFile(
	filename: string,
	html: string,
	state: ExtensionState,
): Promise<string> {
	const outputDir = await ensureOutputDir();
	const filePath = join(outputDir, filename);

	try {
		await writeFile(filePath, html, "utf8");

		// Track in recent files
		state.recentFiles.unshift(filePath);
		if (state.recentFiles.length > 10) {
			state.recentFiles = state.recentFiles.slice(0, 10);
		}

		return filePath;
	} catch (error) {
		throw new Error(`Failed to write HTML file: ${error}`);
	}
}

export function createInitialState(): ExtensionState {
	return {
		recentFiles: [],
		tempDirs: [],
		defaultAesthetic: "blueprint",
		defaultTheme: "auto",
	};
}
