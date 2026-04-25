import { describe, expect, it } from "vitest";

import { LUMEN_SKILLS, LUMEN_VERSION } from "../src/index.js";

describe("lumen", () => {
	it("exposes a semver version string", () => {
		expect(LUMEN_VERSION).toMatch(/^\d+\.\d+\.\d+/);
	});

	it("declares the eight v0 skills", () => {
		expect(LUMEN_SKILLS).toEqual([
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
});
