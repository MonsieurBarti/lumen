/**
 * Comparison table renderer.
 *
 * Layout (chart-recipes.md → Table / comparison matrix):
 *   - HTML <table> (no SVG)
 *   - Sticky header (position: sticky; top: 0)
 *   - Numeric columns: right-aligned, tabular-nums
 *   - Min/max highlighting per column when column.highlight === true:
 *     min cell gets --green-dim background, max gets --accent-dim;
 *     skipped if the column has fewer than 3 values
 *   - Verdict cells: pill styling, color from --green / --orange / --red
 */

import { escapeHtml } from "../shared.js";
import type { TableColumn, TableContent, TableRow } from "./schemas.js";

const TABLE_CSS = `
  .lumen-table-wrap {
    overflow-x: auto;
    border-radius: 8px;
    background: var(--bg-card);
  }
  .lumen-table {
    width: 100%;
    border-collapse: collapse;
    font-family: 'Inter', system-ui, sans-serif;
    font-size: 13px;
    color: var(--text);
  }
  .lumen-table thead th {
    position: sticky;
    top: 0;
    background: var(--bg-panel);
    border-bottom: 1px solid var(--border-bright);
    padding: 10px 12px;
    text-align: left;
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--text-dim);
    font-weight: 700;
    z-index: 1;
  }
  .lumen-table tbody td {
    padding: 9px 12px;
    border-bottom: 1px solid var(--border);
  }
  .lumen-table tbody tr:last-child td { border-bottom: none; }
  .lumen-table tbody tr:hover { background: rgba(148, 163, 184, 0.04); }
  .lumen-table .num {
    text-align: right;
    font-variant-numeric: tabular-nums;
    font-family: 'JetBrains Mono', 'Space Mono', monospace;
    font-size: 12.5px;
  }
  .lumen-table .cell-min {
    background: color-mix(in srgb, var(--green) 18%, transparent);
    color: var(--green);
    font-weight: 700;
  }
  .lumen-table .cell-max {
    background: color-mix(in srgb, var(--accent) 18%, transparent);
    color: var(--accent);
    font-weight: 700;
  }
  .lumen-table .verdict {
    display: inline-block;
    padding: 2px 10px;
    border-radius: 999px;
    font-family: 'Space Mono', monospace;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.04em;
  }
  .lumen-table .verdict.good    { background: color-mix(in srgb, var(--green) 18%, transparent); color: var(--green); }
  .lumen-table .verdict.caution { background: color-mix(in srgb, #fb923c 18%, transparent);   color: #fb923c; }
  .lumen-table .verdict.bad     { background: color-mix(in srgb, var(--red) 18%, transparent); color: var(--red); }`;

function computeHighlights(
	columns: TableColumn[],
	rows: TableRow[],
): Map<string, { min: number; max: number }> {
	const map = new Map<string, { min: number; max: number }>();
	for (const col of columns) {
		if (col.type !== "number" || !col.highlight) continue;
		const values: number[] = [];
		for (const row of rows) {
			const v = row[col.key];
			if (typeof v === "number") values.push(v);
		}
		if (values.length < 3) continue;
		map.set(col.key, { min: Math.min(...values), max: Math.max(...values) });
	}
	return map;
}

function formatCell(col: TableColumn, value: string | number): string {
	if (col.type === "number" && typeof value === "number") {
		return value.toLocaleString("en-US");
	}
	return escapeHtml(String(value));
}

function generateBody(content: TableContent): string {
	const { columns, rows } = content;
	const highlights = computeHighlights(columns, rows);

	const headerCells = columns
		.map((col) => {
			const align = col.type === "number" ? ' style="text-align:right"' : "";
			return `      <th${align}>${escapeHtml(col.label)}</th>`;
		})
		.join("\n");

	const bodyRows = rows
		.map((row) => {
			const cells = columns
				.map((col) => {
					const value = row[col.key];
					if (col.type === "verdict" && typeof value === "string") {
						return `      <td><span class="verdict ${value}">${value}</span></td>`;
					}
					if (col.type === "number") {
						const classes = ["num"];
						const hi = highlights.get(col.key);
						if (hi !== undefined && typeof value === "number") {
							if (value === hi.min) classes.push("cell-min");
							if (value === hi.max) classes.push("cell-max");
						}
						return `      <td class="${classes.join(" ")}">${formatCell(col, value ?? "")}</td>`;
					}
					return `      <td>${formatCell(col, value ?? "")}</td>`;
				})
				.join("\n");
			return `    <tr>\n${cells}\n    </tr>`;
		})
		.join("\n");

	const ariaLabel = `Comparison table with ${columns.length} columns and ${rows.length} rows.`;

	return `<div class="lumen-table-wrap" role="region" aria-label="${escapeHtml(ariaLabel)}">
<table class="lumen-table">
  <thead>
    <tr>
${headerCells}
    </tr>
  </thead>
  <tbody>
${bodyRows}
  </tbody>
</table>
</div>`;
}

export interface TableRenderInput {
	title: string;
	subtitle?: string;
	content: TableContent;
}

export function renderTableBody({ content }: TableRenderInput): {
	chartHtml: string;
	chartCss: string;
} {
	return {
		chartHtml: generateBody(content),
		chartCss: TABLE_CSS,
	};
}
