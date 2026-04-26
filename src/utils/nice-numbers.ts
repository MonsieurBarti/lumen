/**
 * Nice Numbers (Wilkinson) — pre-compute axis ticks so labels are clean
 * (`10, 20, 30` not `2.333, 4.667`). Spec: skills/lumen-chart/references/
 * chart-recipes.md → "Nice Numbers (axis ticks)".
 *
 * Pure function. No I/O, no globals.
 */

export interface NiceNumbersResult {
	/** Tick values from `niceMin` to `niceMax` (inclusive), evenly spaced by `niceSpacing`. */
	ticks: number[];
	/** Floor-rounded minimum that fits the data, snapped to a nice tick. */
	niceMin: number;
	/** Ceil-rounded maximum that fits the data, snapped to a nice tick. */
	niceMax: number;
	/** Spacing between consecutive ticks. */
	niceSpacing: number;
}

export interface NiceNumbersOptions {
	/** Target number of ticks. Final count is usually within ±2 of this. Default 6. */
	desiredTickCount?: number;
}

/**
 * Compute nice axis ticks for a data range.
 *
 * @param min  smallest data value
 * @param max  largest data value (must be >= min)
 */
export function niceNumbers(
	min: number,
	max: number,
	{ desiredTickCount = 6 }: NiceNumbersOptions = {},
): NiceNumbersResult {
	if (!Number.isFinite(min) || !Number.isFinite(max)) {
		throw new Error(`niceNumbers: min and max must be finite numbers (got ${min}, ${max})`);
	}
	if (max < min) {
		throw new Error(`niceNumbers: max (${max}) must be >= min (${min})`);
	}
	if (desiredTickCount < 2) {
		throw new Error(`niceNumbers: desiredTickCount must be >= 2 (got ${desiredTickCount})`);
	}

	// Degenerate range — single value. Return [min] with niceMin === niceMax.
	// Caller is responsible for any padding.
	if (min === max) {
		// Round to a sensible neighborhood instead of returning a single point —
		// charts rendering a flat series still need a small range so bars / lines
		// have visible height.
		const magnitude = min === 0 ? 1 : 10 ** Math.floor(Math.log10(Math.abs(min)));
		const padded = Math.max(magnitude, 1);
		return niceNumbers(min - padded, max + padded, { desiredTickCount });
	}

	const range = max - min;
	const unitSpacing = range / (desiredTickCount - 1);
	const magnitude = 10 ** Math.floor(Math.log10(unitSpacing));
	const fraction = unitSpacing / magnitude;

	let niceFraction: number;
	if (fraction <= 1.5) niceFraction = 1;
	else if (fraction <= 3) niceFraction = 2;
	else if (fraction <= 7) niceFraction = 5;
	else niceFraction = 10;

	const niceSpacing = niceFraction * magnitude;
	const niceMin = Math.floor(min / niceSpacing) * niceSpacing;
	const niceMax = Math.ceil(max / niceSpacing) * niceSpacing;

	const ticks: number[] = [];
	// Use rounding to avoid float drift accumulating over many additions.
	const tickCount = Math.round((niceMax - niceMin) / niceSpacing) + 1;
	for (let i = 0; i < tickCount; i++) {
		const value = niceMin + i * niceSpacing;
		// Snap each tick to the spacing grid to clean up float dust like 0.30000000000000004.
		ticks.push(roundToSpacing(value, niceSpacing));
	}

	return { ticks, niceMin, niceMax, niceSpacing };
}

function roundToSpacing(value: number, spacing: number): number {
	// Pick decimals from the spacing so e.g. spacing=0.5 → 1 decimal, spacing=10 → 0 decimals.
	const decimals = Math.max(0, -Math.floor(Math.log10(spacing)));
	const factor = 10 ** decimals;
	return Math.round(value * factor) / factor;
}

/**
 * Format a tick value for display. Uses the spacing's implied decimal precision
 * so axes don't show 6+ decimal trailing zeros.
 */
export function formatTick(value: number, spacing: number): string {
	const decimals = Math.max(0, -Math.floor(Math.log10(spacing)));
	if (Math.abs(value) >= 1000) {
		return value.toLocaleString("en-US", {
			minimumFractionDigits: decimals,
			maximumFractionDigits: decimals,
		});
	}
	return value.toFixed(decimals);
}
