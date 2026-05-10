/**
 * Gantt renderer — schedule / roadmap / timeline bars.
 *
 * Tasks rendered as horizontal bars on a grid with rows and a time axis.
 */

import { escapeHtml } from "../shared.js";
import type { FgraphTone, GanttContent } from "./schemas.js";

const GANTT_CSS = `
  .fgraph-wrap.gantt {
    position: relative;
    width: 100%;
    max-width: 860px;
    margin: 24px auto 16px;
    background: var(--bg-panel);
    border: 1px solid rgba(34,211,238,0.35);
    border-radius: 10px;
    padding: 14px;
  }

  .gantt-grid {
    position: absolute;
    left: 20%;
    width: 78%;
    top: 10%;
    bottom: 10%;
    border-left: 1px solid var(--border-bright);
    z-index: 0;
  }
  .gantt-grid-line {
    position: absolute;
    top: 0;
    bottom: 0;
    border-left: 1px dashed var(--border-bright);
    opacity: 0.35;
    z-index: 0;
  }

  .gantt-row-lbl {
    position: absolute;
    left: 2%;
    font-family: 'Space Mono', monospace;
    font-size: 9.5px;
    font-weight: 700;
    color: var(--text-dim);
    white-space: nowrap;
    z-index: 1;
  }

  .gantt-bar {
    position: absolute;
    left: calc(var(--x, 20) * 1%);
    top:  calc(var(--y, 50) * 1%);
    width: calc(var(--w, 10) * 1%);
    height: 12px;
    transform: translate(0, -50%);
    border-radius: 3px;
    z-index: 2;
  }
  .gantt-bar.amber  { background: var(--amber); }
  .gantt-bar.cyan   { background: var(--cyan); }
  .gantt-bar.purple { background: var(--purple); }
  .gantt-bar.green  { background: var(--green); }
  .gantt-bar.red    { background: var(--red); }

  .gantt-bar-lbl {
    position: absolute;
    left: calc(var(--x, 20) * 1%);
    top:  calc(var(--y, 50) * 1%);
    transform: translate(2px, -110%);
    font-family: 'Space Mono', monospace;
    font-size: 8.5px;
    color: var(--text-muted);
    white-space: nowrap;
    z-index: 3;
  }

  .gantt-axis {
    position: absolute;
    left: 20%;
    width: 78%;
    bottom: 2%;
    font-family: 'Space Mono', monospace;
    font-size: 8px;
    color: var(--text-muted);
    display: flex;
    justify-content: space-between;
    z-index: 1;
  }`;

function generateBody(content: GanttContent, ariaLabel: string): string {
	const { tasks, timeUnit, legend } = content;

	const maxEnd = Math.max(...tasks.map((t) => t.start + t.duration));
	const gridLeft = 20;
	const gridWidth = 78;

	const rowMap = new Map<number, number>();
	let nextRow = 0;
	const rows = tasks.map((task) => {
		if (task.row !== undefined) {
			if (!rowMap.has(task.row)) {
				rowMap.set(task.row, nextRow++);
			}
			return rowMap.get(task.row) ?? 0;
		}
		return nextRow++;
	});
	const rowCount = nextRow;
	const rowHeight = 80 / Math.max(rowCount, 1);

	const gridLines = Array.from({ length: 6 }, (_, i) => {
		const pct = (i / 5) * 100;
		return `  <div class="gantt-grid-line" style="left: ${pct.toFixed(1)}%;"></div>`;
	}).join("\n");

	const rowLabels = tasks
		.map((task, i) => {
			const y = 10 + (rows[i] ?? 0) * rowHeight + rowHeight / 2;
			return `  <div class="gantt-row-lbl" style="top: ${y.toFixed(1)}%;">${escapeHtml(task.name)}</div>`;
		})
		.join("\n");

	const bars = tasks
		.map((task, i) => {
			const x = gridLeft + (task.start / maxEnd) * gridWidth;
			const w = (task.duration / maxEnd) * gridWidth;
			const y = 10 + (rows[i] ?? 0) * rowHeight + rowHeight / 2;
			const tone: FgraphTone = task.tone ?? "cyan";
			return `  <div class="gantt-bar ${tone}" style="--x:${x.toFixed(1)}; --y:${y.toFixed(1)}; --w:${w.toFixed(1)};"></div>
  <div class="gantt-bar-lbl" style="--x:${x.toFixed(1)}; --y:${y.toFixed(1)};">${escapeHtml(task.name)}</div>`;
		})
		.join("\n");

	const axisHtml = `<div class="gantt-axis"><span>0</span><span>${(maxEnd * 0.25).toFixed(0)}</span><span>${(maxEnd * 0.5).toFixed(0)}</span><span>${(maxEnd * 0.75).toFixed(0)}</span><span>${maxEnd.toFixed(0)} ${timeUnit ? escapeHtml(timeUnit) : ""}</span></div>`;

	const legendHtml = legend ? `\n  <div class="fgraph-legend">${escapeHtml(legend)}</div>` : "";

	return `<div class="fgraph-wrap gantt" role="img" aria-label="${escapeHtml(ariaLabel)}">

  <!-- ── GRID ───────────────────────────────────── -->
  <div class="gantt-grid">
${gridLines}
  </div>

  <!-- ── ROW LABELS ─────────────────────────────── -->
${rowLabels}

  <!-- ── BARS ───────────────────────────────────── -->
${bars}

${axisHtml}${legendHtml}
</div>`;
}

export interface GanttRenderInput {
	title: string;
	subtitle?: string;
	content: GanttContent;
}

export function renderGanttBody({ title, content }: GanttRenderInput): {
	bodyHtml: string;
	topologyCss: string;
} {
	const ariaLabel = `Gantt chart: ${title}. ${content.tasks.map((t) => t.name).join(", ")}.`;
	return {
		bodyHtml: generateBody(content, ariaLabel),
		topologyCss: GANTT_CSS,
	};
}
