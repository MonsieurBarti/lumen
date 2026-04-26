import { describe, expect, it } from "vitest";

import { generateArchitectureTemplate } from "../src/templates/architecture.js";

describe("generateArchitectureTemplate", () => {
	const minSections = {
		sections: [
			{ label: "Frontend", content: "<p>React app on Vercel</p>" },
			{ label: "Backend", content: "<p>Node.js API</p>" },
		],
	};

	it("emits a self-contained HTML document", () => {
		const html = generateArchitectureTemplate("System X", minSections, "blueprint", false);
		expect(html).toContain("<!DOCTYPE html>");
		expect(html).toContain("</html>");
		expect(html).toContain("System X");
		expect(html).toContain("Frontend");
		expect(html).toContain("Backend");
	});

	it("escapes the title", () => {
		const html = generateArchitectureTemplate(
			"<script>alert(1)</script>",
			minSections,
			"blueprint",
			false,
		);
		expect(html).not.toContain("<script>alert(1)</script>");
		expect(html).toContain("&lt;script&gt;");
	});

	it("renders flow arrows when supplied", () => {
		const html = generateArchitectureTemplate(
			"Pipeline",
			{
				sections: [
					{ label: "Source", content: "<p>S3</p>" },
					{ label: "Sink", content: "<p>BigQuery</p>" },
				],
				flowArrows: [{ label: "stream events" }],
			},
			"blueprint",
			false,
		);
		expect(html).toContain("flow-arrow");
		expect(html).toContain("stream events");
	});

	it("renders a hero section when isHero is set", () => {
		const html = generateArchitectureTemplate(
			"Hero",
			{
				sections: [{ label: "Big idea", content: "<p>cake</p>", isHero: true }],
			},
			"editorial",
			true,
		);
		expect(html).toContain("section--hero");
	});

	it("renders a recessed section when isRecessed is set", () => {
		const html = generateArchitectureTemplate(
			"Recessed",
			{
				sections: [{ label: "Detail", content: "<p>fine print</p>", isRecessed: true }],
			},
			"editorial",
			false,
		);
		expect(html).toContain("section--recessed");
	});

	it("renders a 3-column block when threeColumn is supplied", () => {
		const html = generateArchitectureTemplate(
			"Three columns",
			{
				sections: [],
				threeColumn: [
					{ label: "Col A", content: "a" },
					{ label: "Col B", content: "b" },
					{ label: "Col C", content: "c" },
				],
			},
			"blueprint",
			false,
		);
		expect(html).toContain("Col A");
		expect(html).toContain("Col B");
		expect(html).toContain("Col C");
	});

	it("renders all 8 aesthetics in light + dark", () => {
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
				const html = generateArchitectureTemplate(
					`${aesthetic} ${isDark ? "dark" : "light"}`,
					minSections,
					aesthetic,
					isDark,
				);
				expect(html).toContain("<!DOCTYPE html>");
				expect(html.length).toBeGreaterThan(1000);
			}
		}
	});

	it("respects all five label colors", () => {
		const html = generateArchitectureTemplate(
			"Colors",
			{
				sections: [
					{ label: "A", content: "x", labelColor: "accent" },
					{ label: "B", content: "x", labelColor: "green" },
					{ label: "C", content: "x", labelColor: "orange" },
					{ label: "D", content: "x", labelColor: "teal" },
					{ label: "E", content: "x", labelColor: "plum" },
				],
			},
			"blueprint",
			false,
		);
		expect(html).toContain("--accent");
		expect(html).toContain("--green");
		expect(html).toContain("--orange");
		expect(html).toContain("--teal");
		expect(html).toContain("--plum");
	});
});
