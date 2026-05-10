/**
 * Lane-swim renderer — lanes × rows pipeline.
 *
 * Horizontal swimlanes with nodes distributed evenly inside each lane.
 */

import { escapeHtml } from "../shared.js";
import { ARROW_MARKER_DEFS } from "./_shared.js";
import type { FgraphEdge, FgraphNode, FgraphTone, LaneSwimContent } from "./schemas.js";

const LANE_CSS = `
  .fgraph-wrap.lane {
    position: relative;
    width: 100%;
    max-width: 860px;
    margin: 24px auto 16px;
    background: var(--bg-panel);
    border: 1px solid rgba(34,211,238,0.35);
    border-radius: 10px;
    padding: 14px;
  }

  .lane-frame {
    position: absolute;
    left: 2%;
    width: 96%;
    border: 1px dashed var(--border-bright);
    border-radius: 8px;
    pointer-events: none;
    opacity: 0.45;
    z-index: 0;
  }
  .lane-lbl {
    position: absolute;
    left: 4%;
    font-family: 'Space Mono', monospace;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-muted);
    background: var(--bg-panel);
    padding: 0 6px;
    z-index: 1;
  }

  .fgraph-node.lane-node {
    position: absolute;
    left: calc(var(--x, 50) * 1%);
    top:  calc(var(--y, 50) * 1%);
    width: var(--w, 18%);
    transform: translate(-50%, -50%);
    background: var(--bg-card);
    border: 1.5px solid var(--border-bright);
    border-radius: 12px;
    padding: 8px 10px 9px;
    text-align: center;
    z-index: 2;
  }
  .fgraph-node.lane-node.narrow { --w: 14%; }
  .fgraph-node.lane-node.amber  { border-color: var(--amber);  background: rgba(251,191,36,0.10); }
  .fgraph-node.lane-node.cyan   { border-color: var(--cyan);   background: rgba(34,211,238,0.10); }
  .fgraph-node.lane-node.purple { border-color: var(--purple); background: rgba(167,139,250,0.10); }
  .fgraph-node.lane-node.green  { border-color: var(--green);  background: rgba(52,211,153,0.10); }
  .fgraph-node.lane-node.red    { border-color: var(--red);    background: rgba(251,113,133,0.10); }

  .fgraph-title {
    font-family: 'Outfit', sans-serif;
    font-size: 12.5px;
    font-weight: 700;
    line-height: 1.2;
  }
  .fgraph-title.amber  { color: var(--amber); }
  .fgraph-title.cyan   { color: var(--cyan); }
  .fgraph-title.purple { color: var(--purple); }
  .fgraph-title.green  { color: var(--green); }
  .fgraph-title.red    { color: var(--red); }

  .fgraph-sub {
    margin-top: 4px;
    font-family: 'Space Mono', monospace;
    font-size: 9.5px;
    line-height: 1.35;
    color: var(--text-dim);
  }`;

function computeLaneY(index: number, count: number): number {
	if (count === 1) return 50;
	const top = 18;
	const bottom = 82;
	return top + (index * (bottom - top)) / (count - 1);
}

function distributeNodesX(count: number): number[] {
	if (count === 1) return [50];
	const step = 88 / (count + 1);
	return Array.from({ length: count }, (_, i) => 6 + step * (i + 1));
}

function renderNode(node: FgraphNode, x: number, y: number, widthClass: string): string {
	const toneClass = node.tone ? ` ${node.tone}` : "";
	const titleTone = node.tone ? ` ${node.tone}` : "";
	const subHtml = node.sub ? `\n    <div class="fgraph-sub">${escapeHtml(node.sub)}</div>` : "";
	const shapeClass = node.shape && node.shape !== "rect" ? ` ${node.shape}` : "";
	return `  <div class="fgraph-node lane-node${toneClass}${widthClass}${shapeClass}" style="--x:${x.toFixed(1)}; --y:${y.toFixed(1)};">
    <div class="fgraph-title${titleTone}">${escapeHtml(node.name)}</div>${subHtml}
  </div>`;
}

function renderEdge(
	edge: FgraphEdge,
	_lanes: { nodes: FgraphNode[] }[],
): { path: string; label?: string } {
	const fromIdx = edge.from;
	const toIdx = edge.to;
	let fromX = 50;
	let fromY = 50;
	let toX = 50;
	let toY = 50;
	let offset = 0;
	for (let li = 0; li < _lanes.length; li++) {
		const lane = _lanes[li];
		if (!lane) continue;
		const positions = distributeNodesX(lane.nodes.length);
		const laneY = computeLaneY(li, _lanes.length);
		if (fromIdx >= offset && fromIdx < offset + lane.nodes.length) {
			fromX = positions[fromIdx - offset] ?? 0;
			fromY = laneY;
		}
		if (toIdx >= offset && toIdx < offset + lane.nodes.length) {
			toX = positions[toIdx - offset] ?? 0;
			toY = laneY;
		}
		offset += lane.nodes.length;
	}
	const tone: FgraphTone = edge.tone ?? "cyan";
	const styleClass = edge.style ? ` ${edge.style}` : "";
	const path = `    <path class="fg-edge ${tone}${styleClass}" d="M ${fromX.toFixed(1)},${fromY.toFixed(1)} L ${toX.toFixed(1)},${toY.toFixed(1)}" marker-end="url(#fg-arr-${tone})"/>`;
	const label = edge.label
		? `  <div class="fgraph-lbl ${tone}" style="--x:${((fromX + toX) / 2).toFixed(1)}; --y:${((fromY + toY) / 2).toFixed(1)};">${escapeHtml(edge.label)}</div>`
		: undefined;
	return label ? { path, label } : { path };
}

function generateBody(content: LaneSwimContent, ariaLabel: string): string {
	const { lanes, edges, legend } = content;

	const step = computeLaneY(1, lanes.length) - computeLaneY(0, lanes.length);

	const frameHtml = lanes
		.map((lane, i) => {
			const y = computeLaneY(i, lanes.length);
			const top = (y - step / 2 + 2).toFixed(1);
			const height = (step - 4).toFixed(1);
			const labelTop = (y - step / 2).toFixed(1);
			return `  <div class="lane-frame" style="top: ${top}%; height: ${height}%;"></div>
  <div class="lane-lbl" style="top: ${labelTop}%;">${escapeHtml(lane.label)}</div>`;
		})
		.join("\n");

	const nodeHtml = lanes
		.flatMap((lane, li) => {
			const y = computeLaneY(li, lanes.length);
			const positions = distributeNodesX(lane.nodes.length);
			const widthClass = lane.nodes.length > 3 ? " narrow" : "";
			return lane.nodes.map((node, i) => renderNode(node, positions[i] ?? 0, y, widthClass));
		})
		.join("\n");

	const edgeRenderings = edges?.map((edge) => renderEdge(edge, lanes)) ?? [];
	const edgePaths = edgeRenderings.map((e) => e.path).join("\n");
	const edgeLabels = edgeRenderings
		.filter((e) => e.label !== undefined)
		.map((e) => e.label)
		.join("\n");

	const legendHtml = legend ? `\n  <div class="fgraph-legend">${escapeHtml(legend)}</div>` : "";

	return `<div class="fgraph-wrap lane" role="img" aria-label="${escapeHtml(ariaLabel)}">

  <!-- ── LANE FRAMES + LABELS ─────────────────── -->
${frameHtml}

  <!-- ── EDGES ───────────────────────────────────── -->
  <svg class="fgraph-edges" viewBox="0 0 100 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
${ARROW_MARKER_DEFS}
${edgePaths}
  </svg>
${edgeLabels ? `\n  <!-- ── EDGE LABELS ───────────────────────────── -->\n${edgeLabels}` : ""}

  <!-- ── NODES ──────────────────────────────────── -->
${nodeHtml}${legendHtml}
</div>`;
}

export interface LaneSwimRenderInput {
	title: string;
	subtitle?: string;
	content: LaneSwimContent;
}

export function renderLaneSwimBody({ title, content }: LaneSwimRenderInput): {
	bodyHtml: string;
	topologyCss: string;
} {
	const ariaLabel = `Lane swim diagram: ${title}. ${content.lanes.map((l) => l.label).join(", ")}.`;
	return {
		bodyHtml: generateBody(content, ariaLabel),
		topologyCss: LANE_CSS,
	};
}
