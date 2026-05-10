/**
 * Dual-cluster renderer — side-by-side cluster comparison.
 *
 * Two vertical clusters with optional cross-cluster edges.
 */

import { escapeHtml } from "../shared.js";
import { ARROW_MARKER_DEFS } from "./_shared.js";
import type { DualClusterContent, FgraphTone } from "./schemas.js";

const DUAL_CSS = `
  .fgraph-wrap.dual {
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

  .cluster-frame {
    position: absolute;
    top: 8%;
    bottom: 8%;
    border: 1px dashed var(--border-bright);
    border-radius: 10px;
    pointer-events: none;
    opacity: 0.45;
    z-index: 0;
  }
  .cluster-lbl {
    position: absolute;
    top: 4%;
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

  .fgraph-node.dual-node {
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
  .fgraph-node.dual-node.amber  { border-color: var(--amber);  background: rgba(251,191,36,0.10); }
  .fgraph-node.dual-node.cyan   { border-color: var(--cyan);   background: rgba(34,211,238,0.10); }
  .fgraph-node.dual-node.purple { border-color: var(--purple); background: rgba(167,139,250,0.10); }
  .fgraph-node.dual-node.green  { border-color: var(--green);  background: rgba(52,211,153,0.10); }
  .fgraph-node.dual-node.red    { border-color: var(--red);    background: rgba(251,113,133,0.10); }

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

function distributeClusterNodes(count: number, centerX: number): { x: number; y: number }[] {
	if (count === 1) return [{ x: centerX, y: 50 }];
	const ys = Array.from({ length: count }, (_, i) => 15 + (i * 70) / Math.max(count - 1, 1));
	return ys.map((y) => ({ x: centerX, y }));
}

function renderNode(
	node: DualClusterContent["clusterA"]["nodes"][number],
	x: number,
	y: number,
): string {
	const toneClass = node.tone ? ` ${node.tone}` : "";
	const titleTone = node.tone ? ` ${node.tone}` : "";
	const subHtml = node.sub ? `\n    <div class="fgraph-sub">${escapeHtml(node.sub)}</div>` : "";
	return `  <div class="fgraph-node dual-node${toneClass}" style="--x:${x.toFixed(1)}; --y:${y.toFixed(1)};">
    <div class="fgraph-title${titleTone}">${escapeHtml(node.name)}</div>${subHtml}
  </div>`;
}

interface DualClusterEdge {
	fromCluster: "A" | "B";
	fromIdx: number;
	toCluster: "A" | "B";
	toIdx: number;
	label?: string;
	tone?: FgraphTone;
}

function renderEdge(
	edge: DualClusterEdge,
	clusterAPos: { x: number; y: number }[],
	clusterBPos: { x: number; y: number }[],
): string {
	const fromPos =
		edge.fromCluster === "A"
			? (clusterAPos[edge.fromIdx] ?? { x: 0, y: 0 })
			: (clusterBPos[edge.fromIdx] ?? { x: 0, y: 0 });
	const toPos =
		edge.toCluster === "A"
			? (clusterAPos[edge.toIdx] ?? { x: 0, y: 0 })
			: (clusterBPos[edge.toIdx] ?? { x: 0, y: 0 });
	const midX = (fromPos.x + toPos.x) / 2;
	const midY = (fromPos.y + toPos.y) / 2;
	const tone: FgraphTone = edge.tone ?? "cyan";
	const path = `    <path class="fg-edge ${tone}" d="M ${fromPos.x.toFixed(1)},${fromPos.y.toFixed(1)} L ${toPos.x.toFixed(1)},${toPos.y.toFixed(1)}" marker-end="url(#fg-arr-${tone})"/>`;
	const label = edge.label
		? `  <div class="fgraph-lbl ${tone}" style="--x:${midX.toFixed(1)}; --y:${midY.toFixed(1)};">${escapeHtml(edge.label)}</div>`
		: undefined;
	return label ? `${path}\n${label}` : path;
}

function generateBody(content: DualClusterContent, ariaLabel: string): string {
	const { clusterA, clusterB, edges, legend } = content;

	const aPositions = distributeClusterNodes(clusterA.nodes.length, 28);
	const bPositions = distributeClusterNodes(clusterB.nodes.length, 72);

	const frameHtml = `  <div class="cluster-frame" style="left: 10%; width: 36%;"></div>
  <div class="cluster-lbl" style="left: 28%; transform: translateX(-50%);">${escapeHtml(clusterA.label)}</div>
  <div class="cluster-frame" style="left: 54%; width: 36%;"></div>
  <div class="cluster-lbl" style="left: 72%; transform: translateX(-50%);">${escapeHtml(clusterB.label)}</div>`;

	const nodeHtml = clusterA.nodes
		.map((node, i) => {
			const pos = aPositions[i] ?? { x: 0, y: 0 };
			return renderNode(node, pos.x, pos.y);
		})
		.concat(
			clusterB.nodes.map((node, i) => {
				const pos = bPositions[i] ?? { x: 0, y: 0 };
				return renderNode(node, pos.x, pos.y);
			}),
		)
		.join("\n");

	const edgePaths = edges?.map((edge) => renderEdge(edge, aPositions, bPositions)).join("\n") ?? "";

	const legendHtml = legend ? `\n  <div class="fgraph-legend">${escapeHtml(legend)}</div>` : "";

	return `<div class="fgraph-wrap dual" role="img" aria-label="${escapeHtml(ariaLabel)}">

  <!-- ── CLUSTER FRAMES + LABELS ──────────────── -->
${frameHtml}

  <!-- ── EDGES ───────────────────────────────────── -->
  <svg class="fgraph-edges" viewBox="0 0 100 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
${ARROW_MARKER_DEFS}
${edgePaths}
  </svg>

  <!-- ── NODES ──────────────────────────────────── -->
${nodeHtml}${legendHtml}
</div>`;
}

export interface DualClusterRenderInput {
	title: string;
	subtitle?: string;
	content: DualClusterContent;
}

export function renderDualClusterBody({ title, content }: DualClusterRenderInput): {
	bodyHtml: string;
	topologyCss: string;
} {
	const ariaLabel = `Dual cluster: ${title}. ${content.clusterA.label} vs ${content.clusterB.label}.`;
	return {
		bodyHtml: generateBody(content, ariaLabel),
		topologyCss: DUAL_CSS,
	};
}
