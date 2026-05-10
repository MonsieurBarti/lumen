/// <reference lib="dom" />
import type { Page } from "playwright";

export async function scopeCssPerSlide(page: Page): Promise<void> {
	await page.evaluate(() => {
		function scopeCss(css: string, prefix: string): string {
			let result = "";
			let current = "";
			let depth = 0;
			const atRuleAtDepth: (string | undefined)[] = [];

			for (let i = 0; i < css.length; i++) {
				const ch = css[i];

				if (ch === "{") {
					const text = current.trim();
					current = "";
					if (text.startsWith("@")) {
						atRuleAtDepth[depth] = text.split(/\s+/)[0];
						result += `${text}{`;
					} else if (atRuleAtDepth.some((d) => d === "@keyframes")) {
						result += `${text}{`;
					} else {
						const selectors = text
							.split(",")
							.map((s) => {
								const trimmed = s.trim();
								return trimmed ? `${prefix} ${trimmed}` : trimmed;
							})
							.join(", ");
						result += `${selectors}{`;
					}
					depth++;
					continue;
				}

				if (ch === "}") {
					result += `${current}}`;
					depth = Math.max(0, depth - 1);
					atRuleAtDepth[depth] = undefined;
					current = "";
					continue;
				}

				current += ch;
			}

			return `${result}${current}`;
		}

		const slides = document.querySelectorAll(".slide");
		for (let i = 0; i < slides.length; i++) {
			const slide = slides.item(i);
			if (slide instanceof HTMLElement) {
				slide.setAttribute("data-slide-index", String(i));
			}
		}

		const slideCount = slides.length;
		const styleBlocks = document.querySelectorAll("style");

		for (let s = 0; s < styleBlocks.length; s++) {
			const style = styleBlocks.item(s);
			if (style.id === "pseudo-materializer-reset") continue;
			const css = style.textContent || "";
			const parentSlide = style.closest(".slide");

			let scopedCss: string;
			if (parentSlide instanceof HTMLElement) {
				const index = parentSlide.getAttribute("data-slide-index") || "0";
				scopedCss = scopeCss(css, `[data-slide-index="${index}"]`);
			} else {
				const parts: string[] = [];
				for (let i = 0; i < slideCount; i++) {
					parts.push(scopeCss(css, `[data-slide-index="${i}"]`));
				}
				scopedCss = parts.join("\n");
			}

			style.textContent = scopedCss;
		}
	});
}
