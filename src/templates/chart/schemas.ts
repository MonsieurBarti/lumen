/**
 * Schemas for the type:"chart" PI tool route (v0.2 slice 3).
 *
 * Four chart types ship in slice 3 — they cover ~90% of typical chart
 * requests. The other 5 (area, scatter, radar, funnel, bubble) land as
 * patch-series extensions; new entries plug into ChartContent's
 * discriminated union.
 *
 * The TS schema mirrors the existing JSON schemas in
 * skills/lumen-chart/schemas/ (used as LLM-authoring guidance for the
 * non-PI path) but stays narrow to what each renderer actually consumes.
 *
 * Style matches src/templates/diagram/schemas.ts (Reflect.get + manual
 * guards, asArray narrows items to object).
 */

/* ────────────────────────────────────────────────────────────────────
   Type definitions (authoritative; the JSON schemas in
   skills/lumen-chart/schemas/ are the LLM-facing copy)
   ──────────────────────────────────────────────────────────────────── */

export interface DataPoint {
	label: string;
	value: number;
	/** Optional inline tooltip (rendered on the SVG mark via <title>). */
	tip?: string;
}

export interface BarSeries {
	name: string;
	data: DataPoint[];
	/** 6-digit hex color override (#RRGGBB) for bars in this series. */
	color?: string;
}

export interface BarContent {
	chart: "bar";
	series: BarSeries[];
	subtitle?: string;
	/** "grouped" (bars side-by-side) or "stacked" (cumulative). Default "grouped". */
	variant?: "grouped" | "stacked";
	xAxisLabel?: string;
	yAxisLabel?: string;
	/** Skip the legend entirely. Default false. */
	hideLegend?: boolean;
}

export interface PieSlice {
	label: string;
	value: number;
	/** 6-digit hex color override (#RRGGBB). */
	color?: string;
}

export interface PieContent {
	chart: "pie";
	slices: PieSlice[];
	subtitle?: string;
	/** Donut variant inner radius as fraction of outer (0.5–0.65 recommended). 0 = full pie. */
	innerRadius?: number;
}

export interface LineSeries {
	name: string;
	data: DataPoint[];
	color?: string;
}

export interface LineContent {
	chart: "line";
	series: LineSeries[];
	subtitle?: string;
	/** Curve type. Default "linear". */
	curve?: "linear" | "smooth";
	/** Show point markers. Default true. */
	showMarks?: boolean;
	xAxisLabel?: string;
	yAxisLabel?: string;
	hideLegend?: boolean;
}

export interface TableColumn {
	key: string;
	label: string;
	/** Cell type — drives alignment + formatting. */
	type?: "text" | "number" | "verdict";
	/** Highlight the min/max numeric cell in this column. Default false. */
	highlight?: boolean;
}

export type TableRow = Record<string, string | number>;

export interface TableContent {
	chart: "table";
	subtitle?: string;
	columns: TableColumn[];
	rows: TableRow[];
}

export type ChartContent = BarContent | PieContent | LineContent | TableContent;

export const SUPPORTED_CHARTS = [
	"bar",
	"pie",
	"line",
	"table",
] as const satisfies readonly ChartContent["chart"][];

export type SupportedChart = (typeof SUPPORTED_CHARTS)[number];

/* ────────────────────────────────────────────────────────────────────
   Parsers — convert untrusted JSON into typed ChartContent. Throws on
   bad shape with a precise path (e.g. "content.series[2].data[0].value").
   ──────────────────────────────────────────────────────────────────── */

const CHART_TYPES: ReadonlySet<string> = new Set(SUPPORTED_CHARTS);
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

function asString(value: unknown, path: string): string {
	if (typeof value !== "string" || value.length === 0) {
		throw new Error(`${path} must be a non-empty string (got ${typeof value})`);
	}
	return value;
}

function asOptionalString(value: unknown, path: string): string | undefined {
	if (value === undefined) return undefined;
	if (typeof value !== "string") {
		throw new Error(`${path} must be a string when present (got ${typeof value})`);
	}
	return value;
}

function asNumber(value: unknown, path: string): number {
	if (typeof value !== "number" || !Number.isFinite(value)) {
		throw new Error(`${path} must be a finite number (got ${String(value)})`);
	}
	return value;
}

function asOptionalBoolean(value: unknown, path: string): boolean | undefined {
	if (value === undefined) return undefined;
	if (typeof value !== "boolean") {
		throw new Error(`${path} must be a boolean when present (got ${typeof value})`);
	}
	return value;
}

function asOptionalHexColor(value: unknown, path: string): string | undefined {
	if (value === undefined) return undefined;
	if (typeof value !== "string" || !HEX_COLOR.test(value)) {
		throw new Error(`${path} must be a 6-digit hex color (#RRGGBB); got ${String(value)}`);
	}
	return value;
}

function asArray<T>(
	value: unknown,
	path: string,
	mapItem: (item: object, itemPath: string) => T,
	{ min, max }: { min?: number; max?: number } = {},
): T[] {
	if (!Array.isArray(value)) {
		throw new Error(`${path} must be an array (got ${typeof value})`);
	}
	if (min !== undefined && value.length < min) {
		throw new Error(`${path} must contain at least ${min} item(s); got ${value.length}`);
	}
	if (max !== undefined && value.length > max) {
		throw new Error(`${path} must contain at most ${max} item(s); got ${value.length}`);
	}
	return value.map((item, i) => {
		const itemPath = `${path}[${i}]`;
		if (typeof item !== "object" || item === null || Array.isArray(item)) {
			throw new Error(`${itemPath} must be an object`);
		}
		return mapItem(item, itemPath);
	});
}

function parseDataPoint(value: object, path: string): DataPoint {
	const point: DataPoint = {
		label: asString(Reflect.get(value, "label"), `${path}.label`),
		value: asNumber(Reflect.get(value, "value"), `${path}.value`),
	};
	const tip = asOptionalString(Reflect.get(value, "tip"), `${path}.tip`);
	if (tip !== undefined) point.tip = tip;
	return point;
}

function parseBarContent(raw: object): BarContent {
	const series = asArray(
		Reflect.get(raw, "series"),
		"content.series",
		(item, p) => {
			const s: BarSeries = {
				name: asString(Reflect.get(item, "name"), `${p}.name`),
				data: asArray(
					Reflect.get(item, "data"),
					`${p}.data`,
					(dp, dpPath) => parseDataPoint(dp, dpPath),
					{ min: 1, max: 30 },
				),
			};
			const color = asOptionalHexColor(Reflect.get(item, "color"), `${p}.color`);
			if (color !== undefined) s.color = color;
			return s;
		},
		{ min: 1, max: 8 },
	);

	const result: BarContent = { chart: "bar", series };
	const subtitle = asOptionalString(Reflect.get(raw, "subtitle"), "content.subtitle");
	if (subtitle !== undefined) result.subtitle = subtitle;
	// Horizontal direction lands in a v0.2.x patch; for now reject it explicitly
	// rather than silently rendering vertical.
	const direction = Reflect.get(raw, "direction");
	if (direction !== undefined && direction !== "vertical") {
		throw new Error(
			`content.direction "${String(direction)}" is not supported in slice 3; only vertical bars ship today. Drop the direction field or use the lumen-chart skill directly for horizontal.`,
		);
	}
	const variant = Reflect.get(raw, "variant");
	if (variant !== undefined) {
		if (variant !== "grouped" && variant !== "stacked") {
			throw new Error(`content.variant must be "grouped" | "stacked" (got ${String(variant)})`);
		}
		result.variant = variant;
	}
	const xAxisLabel = asOptionalString(Reflect.get(raw, "xAxisLabel"), "content.xAxisLabel");
	if (xAxisLabel !== undefined) result.xAxisLabel = xAxisLabel;
	const yAxisLabel = asOptionalString(Reflect.get(raw, "yAxisLabel"), "content.yAxisLabel");
	if (yAxisLabel !== undefined) result.yAxisLabel = yAxisLabel;
	const hideLegend = asOptionalBoolean(Reflect.get(raw, "hideLegend"), "content.hideLegend");
	if (hideLegend !== undefined) result.hideLegend = hideLegend;

	// Cross-series consistency: all series must share the same data labels in
	// the same order (otherwise grouped/stacked rendering doesn't make sense).
	if (series.length > 1) {
		const reference = series[0]?.data.map((d) => d.label) ?? [];
		series.forEach((s, i) => {
			const labels = s.data.map((d) => d.label);
			if (labels.length !== reference.length || labels.some((l, j) => l !== reference[j])) {
				throw new Error(
					`content.series[${i}].data labels must match content.series[0].data labels (same labels in same order). Got [${labels.join(", ")}], expected [${reference.join(", ")}].`,
				);
			}
		});
	}

	return result;
}

function parsePieContent(raw: object): PieContent {
	const slices = asArray(
		Reflect.get(raw, "slices"),
		"content.slices",
		(item, p) => {
			const slice: PieSlice = {
				label: asString(Reflect.get(item, "label"), `${p}.label`),
				value: asNumber(Reflect.get(item, "value"), `${p}.value`),
			};
			if (slice.value < 0) {
				throw new Error(`${p}.value must be non-negative (got ${slice.value})`);
			}
			const color = asOptionalHexColor(Reflect.get(item, "color"), `${p}.color`);
			if (color !== undefined) slice.color = color;
			return slice;
		},
		{ min: 2, max: 12 },
	);

	const total = slices.reduce((acc, s) => acc + s.value, 0);
	if (total <= 0) {
		throw new Error("content.slices must sum to a positive total (got 0)");
	}

	const result: PieContent = { chart: "pie", slices };
	const subtitle = asOptionalString(Reflect.get(raw, "subtitle"), "content.subtitle");
	if (subtitle !== undefined) result.subtitle = subtitle;
	const innerRadius = Reflect.get(raw, "innerRadius");
	if (innerRadius !== undefined) {
		const n = asNumber(innerRadius, "content.innerRadius");
		if (n < 0 || n >= 1) {
			throw new Error(`content.innerRadius must be in [0, 1) (got ${n})`);
		}
		result.innerRadius = n;
	}
	return result;
}

function parseLineContent(raw: object): LineContent {
	const series = asArray(
		Reflect.get(raw, "series"),
		"content.series",
		(item, p) => {
			const s: LineSeries = {
				name: asString(Reflect.get(item, "name"), `${p}.name`),
				data: asArray(
					Reflect.get(item, "data"),
					`${p}.data`,
					(dp, dpPath) => parseDataPoint(dp, dpPath),
					{ min: 3, max: 100 },
				),
			};
			const color = asOptionalHexColor(Reflect.get(item, "color"), `${p}.color`);
			if (color !== undefined) s.color = color;
			return s;
		},
		{ min: 1, max: 6 },
	);

	const result: LineContent = { chart: "line", series };
	const subtitle = asOptionalString(Reflect.get(raw, "subtitle"), "content.subtitle");
	if (subtitle !== undefined) result.subtitle = subtitle;
	const curve = Reflect.get(raw, "curve");
	if (curve !== undefined) {
		if (curve !== "linear" && curve !== "smooth") {
			throw new Error(`content.curve must be "linear" | "smooth" (got ${String(curve)})`);
		}
		result.curve = curve;
	}
	const showMarks = asOptionalBoolean(Reflect.get(raw, "showMarks"), "content.showMarks");
	if (showMarks !== undefined) result.showMarks = showMarks;
	const xAxisLabel = asOptionalString(Reflect.get(raw, "xAxisLabel"), "content.xAxisLabel");
	if (xAxisLabel !== undefined) result.xAxisLabel = xAxisLabel;
	const yAxisLabel = asOptionalString(Reflect.get(raw, "yAxisLabel"), "content.yAxisLabel");
	if (yAxisLabel !== undefined) result.yAxisLabel = yAxisLabel;
	const hideLegend = asOptionalBoolean(Reflect.get(raw, "hideLegend"), "content.hideLegend");
	if (hideLegend !== undefined) result.hideLegend = hideLegend;

	// Cross-series consistency (same as bar): all series share x labels in order.
	if (series.length > 1) {
		const reference = series[0]?.data.map((d) => d.label) ?? [];
		series.forEach((s, i) => {
			const labels = s.data.map((d) => d.label);
			if (labels.length !== reference.length || labels.some((l, j) => l !== reference[j])) {
				throw new Error(
					`content.series[${i}].data labels must match content.series[0].data labels (same x values in same order).`,
				);
			}
		});
	}

	return result;
}

function parseTableContent(raw: object): TableContent {
	const columns = asArray(
		Reflect.get(raw, "columns"),
		"content.columns",
		(item, p) => {
			const col: TableColumn = {
				key: asString(Reflect.get(item, "key"), `${p}.key`),
				label: asString(Reflect.get(item, "label"), `${p}.label`),
			};
			const typeRaw = Reflect.get(item, "type");
			if (typeRaw !== undefined) {
				if (typeRaw !== "text" && typeRaw !== "number" && typeRaw !== "verdict") {
					throw new Error(
						`${p}.type must be "text" | "number" | "verdict" (got ${String(typeRaw)})`,
					);
				}
				col.type = typeRaw;
			}
			const highlight = asOptionalBoolean(Reflect.get(item, "highlight"), `${p}.highlight`);
			if (highlight !== undefined) col.highlight = highlight;
			return col;
		},
		{ min: 2, max: 12 },
	);

	const columnKeys = new Set(columns.map((c) => c.key));
	if (columnKeys.size !== columns.length) {
		throw new Error("content.columns: column keys must be unique");
	}

	const rows = asArray(
		Reflect.get(raw, "rows"),
		"content.rows",
		(item, p) => {
			const row: TableRow = {};
			for (const col of columns) {
				const cell = Reflect.get(item, col.key);
				if (cell === undefined) {
					throw new Error(`${p}.${col.key} is required (declared in content.columns)`);
				}
				if (col.type === "number") {
					if (typeof cell !== "number" || !Number.isFinite(cell)) {
						throw new Error(
							`${p}.${col.key} must be a finite number (column type="number"); got ${String(cell)}`,
						);
					}
					row[col.key] = cell;
				} else if (col.type === "verdict") {
					if (cell !== "good" && cell !== "caution" && cell !== "bad") {
						throw new Error(
							`${p}.${col.key} must be "good" | "caution" | "bad" (column type="verdict"); got ${String(cell)}`,
						);
					}
					row[col.key] = cell;
				} else {
					if (typeof cell !== "string" && typeof cell !== "number") {
						throw new Error(`${p}.${col.key} must be a string or number; got ${String(cell)}`);
					}
					row[col.key] = cell;
				}
			}
			return row;
		},
		{ min: 1, max: 100 },
	);

	const result: TableContent = { chart: "table", columns, rows };
	const subtitle = asOptionalString(Reflect.get(raw, "subtitle"), "content.subtitle");
	if (subtitle !== undefined) result.subtitle = subtitle;
	return result;
}

/**
 * Validate + normalize an untrusted `content` object from the PI tool param.
 * Throws Error with a precise path on any structural problem.
 */
export function parseChartContent(raw: unknown): ChartContent {
	if (typeof raw !== "object" || raw === null) {
		throw new Error('type:"chart" content must be a plain object describing a chart');
	}
	if (Array.isArray(raw)) {
		throw new Error('type:"chart" content must be a plain object, not an array');
	}
	const obj = raw as object;
	const chart = Reflect.get(obj, "chart");
	if (typeof chart !== "string" || !CHART_TYPES.has(chart)) {
		throw new Error(
			`content.chart must be one of: ${SUPPORTED_CHARTS.join(", ")} (got ${String(chart)}). The other 5 chart types (area, scatter, radar, funnel, bubble) land in v0.2.x patches; use the lumen-chart skill directly until then.`,
		);
	}
	switch (chart as SupportedChart) {
		case "bar":
			return parseBarContent(obj);
		case "pie":
			return parsePieContent(obj);
		case "line":
			return parseLineContent(obj);
		case "table":
			return parseTableContent(obj);
	}
}
