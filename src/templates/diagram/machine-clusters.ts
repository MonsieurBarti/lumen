/**
 * Machine-clusters renderer — cross-host deployment.
 *
 * Nodes grouped by host in vertical columns.
 */

import { escapeHtml } from "../shared.js";
import { ARROW_MARKER_DEFS } from "./_shared.js";
import type { FgraphEdge, FgraphNode, FgraphTone, MachineClustersContent } from "./schemas.js";

const CLUSTER_CSS = `
  .fgraph-wrap.cluster {
    position: relative;
    width: 100%;
    max-width: 860px;
    margin: 24px auto 16px;
    background: var(--bg-panel);
    border: 1px solid rgba(34,211,238,0.35);
    border-radius: 10px;
    padding: 14px;
  }

  .host-frame {
    position: absolute;
    top: 8%;
    bottom: 8%;
    border: 1px dashed var(--border-bright);
    border-radius: 10px;
    pointer-events: none;
    opacity: 0.45;
    z-index: 0;
  }
  .host-lbl {
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

  .fgraph-node.cluster-node {
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
  .fgraph-node.cluster-node.narrow { --w: 14%; }
  .fgraph-node.cluster-node.amber  { border-color: var(--amber);  background: rgba(251,191,36,0.10); }
  .fgraph-node.cluster-node.cyan   { border-color: var(--cyan);   background: rgba(34,211,238,0.10); }
  .fgraph-node.cluster-node.purple { border-color: var(--purple); background: rgba(167,139,250,0.10); }
  .fgraph-node.cluster-node.green  { border-color: var(--green);  background: rgba(52,211,153,0.10); }
  .fgraph-node.cluster-node.red    { border-color: var(--red);    background: rgba(251,113,133,0.10); }

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

function distributeHosts(count: number): { left: number; width: number }[] {
	const gap = 4;
	const totalGap = gap * (count + 1);
	const width = (100 - totalGap) / count;
	return Array.from({ length: count }, (_, i) => ({ left: gap + i * (width + gap), width }));
}

function distributeNodesY(count: number): number[] {
	if (count === 1) return [50];
	const top = 20;
	const bottom = 80;
	return Array.from({ length: count }, (_, i) => top + (i * (bottom - top)) / (count - 1));
}

function renderNode(node: FgraphNode, x: number, y: number, widthClass: string): string {
	const toneClass = node.tone ? ` ${node.tone}` : "";
	const titleTone = node.tone ? ` ${node.tone}` : "";
	const subHtml = node.sub ? `\n    <div class="fgraph-sub">${escapeHtml(node.sub)}</div>` : "";
	const shapeClass = node.shape && node.shape !== "rect" ? ` ${node.shape}` : "";
	return `  <div class="fgraph-node cluster-node${toneClass}${widthClass}${shapeClass}" style="--x:${x.toFixed(1)}; --y:${y.toFixed(1)};">
    <div class="fgraph-title${titleTone}">${escapeHtml(node.name)}</div>${subHtml}
  </div>`;
}

function renderEdge(
	edge: FgraphEdge,
	hosts: { nodes: FgraphNode[] }[],
	hostPositions: { left: number; width: number }[],
): string {
	const fromIdx = edge.from;
	const toIdx = edge.to;
	let fromX = 50;
	let fromY = 50;
	let toX = 50;
	let toY = 50;
	let offset = 0;
	for (let hi = 0; hi < hosts.length; hi++) {
		const host = hosts[hi];
		if (!host) continue;
		const positions = distributeNodesY(host.nodes.length);
		const hostPos = hostPositions[hi] ?? { left: 0, width: 0 };
		const centerX = hostPos.left + hostPos.width / 2;
		if (fromIdx >= offset && fromIdx < offset + host.nodes.length) {
			fromX = centerX;
			fromY = positions[fromIdx - offset] ?? 0;
		}
		if (toIdx >= offset && toIdx < offset + host.nodes.length) {
			toX = centerX;
			toY = positions[toIdx - offset] ?? 0;
		}
		offset += host.nodes.length;
	}
	const tone: FgraphTone = edge.tone ?? "cyan";
	const styleClass = edge.style ? ` ${edge.style}` : "";
	return `    <path class="fg-edge ${tone}${styleClass}" d="M ${fromX.toFixed(1)},${fromY.toFixed(1)} L ${toX.toFixed(1)},${toY.toFixed(1)}" marker-end="url(#fg-arr-${tone})"/>`;
}

function generateBody(content: MachineClustersContent, ariaLabel: string): string {
	const { hosts, edges, legend } = content;
	const hostPositions = distributeHosts(hosts.length);

	const frameHtml = hosts
		.map((host, i) => {
			const pos = hostPositions[i] ?? { left: 0, width: 0 };
			return `  <div class="host-frame" style="left: ${pos.left.toFixed(1)}%; width: ${pos.width.toFixed(1)}%;"></div>
  <div class="host-lbl" style="left: ${(pos.left + pos.width / 2).toFixed(1)}%; transform: translateX(-50%);">${escapeHtml(host.name)}</div>`;
		})
		.join("\n");

	const nodeHtml = hosts
		.flatMap((host, hi) => {
			const pos = hostPositions[hi] ?? { left: 0, width: 0 };
			const centerX = pos.left + pos.width / 2;
			const ys = distributeNodesY(host.nodes.length);
			const widthClass = host.nodes.length > 3 ? " narrow" : "";
			return host.nodes.map((node, i) => renderNode(node, centerX, ys[i] ?? 0, widthClass));
		})
		.join("\n");

	const edgePaths = edges?.map((edge) => renderEdge(edge, hosts, hostPositions)).join("\n") ?? "";

	const legendHtml = legend ? `\n  <div class="fgraph-legend">${escapeHtml(legend)}</div>` : "";

	return `<div class="fgraph-wrap cluster" role="img" aria-label="${escapeHtml(ariaLabel)}">

  <!-- ── HOST FRAMES + LABELS ─────────────────── -->
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

export interface MachineClustersRenderInput {
	title: string;
	subtitle?: string;
	content: MachineClustersContent;
}

export function renderMachineClustersBody({ title, content }: MachineClustersRenderInput): {
	bodyHtml: string;
	topologyCss: string;
} {
	const ariaLabel = `Machine clusters: ${title}. ${content.hosts.map((h) => h.name).join(", ")}.`;
	return {
		bodyHtml: generateBody(content, ariaLabel),
		topologyCss: CLUSTER_CSS,
	};
}
