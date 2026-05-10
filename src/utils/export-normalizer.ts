/// <reference lib="dom" />
import type { Page } from "playwright";

export async function normalizeForExport(page: Page): Promise<void> {
	await page.evaluate(() => {
		const slides = document.querySelectorAll(".slide");
		for (let i = 0; i < slides.length; i++) {
			const slide = slides.item(i);
			if (slide instanceof HTMLElement) {
				slide.style.setProperty("width", "1280px", "important");
				slide.style.setProperty("height", "720px", "important");
				slide.style.setProperty("display", "block", "important");
				slide.style.setProperty("visibility", "visible", "important");
				slide.style.setProperty("opacity", "1", "important");
				slide.style.setProperty("position", "relative", "important");
				slide.style.setProperty("overflow", "hidden", "important");
				slide.classList.add("visible");
			}
		}

		const style = document.createElement("style");
		style.textContent = `
			.slide {
				width: 1280px !important;
				height: 720px !important;
				min-height: 720px !important;
				max-height: 720px !important;
				display: block !important;
				visibility: visible !important;
				opacity: 1 !important;
				position: relative !important;
				overflow: hidden !important;
			}
			* {
				scroll-snap-type: none !important;
				scroll-behavior: auto !important;
			}
			* {
				animation: none !important;
				transition: none !important;
			}
			[style*="100vh"], [style*="100dvh"] {
				height: 720px !important;
				min-height: 720px !important;
				max-height: 720px !important;
			}
		`;
		document.head.appendChild(style);
	});
}
