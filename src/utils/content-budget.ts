/**
 * Static content-budget checks for lumen slide decks.
 *
 * Encodes evidence-based presentation rules (PLOS CompBio ten rules,
 * UCSD multimedia learning, 5-5-5 / 6×6 heuristics) so agents and CI
 * can fail loud before a deck ships to a boardroom.
 *
 * Pure string/HTML analysis — no browser required.
 */

export type ContentBudgetIssueType =
	| "too-many-bullets"
	| "long-bullet"
	| "generic-title"
	| "consecutive-text-heavy"
	| "too-many-elements"
	| "missing-takeaway-title";

export type ContentBudgetSeverity = "warn" | "error";

export interface ContentBudgetIssue {
	slideIndex: number;
	type: ContentBudgetIssueType;
	severity: ContentBudgetSeverity;
	message: string;
}

export interface ContentBudgetReport {
	slides: number;
	issues: ContentBudgetIssue[];
}

/** Soft ceiling — UCSD "rule of four". */
export const MAX_BULLETS_WARN = 4;
/** Hard ceiling — 6×6 / Phillips cognitive-load band. */
export const MAX_BULLETS_ERROR = 6;
/** Soft ceiling on words per bullet line. */
export const MAX_WORDS_PER_BULLET_WARN = 12;
/** Hard ceiling on words per bullet line. */
export const MAX_WORDS_PER_BULLET_ERROR = 20;
/** Soft ceiling on major visual blocks per slide. */
export const MAX_VISUAL_ELEMENTS_WARN = 6;
/** How many consecutive text-heavy slides trigger a warning. */
export const MAX_CONSECUTIVE_TEXT_HEAVY = 2;

/** Titles that fail the "heading = takeaway" rule (PLOS Rule 3). */
export const GENERIC_TITLES = new Set(
	[
		"results",
		"overview",
		"introduction",
		"agenda",
		"summary",
		"background",
		"next steps",
		"conclusion",
		"content",
		"details",
		"update",
		"status",
		"discussion",
		"appendix",
		"q&a",
		"qa",
		"questions",
		"thank you",
		"thanks",
	].map((s) => s.toLowerCase()),
);

interface ParsedSlide {
	index: number;
	html: string;
	title: string | null;
	bullets: string[];
	isTextHeavy: boolean;
	visualElementCount: number;
}

function stripTags(html: string): string {
	return html
		.replace(/<script[\s\S]*?<\/script>/gi, " ")
		.replace(/<style[\s\S]*?<\/style>/gi, " ")
		.replace(/<aside\b[^>]*class=["'][^"']*speaker-notes[^"']*["'][^>]*>[\s\S]*?<\/aside>/gi, " ")
		.replace(/<[^>]+>/g, " ")
		.replace(/&nbsp;/g, " ")
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&mdash;/g, "—")
		.replace(/&ndash;/g, "–")
		.replace(/&#\d+;/g, " ")
		.replace(/\s+/g, " ")
		.trim();
}

function countWords(text: string): number {
	const t = text.trim();
	if (!t) return 0;
	return t.split(/\s+/).filter(Boolean).length;
}

function extractSlides(html: string): string[] {
	const slides: string[] = [];
	const re = /<section\b[^>]*\bclass=["'][^"']*\bslide\b[^"']*["'][^>]*>[\s\S]*?<\/section>/gi;
	let match: RegExpExecArray | null = re.exec(html);
	while (match) {
		slides.push(match[0]);
		match = re.exec(html);
	}
	return slides;
}

function extractTitle(slideHtml: string): string | null {
	const headingMatch = slideHtml.match(/<h[12]\b[^>]*>([\s\S]*?)<\/h[12]>/i);
	if (!headingMatch?.[1]) return null;
	const text = stripTags(headingMatch[1]);
	return text || null;
}

function extractBullets(slideHtml: string): string[] {
	const bullets: string[] = [];
	const re = /<li\b[^>]*>([\s\S]*?)<\/li>/gi;
	let match: RegExpExecArray | null = re.exec(slideHtml);
	while (match) {
		const text = stripTags(match[1] ?? "");
		if (text) bullets.push(text);
		match = re.exec(slideHtml);
	}
	return bullets;
}

/**
 * Densest single list on the slide. Comparison / split layouts legitimately
 * carry ≤4 bullets *per column* — counting the whole slide would false-positive.
 */
function maxBulletsInAnyList(slideHtml: string): { max: number; densest: string[] } {
	const lists = slideHtml.match(/<ul\b[^>]*>[\s\S]*?<\/ul>/gi) ?? [];
	if (lists.length === 0) {
		const all = extractBullets(slideHtml);
		return { max: all.length, densest: all };
	}
	let densest: string[] = [];
	for (const list of lists) {
		const items = extractBullets(list);
		if (items.length > densest.length) densest = items;
	}
	return { max: densest.length, densest };
}

function countVisualElements(slideHtml: string): number {
	let count = 0;
	// Strip mermaid / code blocks first so their internal <svg>/<pre> nodes
	// don't inflate the Phillips ≤6 budget — each block is one visual unit.
	const stripped = slideHtml
		.replace(
			/<div\b[^>]*class=["'][^"']*\bmermaid\b[^"']*["'][^>]*>[\s\S]*?<\/div>/gi,
			"<!--mermaid-->",
		)
		.replace(
			/<pre\b[^>]*class=["'][^"']*\bmermaid\b[^"']*["'][^>]*>[\s\S]*?<\/pre>/gi,
			"<!--mermaid-->",
		)
		.replace(/class=["'][^"']*\bslide__code-block\b[^"']*["'][\s\S]*?<\/div>/gi, "<!--code-->");

	const mermaidUnits = (slideHtml.match(/\bmermaid\b/gi) || []).length > 0 ? 1 : 0;
	const codeUnits = (slideHtml.match(/\bslide__code-block\b/gi) || []).length;
	// Exact BEM block only — do not count slide__kpi-val / -label / -trend.
	const kpiUnits = (slideHtml.match(/\bslide__kpi(?![-\w])/gi) || []).length;
	const imgUnits = (stripped.match(/<img\b/gi) || []).length;
	const svgUnits = (stripped.match(/<svg\b/gi) || []).length;
	const tableUnits = (stripped.match(/<table\b/gi) || []).length;
	const canvasUnits = (stripped.match(/<canvas\b/gi) || []).length;
	const iframeUnits = (stripped.match(/<iframe\b/gi) || []).length;

	count =
		mermaidUnits +
		codeUnits +
		kpiUnits +
		imgUnits +
		svgUnits +
		tableUnits +
		canvasUnits +
		iframeUnits;
	return count;
}

function isTextHeavy(slideHtml: string, bullets: string[], visuals: number): boolean {
	const hasDiagramClass = /\bslide--(?:diagram|dashboard|table|code|image|bleed|quote)\b/i.test(
		slideHtml,
	);
	if (hasDiagramClass && visuals > 0) return false;
	if (visuals >= 1 && bullets.length <= 2) return false;
	if (bullets.length >= 3) return true;
	// Long paragraph body without visuals
	const bodyText = stripTags(slideHtml);
	if (visuals === 0 && countWords(bodyText) > 60) return true;
	return false;
}

function parseSlides(html: string): ParsedSlide[] {
	return extractSlides(html).map((slideHtml, index) => {
		const { densest: bullets } = maxBulletsInAnyList(slideHtml);
		const visualElementCount = countVisualElements(slideHtml);
		return {
			index,
			html: slideHtml,
			title: extractTitle(slideHtml),
			bullets,
			visualElementCount,
			isTextHeavy: isTextHeavy(slideHtml, bullets, visualElementCount),
		};
	});
}

/**
 * Validate a slide-deck HTML string against content-budget rules.
 * Returns every issue found; empty `issues` means the deck is clean.
 */
export function validateContentBudgets(html: string): ContentBudgetReport {
	const slides = parseSlides(html);
	const issues: ContentBudgetIssue[] = [];

	for (const slide of slides) {
		// Bullet count
		if (slide.bullets.length > MAX_BULLETS_ERROR) {
			issues.push({
				slideIndex: slide.index,
				type: "too-many-bullets",
				severity: "error",
				message: `${slide.bullets.length} bullets (max ${MAX_BULLETS_ERROR}; prefer ≤${MAX_BULLETS_WARN})`,
			});
		} else if (slide.bullets.length > MAX_BULLETS_WARN) {
			issues.push({
				slideIndex: slide.index,
				type: "too-many-bullets",
				severity: "warn",
				message: `${slide.bullets.length} bullets exceeds the rule-of-four soft ceiling (≤${MAX_BULLETS_WARN})`,
			});
		}

		// Words per bullet
		for (const bullet of slide.bullets) {
			const words = countWords(bullet);
			if (words > MAX_WORDS_PER_BULLET_ERROR) {
				issues.push({
					slideIndex: slide.index,
					type: "long-bullet",
					severity: "error",
					message: `bullet has ${words} words (max ${MAX_WORDS_PER_BULLET_ERROR}): "${bullet.slice(0, 48)}…"`,
				});
			} else if (words > MAX_WORDS_PER_BULLET_WARN) {
				issues.push({
					slideIndex: slide.index,
					type: "long-bullet",
					severity: "warn",
					message: `bullet has ${words} words (prefer ≤${MAX_WORDS_PER_BULLET_WARN}): "${bullet.slice(0, 48)}…"`,
				});
			}
		}

		// Generic / missing takeaway title (skip pure title/closing slides without body intent)
		// Title/closing/bleed/quote carry their claim in display/quote text, not h2.
		const isChromeSlide = /\bslide--(?:title|closing|bleed|quote)\b/i.test(slide.html);
		if (!isChromeSlide) {
			if (!slide.title) {
				issues.push({
					slideIndex: slide.index,
					type: "missing-takeaway-title",
					severity: "warn",
					message: "slide has no h1/h2 takeaway title",
				});
			} else if (
				GENERIC_TITLES.has(
					slide.title
						.toLowerCase()
						.replace(/[.!?]+$/, "")
						.trim(),
				)
			) {
				issues.push({
					slideIndex: slide.index,
					type: "generic-title",
					severity: "warn",
					message: `title "${slide.title}" is generic — write the takeaway (PLOS Rule 3)`,
				});
			}
		}

		// Visual element overload (Phillips ≤6)
		if (slide.visualElementCount > MAX_VISUAL_ELEMENTS_WARN) {
			issues.push({
				slideIndex: slide.index,
				type: "too-many-elements",
				severity: "warn",
				message: `${slide.visualElementCount} major visual elements (prefer ≤${MAX_VISUAL_ELEMENTS_WARN})`,
			});
		}
	}

	// Consecutive text-heavy runs
	let runStart = -1;
	let runLen = 0;
	const flushRun = (endExclusive: number) => {
		if (runLen > MAX_CONSECUTIVE_TEXT_HEAVY) {
			issues.push({
				slideIndex: runStart,
				type: "consecutive-text-heavy",
				severity: "warn",
				message: `${runLen} consecutive text-heavy slides (indices ${runStart}–${endExclusive - 1}); break with a visual/diagram/quote`,
			});
		}
	};
	for (const slide of slides) {
		if (slide.isTextHeavy) {
			if (runLen === 0) runStart = slide.index;
			runLen += 1;
		} else {
			flushRun(slide.index);
			runLen = 0;
			runStart = -1;
		}
	}
	flushRun(slides.length);

	return { slides: slides.length, issues };
}

export function formatContentBudgetReport(report: ContentBudgetReport): string {
	if (report.issues.length === 0) {
		return `content-budget: ${report.slides} slides, clean`;
	}
	const lines = [`content-budget: ${report.slides} slides, ${report.issues.length} issue(s)`];
	for (const issue of report.issues) {
		lines.push(`  slide ${issue.slideIndex}: [${issue.severity}] ${issue.type}: ${issue.message}`);
	}
	return lines.join("\n");
}

export function contentBudgetHasErrors(report: ContentBudgetReport): boolean {
	return report.issues.some((i) => i.severity === "error");
}
