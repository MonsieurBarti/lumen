/**
 * Dependency-graph renderer — issue / dependency DAG.
 *
 * Nodes arranged in a simple grid with edges showing dependencies.
 */

import { escapeHtml } from "../shared.js";
import { ARROW_MARKER_DEFS } from "./_shared.js";
import type { DepGraphContent, FgraphTone } from "./schemas.js";

const DEP_GRAPH_CSS = `
  .fgraph-wrap.dep {
    position: relative;
    width: 100%;
    max-width: 860px;
    aspect-ratio: 16 / 9;
    margin: 24px auto 16px;
    background: var(--bg-panel);
    border: 1px solid rgba(34,211,238,0.35);
    border-radius: 10px;
    padding: 14px;
  }

  .fgraph-node.dep-node {
    position: absolute;
    left: calc(var(--x, 50) * 1%);
    top:  calc(var(--y, 50) * 1%);
    width: var(--w, 16%);
    transform: translate(-50%, -50%);
    background: var(--bg-card);
    border: 1.5px solid var(--border-bright);
    border-radius: 12px;
    padding: 8px 10px 9px;
    text-align: center;
    z-index: 2;
  }
  .fgraph-node.dep-node.amber  { border-color: var(--amber);  background: rgba(251,191,36,0.10); }
  .fgraph-node.dep-node.cyan   { border-color: var(--cyan);   background: rgba(34,211,238,0.10); }
  .fgraph-node.dep-node.purple { border-color: var(--purple); background: rgba(167,139,250,0.10); }
  .fgraph-node.dep-node.green  { border-color: var(--green);  background: rgba(52,211,153,0.10); }
  .fgraph-node.dep-node.red    { border-color: var(--red);    background: rgba(251,113,133,0.10); }

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

function distributeNodes(count: number): { x: number; y: number }[] {
	const cols = Math.ceil(Math.sqrt(count * 1.6));
	const rows = Math.ceil(count / cols);
	const xGap = 90 / Math.max(cols, 1);
	const yGap = 80 / Math.max(rows, 1);
	return Array.from({ length: count }, (_, i) => {
		const col = i % cols;
		const row = Math.floor(i / cols);
		return { x: 5 + col * xGap + xGap / 2, y: 10 + row * yGap + yGap / 2 };
	});
}

function renderNode(node: DepGraphContent["nodes"][number], x: number, y: number): string {
	const toneClass = node.tone ? ` ${node.tone}` : "";
	const titleTone = node.tone ? ` ${node.tone}` : "";
	const subHtml = node.sub ? `\n    <div class="fgraph-sub">${escapeHtml(node.sub)}</div>` : "";
	return `  <div class="fgraph-node dep-node${toneClass}" style="--x:${x.toFixed(1)}; --y:${y.toFixed(1)};">
    <div class="fgraph-title${titleTone}">${escapeHtml(node.name)}</div>${subHtml}
  </div>`;
}

function renderEdge(
	edge: DepGraphContent["edges"][number],
	positions: { x: number; y: number }[],
): string {
	const fromPos = positions[edge.from] ?? { x: 0, y: 0 };
	const toPos = positions[edge.to] ?? { x: 0, y: 0 };
	const midX = (fromPos.x + toPos.x) / 2;
	const midY = (fromPos.y + toPos.y) / 2;
	const tone: FgraphTone = edge.tone ?? "cyan";
	const path = `    <path class="fg-edge ${tone}" d="M ${fromPos.x.toFixed(1)},${fromPos.y.toFixed(1)} L ${toPos.x.toFixed(1)},${toPos.y.toFixed(1)}" marker-end="url(#fg-arr-${tone})"/>`;
	const label = edge.label
		? `  <div class="fgraph-lbl ${tone}" style="--x:${midX.toFixed(1)}; --y:${midY.toFixed(1)};">${escapeHtml(edge.label)}</div>`
		: undefined;
	return label ? `${path}\n${label}` : path;
}

function generateBody(content: DepGraphContent, ariaLabel: string): string {
	const { nodes, edges, legend } = content;
	const positions = distributeNodes(nodes.length);

	const nodeHtml = nodes
		.map((node, i) => {
			const pos = positions[i] ?? { x: 0, y: 0 };
			return renderNode(node, pos.x, pos.y);
		})
		.join("\n");

	const edgePaths = edges.map((edge) => renderEdge(edge, positions)).join("\n");

	const legendHtml = legend ? `\n  <div class="fgraph-legend">${escapeHtml(legend)}</div>` : "";

	return `<div class="fgraph-wrap dep" role="img" aria-label="${escapeHtml(ariaLabel)}">

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

export interface DepGraphRenderInput {
	title: string;
	subtitle?: string;
	content: DepGraphContent;
}

export function renderDepGraphBody({ title, content }: DepGraphRenderInput): {
	bodyHtml: string;
	topologyCss: string;
} {
	const ariaLabel = `Dependency graph: ${title}. ${content.nodes.map((n) => n.name).join(", ")}.`;
	return {
		bodyHtml: generateBody(content, ariaLabel),
		topologyCss: DEP_GRAPH_CSS,
	};
}
