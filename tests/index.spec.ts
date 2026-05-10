import { describe, expect, it } from "vitest";

import {
	LUMEN_CAPABILITIES,
	LUMEN_COMPOSITES,
	LUMEN_PLAYBOOKS,
	LUMEN_SKILLS,
	LUMEN_VERSION,
	generateMermaidTemplate,
} from "../src/index.js";

describe("lumen package", () => {
	it("exposes a semver version string", () => {
		expect(LUMEN_VERSION).toMatch(/^\d+\.\d+\.\d+/);
	});

	it("declares the eight v0 capabilities (atomic skills)", () => {
		expect(LUMEN_CAPABILITIES).toEqual([
			"lumen-diagram",
			"lumen-chart",
			"lumen-mermaid",
			"lumen-slides",
			"lumen-gallery",
			"lumen-guide",
			"lumen-recap",
			"lumen-fact-check",
		]);
	});

	it("declares composites (molecular skills) that orchestrate capabilities", () => {
		expect(LUMEN_COMPOSITES).toEqual([
			"lumen-architecture-doc",
			"lumen-readme-pack",
			"lumen-launch-deck",
			"lumen-postmortem",
		]);
	});

	it("declares playbooks (compound skills) that orchestrate composites", () => {
		expect(LUMEN_PLAYBOOKS).toEqual(["lumen-document-this-project", "lumen-release-pack"]);
	});

	it("LUMEN_SKILLS is the union of all tiers", () => {
		expect(LUMEN_SKILLS).toEqual([...LUMEN_CAPABILITIES, ...LUMEN_COMPOSITES, ...LUMEN_PLAYBOOKS]);
	});
});

describe("generateMermaidTemplate", () => {
	const sampleSyntax = "graph TD\n  A[Start] --> B[End]";

	it("emits a self-contained HTML document", () => {
		const html = generateMermaidTemplate(
			"Hello",
			{ mermaidSyntax: sampleSyntax },
			"blueprint",
			false,
		);
		expect(html).toContain("<!DOCTYPE html>");
		expect(html).toContain("</html>");
		expect(html).toContain('class="diagram-source"');
		expect(html).toContain("graph TD");
	});

	it("escapes embedded `</script>` so HTML parser does not break the source", () => {
		const html = generateMermaidTemplate(
			"Edge case",
			{ mermaidSyntax: 'graph TD\n  A --> B["</script>"]' },
			"blueprint",
			false,
		);
		// Inside the diagram-source script tag we must never have a literal
		// `</script>` — that would terminate the embed and corrupt the file.
		const afterTag = html.split('class="diagram-source"')[1] ?? "";
		const sourceBlock = afterTag.split("</script>")[0] ?? "";
		expect(sourceBlock).not.toMatch(/<\/script>/i);
		expect(sourceBlock).toMatch(/<\\\/script>/i);
	});

	it("uses concrete font strings (CSS vars don't survive SVG export)", () => {
		const html = generateMermaidTemplate(
			"Fonts",
			{ mermaidSyntax: sampleSyntax },
			"editorial",
			true,
		);
		// The mermaid theme config should NOT reference `var(--font-...)`
		// inside the themeVariables block; that would not resolve when the
		// SVG is exported to a new tab.
		const themeBlock = html.split("themeVariables: {")[1]?.split("}")[0] ?? "";
		expect(themeBlock).not.toContain("var(--");
	});

	it("propagates the page background to data-bg for new-tab export", () => {
		const html = generateMermaidTemplate("Bg", { mermaidSyntax: sampleSyntax }, "dracula", true);
		expect(html).toMatch(/class="mermaid-wrap" data-bg="#[0-9a-fA-F]{6}"/);
	});

	it("renders all 8 aesthetics in light and dark", () => {
		const aesthetics = [
			"blueprint",
			"editorial",
			"paper",
			"terminal",
			"dracula",
			"nord",
			"solarized",
			"gruvbox",
		] as const;
		for (const aesthetic of aesthetics) {
			for (const isDark of [false, true]) {
				const html = generateMermaidTemplate(
					`${aesthetic} ${isDark ? "dark" : "light"}`,
					{ mermaidSyntax: sampleSyntax },
					aesthetic,
					isDark,
				);
				expect(html).toContain("<!DOCTYPE html>");
				expect(html.length).toBeGreaterThan(1000);
			}
		}
	});
});
