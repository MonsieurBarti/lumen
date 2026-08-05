import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
	MAX_BULLETS_ERROR,
	MAX_BULLETS_WARN,
	contentBudgetHasErrors,
	formatContentBudgetReport,
	validateContentBudgets,
} from "../src/utils/content-budget.js";

function slide(inner: string, cls = "slide--content"): string {
	return `<section class="slide ${cls}">${inner}</section>`;
}

function deck(...slides: string[]): string {
	return `<!DOCTYPE html><html><body><div class="deck">${slides.join("\n")}</div></body></html>`;
}

describe("validateContentBudgets", () => {
	it("passes a clean deck", () => {
		const html = deck(
			slide("<h2>CTNND1 drives metastasis</h2><ul><li>One</li><li>Two</li><li>Three</li></ul>"),
			slide(`<h2>Latency dropped 10x</h2><div class="slide__kpi">12ms</div>`, "slide--dashboard"),
		);
		const report = validateContentBudgets(html);
		expect(report.slides).toBe(2);
		expect(report.issues).toEqual([]);
		expect(contentBudgetHasErrors(report)).toBe(false);
		expect(formatContentBudgetReport(report)).toContain("clean");
	});

	it("warns above four bullets and errors above six", () => {
		const five = deck(
			slide(
				`<h2>Too many points</h2><ul>${Array.from({ length: 5 }, (_, i) => `<li>Point ${i}</li>`).join("")}</ul>`,
			),
		);
		const fiveReport = validateContentBudgets(five);
		expect(
			fiveReport.issues.some((i) => i.type === "too-many-bullets" && i.severity === "warn"),
		).toBe(true);
		expect(fiveReport.issues[0]?.message).toContain(String(MAX_BULLETS_WARN));

		const seven = deck(
			slide(
				`<h2>Way too many</h2><ul>${Array.from({ length: MAX_BULLETS_ERROR + 1 }, (_, i) => `<li>Point ${i}</li>`).join("")}</ul>`,
			),
		);
		const sevenReport = validateContentBudgets(seven);
		expect(
			sevenReport.issues.some((i) => i.type === "too-many-bullets" && i.severity === "error"),
		).toBe(true);
		expect(contentBudgetHasErrors(sevenReport)).toBe(true);
	});

	it("flags long bullets", () => {
		const long =
			"This bullet contains far too many words for a projected slide and forces the audience to read instead of listen to the speaker";
		const html = deck(slide(`<h2>Dense copy</h2><ul><li>${long}</li></ul>`));
		const report = validateContentBudgets(html);
		expect(report.issues.some((i) => i.type === "long-bullet")).toBe(true);
	});

	it("flags generic takeaway titles", () => {
		const html = deck(slide("<h2>Results</h2><ul><li>Alpha</li></ul>"));
		const report = validateContentBudgets(html);
		expect(report.issues.some((i) => i.type === "generic-title")).toBe(true);
	});

	it("skips generic-title check on title/closing chrome slides", () => {
		const html = deck(
			slide("<h1>Thank You</h1>", "slide--title"),
			slide("<h2>Thanks</h2>", "slide--closing"),
		);
		const report = validateContentBudgets(html);
		expect(report.issues.filter((i) => i.type === "generic-title")).toEqual([]);
	});

	it("warns on consecutive text-heavy slides", () => {
		const textSlide = (n: number) =>
			slide(
				`<h2>Point ${n} lands hard</h2><ul><li>Alpha ${n}</li><li>Beta ${n}</li><li>Gamma ${n}</li></ul>`,
			);
		const html = deck(textSlide(1), textSlide(2), textSlide(3));
		const report = validateContentBudgets(html);
		expect(report.issues.some((i) => i.type === "consecutive-text-heavy")).toBe(true);
	});

	it("does not flag mixed visual + short text as a long text-heavy run", () => {
		const html = deck(
			slide("<h2>One idea</h2><ul><li>A</li><li>B</li><li>C</li></ul>"),
			slide(`<h2>Diagram</h2><div class="mermaid">graph LR; A-->B</div>`, "slide--diagram"),
			slide("<h2>Another idea</h2><ul><li>A</li><li>B</li><li>C</li></ul>"),
		);
		const report = validateContentBudgets(html);
		expect(report.issues.filter((i) => i.type === "consecutive-text-heavy")).toEqual([]);
	});

	it("ignores speaker-notes when counting body text", () => {
		const notes = "a ".repeat(80);
		const html = deck(
			slide(
				`<h2>Short takeaway</h2><ul><li>One</li></ul><aside class="speaker-notes">${notes}</aside>`,
			),
		);
		const report = validateContentBudgets(html);
		expect(report.issues.filter((i) => i.type === "consecutive-text-heavy")).toEqual([]);
	});

	it("validates the shipped reference template without errors", () => {
		const path = join(import.meta.dirname, "../skills/lumen-slides/templates/slide-deck.html");
		const html = readFileSync(path, "utf8");
		const report = validateContentBudgets(html);
		// Reference deck is a pattern showcase — may warn, must not error.
		expect(contentBudgetHasErrors(report)).toBe(false);
		expect(report.slides).toBeGreaterThan(5);
	});
});
