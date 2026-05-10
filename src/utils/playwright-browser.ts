import { type Browser, type Page, chromium } from "playwright";

export interface Viewport {
	width: number;
	height: number;
}

export async function launchBrowserPage(
	viewport: Viewport,
): Promise<{ browser: Browser; page: Page }> {
	const browser = await chromium.launch();
	const page = await browser.newPage({ viewport });
	return { browser, page };
}

export async function closeBrowser(browser: Browser): Promise<void> {
	await browser.close();
}
