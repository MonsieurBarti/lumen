import { describe, expect, it } from "vitest";

import { formatTick, niceNumbers } from "../src/utils/nice-numbers.js";

describe("niceNumbers", () => {
	it("produces clean ticks for a typical range", () => {
		const r = niceNumbers(0, 100);
		expect(r.ticks[0]).toBe(0);
		expect(r.ticks.at(-1)).toBeGreaterThanOrEqual(100);
		// Each tick clean (no float dust).
		for (const t of r.ticks) {
			expect(t).toBe(Number(t.toFixed(6)));
		}
	});

	it("expands range to nice multiples (Wilkinson)", () => {
		const r = niceNumbers(3, 97);
		expect(r.niceMin).toBeLessThanOrEqual(3);
		expect(r.niceMax).toBeGreaterThanOrEqual(97);
		// Should pick a nice spacing — 10, 20, 25 etc., not 19.4.
		expect([1, 2, 5, 10, 20, 25, 50, 100]).toContain(r.niceSpacing);
	});

	it("handles fractional ranges with single-decimal spacing", () => {
		const r = niceNumbers(0, 0.7);
		expect(r.niceMin).toBe(0);
		expect(r.niceMax).toBeGreaterThanOrEqual(0.7);
		// Cleaned float dust → values like 0.0, 0.1, 0.2 …
		for (const t of r.ticks) {
			expect(t * 100).toBe(Math.round(t * 100));
		}
	});

	it("handles large ranges (millions)", () => {
		const r = niceNumbers(0, 4_500_000);
		expect(r.ticks).toContain(0);
		expect(r.niceMax).toBeGreaterThanOrEqual(4_500_000);
		expect(r.niceSpacing % 100_000).toBe(0);
	});

	it("handles negative ranges", () => {
		const r = niceNumbers(-50, 50);
		expect(r.niceMin).toBeLessThanOrEqual(-50);
		expect(r.niceMax).toBeGreaterThanOrEqual(50);
		expect(r.ticks).toContain(0);
	});

	it("expands a degenerate min===max range", () => {
		const r = niceNumbers(5, 5);
		expect(r.niceMin).toBeLessThan(5);
		expect(r.niceMax).toBeGreaterThan(5);
		expect(r.ticks.length).toBeGreaterThan(1);
	});

	it("rejects non-finite inputs", () => {
		expect(() => niceNumbers(Number.NaN, 10)).toThrow(/finite/);
		expect(() => niceNumbers(0, Number.POSITIVE_INFINITY)).toThrow(/finite/);
	});

	it("rejects max < min", () => {
		expect(() => niceNumbers(10, 5)).toThrow(/max.*>= min/);
	});

	it("rejects desiredTickCount < 2", () => {
		expect(() => niceNumbers(0, 10, { desiredTickCount: 1 })).toThrow(/>= 2/);
	});

	it("respects desiredTickCount roughly", () => {
		const r = niceNumbers(0, 100, { desiredTickCount: 11 });
		// Should land within ±2 of 11 (Wilkinson is approximate).
		expect(r.ticks.length).toBeGreaterThanOrEqual(9);
		expect(r.ticks.length).toBeLessThanOrEqual(13);
	});
});

describe("formatTick", () => {
	it("uses the spacing's implied precision", () => {
		expect(formatTick(0.5, 0.1)).toBe("0.5");
		expect(formatTick(10, 5)).toBe("10");
		expect(formatTick(0.05, 0.01)).toBe("0.05");
	});

	it("uses thousands separator for large values", () => {
		expect(formatTick(1_500_000, 100_000)).toBe("1,500,000");
		expect(formatTick(2500, 500)).toBe("2,500");
	});
});
