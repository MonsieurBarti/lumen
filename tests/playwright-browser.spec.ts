import { describe, expect, it } from "vitest";
import { closeBrowser, launchBrowserPage } from "../src/utils/playwright-browser.js";

describe("playwright-browser", () => {
	it("launches chromium and creates page with correct viewport", async () => {
		const { browser, page } = await launchBrowserPage({ width: 1280, height: 720 });
		expect(page.viewportSize()).toEqual({ width: 1280, height: 720 });
		await closeBrowser(browser);
	});

	it("closes browser cleanly", async () => {
		const { browser } = await launchBrowserPage({ width: 800, height: 600 });
		await closeBrowser(browser);
		expect(browser.isConnected()).toBe(false);
	});
});
