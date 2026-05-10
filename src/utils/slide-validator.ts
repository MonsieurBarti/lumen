/// <reference lib="dom" />
import type { Page } from "playwright";

export type IssueType = "overflow" | "descender-clipping" | "unwrapped-text" | "emoji";
export type Severity = "warn" | "error";

export interface Issue {
	type: IssueType;
	severity: Severity;
	message: string;
	selector?: string | undefined;
}

export interface SlideReport {
	slideIndex: number;
	issues: Issue[];
}

export interface ValidationReport {
	slides: SlideReport[];
}

export async function validateSlideHtml(page: Page): Promise<ValidationReport> {
	return page.evaluate(() => {
		function buildSelector(el: Element): string {
			if (el.id) return `#${el.id}`;
			if (el.className && typeof el.className === "string") {
				const classes = el.className.trim().split(/\s+/).filter(Boolean);
				if (classes.length > 0) return `.${classes.join(".")}`;
			}
			return el.tagName.toLowerCase();
		}

		const SLIDE_WIDTH = 1280;
		const SLIDE_HEIGHT = 720;
		const TOLERANCE = 1;

		const slides = document.querySelectorAll(".slide");
		const report: Array<{
			slideIndex: number;
			issues: Array<{
				type: "overflow" | "descender-clipping" | "unwrapped-text" | "emoji";
				severity: "warn" | "error";
				message: string;
				selector?: string | undefined;
			}>;
		}> = [];

		for (let i = 0; i < slides.length; i++) {
			const slide = slides.item(i);
			if (!(slide instanceof HTMLElement)) continue;

			const issues: Array<{
				type: "overflow" | "descender-clipping" | "unwrapped-text" | "emoji";
				severity: "warn" | "error";
				message: string;
				selector?: string | undefined;
			}> = [];
			const slideRect = slide.getBoundingClientRect();

			const slideRight = slideRect.left + SLIDE_WIDTH;
			const slideBottom = slideRect.top + SLIDE_HEIGHT;

			// 1. Overflow detector
			const allElements = slide.querySelectorAll("*");
			for (let j = 0; j < allElements.length; j++) {
				const el = allElements.item(j);
				if (!(el instanceof HTMLElement)) continue;
				const rect = el.getBoundingClientRect();
				if (
					rect.right > slideRight + TOLERANCE ||
					rect.bottom > slideBottom + TOLERANCE ||
					rect.left < slideRect.left - TOLERANCE ||
					rect.top < slideRect.top - TOLERANCE
				) {
					issues.push({
						type: "overflow",
						severity: "error",
						message: `element overflows slide bounds (${Math.round(rect.width)}x${Math.round(rect.height)} at ${Math.round(rect.left)},${Math.round(rect.top)})`,
						selector: buildSelector(el),
					});
					break;
				}
			}

			// 2. Descender clipping detector
			const textElements = slide.querySelectorAll("p, span, h1, h2, h3, h4, h5, h6, li, div");
			for (let j = 0; j < textElements.length; j++) {
				const el = textElements.item(j);
				if (!(el instanceof HTMLElement)) continue;
				const rect = el.getBoundingClientRect();
				const style = window.getComputedStyle(el);
				const lineHeight = Number.parseFloat(style.lineHeight);
				const fontSize = Number.parseFloat(style.fontSize);
				const hasLineHeightVariance =
					Number.isFinite(lineHeight) &&
					Number.isFinite(fontSize) &&
					Math.abs(lineHeight - fontSize) > 0.5;

				if (rect.bottom > slideBottom + TOLERANCE && hasLineHeightVariance) {
					issues.push({
						type: "descender-clipping",
						severity: "warn",
						message: `text may have descenders clipped (bottom=${Math.round(rect.bottom)} > slide=${Math.round(slideBottom)})`,
						selector: buildSelector(el),
					});
					break;
				}
			}

			// 3. Unwrapped text nodes
			const textContainers = [
				slide,
				...Array.from(slide.querySelectorAll("div, section, article")),
			];
			for (const container of textContainers) {
				if (!(container instanceof HTMLElement)) continue;
				for (let k = 0; k < container.childNodes.length; k++) {
					const node = container.childNodes.item(k);
					if (
						node.nodeType === Node.TEXT_NODE &&
						node.textContent &&
						node.textContent.trim().length > 0
					) {
						const parent = node.parentElement;
						if (parent) {
							const tag = parent.tagName;
							const allowed = /^P|SPAN|H[1-6]|LI|A|STRONG|EM|CODE|PRE|BLOCKQUOTE$/;
							if (!allowed.test(tag)) {
								issues.push({
									type: "unwrapped-text",
									severity: "warn",
									message: `text not wrapped in semantic element: "${node.textContent.trim().slice(0, 40)}"`,
									selector: buildSelector(parent),
								});
								break;
							}
						}
					}
				}
				if (issues.some((issue) => issue.type === "unwrapped-text")) break;
			}

			// 4. Emoji detector
			const slideText = slide.textContent || "";
			const emojiRegex =
				/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F100}-\u{1F1FF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{200D}]|[\u{FE0F}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FAFF}]/gu;
			const emojiMatches = slideText.match(emojiRegex);
			if (emojiMatches && emojiMatches.length > 0) {
				issues.push({
					type: "emoji",
					severity: "warn",
					message: `emoji detected (${emojiMatches.length} occurrences); may not render correctly in pptx`,
				});
			}

			report.push({ slideIndex: i, issues });
		}

		return { slides: report };
	});
}

export function formatValidationReport(report: ValidationReport): string {
	const lines: string[] = [];
	for (const slide of report.slides) {
		if (slide.issues.length === 0) continue;
		lines.push(`slide ${slide.slideIndex}:`);
		for (const issue of slide.issues) {
			const selector = issue.selector ? ` (${issue.selector})` : "";
			lines.push(`  [${issue.severity}] ${issue.type}: ${issue.message}${selector}`);
		}
	}
	return lines.join("\n");
}
