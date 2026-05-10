/**
 * Radial-ring renderer — peer cluster, no center.
 *
 * Nodes are evenly distributed around a circle. Edges are drawn as
 * straight SVG lines between node positions.
 */

import { escapeHtml } from "../shared.js";
import { ARROW_MARKER_DEFS } from "./_shared.js";
import type { FgraphEdge, FgraphNode, FgraphTone, RadialRingContent } from "./schemas.js";

const RING_CSS = `
  .fgraph-wrap.ring {
    position: relative;
    width: 100%;
    max-width: 700px;
    aspect-ratio: 1 / 1;
    margin: 24px auto 16px;
    background: var(--bg-panel);
    border: 1px solid rgba(34,211,238,0.35);
    border-radius: 10px;
    padding: 14px;
  }

  .fgraph-node.ring-node {
    position: absolute;
    left: calc(var(--x, 50) * 1%);
    top:  calc(var(--y, 50) * 1%);
    width: var(--w, 22%);
    transform: translate(-50%, -50%);
    background: var(--bg-card);
    border: 1.5px solid var(--border-bright);
    border-radius: 12px;
    padding: 8px 10px 9px;
    text-align: center;
    z-index: 2;
  }
  .fgraph-node.ring-node.pill   { border-radius: 999px; padding: 10px 14px; }
  .fgraph-node.ring-node.amber  { border-color: var(--amber);  background: rgba(251,191,36,0.10); }
  .fgraph-node.ring-node.cyan   { border-color: var(--cyan);   background: rgba(34,211,238,0.10); }
  .fgraph-node.ring-node.purple { border-color: var(--purple); background: rgba(167,139,250,0.10); }
  .fgraph-node.ring-node.green  { border-color: var(--green);  background: rgba(52,211,153,0.10); }
  .fgraph-node.ring-node.red    { border-color: var(--red);    background: rgba(251,113,133,0.10); }

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

function computeRingPosition(index: number, count: number): { x: number; y: number } {
	const angle = (2 * Math.PI * index) / count - Math.PI / 2;
	const x = 50 + 38 * Math.cos(angle);
	const y = 50 + 38 * Math.sin(angle);
	return { x, y };
}

function renderNode(node: FgraphNode, x: number, y: number): string {
	const toneClass = node.tone ? ` ${node.tone}` : "";
	const titleTone = node.tone ? ` ${node.tone}` : "";
	const subHtml = node.sub ? `\n    <div class="fgraph-sub">${escapeHtml(node.sub)}</div>` : "";
	const shapeClass = node.shape && node.shape !== "rect" ? ` ${node.shape}` : "";
	return `  <div class="fgraph-node ring-node${toneClass}${shapeClass}" style="--x:${x.toFixed(1)}; --y:${y.toFixed(1)};">
    <div class="fgraph-title${titleTone}">${escapeHtml(node.name)}</div>${subHtml}
  </div>`;
}

function renderEdge(edge: FgraphEdge, nodes: FgraphNode[]): string {
	const fromPos = computeRingPosition(edge.from, nodes.length);
	const toPos = computeRingPosition(edge.to, nodes.length);
	const tone: FgraphTone = edge.tone ?? "cyan";
	const styleClass = edge.style ? ` ${edge.style}` : "";
	return `    <line class="fg-edge ${tone}${styleClass}" x1="${fromPos.x.toFixed(1)}" y1="${fromPos.y.toFixed(1)}" x2="${toPos.x.toFixed(1)}" y2="${toPos.y.toFixed(1)}" marker-end="url(#fg-arr-${tone})"/>`;
}

function generateBody(content: RadialRingContent, ariaLabel: string): string {
	const { nodes, edges, legend } = content;

	const nodeHtml = nodes
		.map((node, i) => {
			const { x, y } = computeRingPosition(i, nodes.length);
			return renderNode(node, x, y);
		})
		.join("\n");

	const edgePaths = edges?.map((edge) => renderEdge(edge, nodes)).join("\n") ?? "";

	const legendHtml = legend ? `\n  <div class="fgraph-legend">${escapeHtml(legend)}</div>` : "";

	return `<div class="fgraph-wrap ring" role="img" aria-label="${escapeHtml(ariaLabel)}">

  <!-- ── NODES ──────────────────────────────────── -->
${nodeHtml}

  <!-- ── EDGES ───────────────────────────────────── -->
  <svg class="fgraph-edges" viewBox="0 0 100 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
${ARROW_MARKER_DEFS}
${edgePaths}
  </svg>
${legendHtml}
</div>`;
}

export interface RadialRingRenderInput {
	title: string;
	subtitle?: string;
	content: RadialRingContent;
}

export function renderRadialRingBody({ title, content }: RadialRingRenderInput): {
	bodyHtml: string;
	topologyCss: string;
} {
	const ariaLabel = `Radial ring: ${title}. ${content.nodes.map((n) => n.name).join(", ")}.`;
	return {
		bodyHtml: generateBody(content, ariaLabel),
		topologyCss: RING_CSS,
	};
}
