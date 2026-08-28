import { Type } from "typebox";
import { describe, expect, it } from "vitest";

import { stringEnum } from "../src/utils/string-enum.js";

describe("stringEnum", () => {
	it("builds a Union of Literals with description", () => {
		const schema = stringEnum(["light", "dark", "auto"] as const, {
			description: "theme",
		});
		expect(schema).toMatchObject({
			anyOf: [{ const: "light" }, { const: "dark" }, { const: "auto" }],
			description: "theme",
		});
	});

	it("omits options when none are provided", () => {
		const schema = stringEnum(["a", "b"] as const);
		expect(schema).toMatchObject({
			anyOf: [{ const: "a" }, { const: "b" }],
		});
		expect(schema).not.toHaveProperty("description");
	});

	it("uses named Type builders (same contract OMP remaps)", () => {
		expect(typeof Type.String).toBe("function");
		expect(typeof Type.Union).toBe("function");
		expect(typeof Type.Literal).toBe("function");
	});
});
