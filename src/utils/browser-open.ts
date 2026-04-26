/**
 * Cross-platform browser opening utility
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

export async function openInBrowser(filePath: string, pi: ExtensionAPI): Promise<void> {
	const platform = process.platform;

	let command: string;
	let args: string[];

	switch (platform) {
		case "darwin":
			command = "open";
			args = [filePath];
			break;
		case "linux":
			command = "xdg-open";
			args = [filePath];
			break;
		case "win32":
			command = "cmd";
			args = ["/c", "start", "", filePath];
			break;
		default:
			throw new Error(`Unsupported platform: ${platform}. Please open manually: ${filePath}`);
	}

	try {
		const result = await pi.exec(command, args, { timeout: 10000 });
		if (result.code !== 0) {
			throw new Error(`Browser open failed: ${result.stderr || "Unknown error"}`);
		}
	} catch (error) {
		throw new Error(
			`Failed to open browser: ${error instanceof Error ? error.message : String(error)}`,
		);
	}
}
