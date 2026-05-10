/**
 * System-architecture renderer — full-system diagram with ≥15 components.
 *
 * Nodes grouped into labeled zones, laid out in a grid.
 */

import { escapeHtml } from "../shared.js";
import { ARROW_MARKER_DEFS } from "./_shared.js";
import type { FgraphTone, SystemArchitectureContent } from "./schemas.js";

const SYS_CSS = `
  .fgraph-wrap.sys {
    position: relative;
    width: 100%;
    max-width: 960px;
    aspect-ratio: 16 / 10;
    margin: 24px auto 16px;
    background: var(--bg-panel);
    border: 1px solid rgba(34,211,238,0.35);
    border-radius: 10px;
    padding: 14px;
  }

  .sys-zone-frame {
    position: absolute;
    left: 2%;
    width: 96%;
    border: 1px dashed var(--border-bright);
    border-radius: 8px;
    pointer-events: none;
    opacity: 0.35;
    z-index: 0;
  }
  .sys-zone-lbl {
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

  .fgraph-node.sys-node {
    position: absolute;
    left: calc(var(--x, 50) * 1%);
    top:  calc(var(--y, 50) * 1%);
    width: var(--w, 14%);
    transform: translate(-50%, -50%);
    background: var(--bg-card);
    border: 1.5px solid var(--border-bright);
    border-radius: 12px;
    padding: 6px 8px 7px;
    text-align: center;
    z-index: 2;
  }
  .fgraph-node.sys-node.narrow { --w: 10%; }
  .fgraph-node.sys-node.amber  { border-color: var(--amber);  background: rgba(251,191,36,0.10); }
  .fgraph-node.sys-node.cyan   { border-color: var(--cyan);   background: rgba(34,211,238,0.10); }
  .fgraph-node.sys-node.purple { border-color: var(--purple); background: rgba(167,139,250,0.10); }
  .fgraph-node.sys-node.green  { border-color: var(--green);  background: rgba(52,211,153,0.10); }
  .fgraph-node.sys-node.red    { border-color: var(--red);    background: rgba(251,113,133,0.10); }

  .fgraph-title {
    font-family: 'Outfit', sans-serif;
    font-size: 11px;
    font-weight: 700;
    line-height: 1.2;
  }
  .fgraph-title.amber  { color: var(--amber); }
  .fgraph-title.cyan   { color: var(--cyan); }
  .fgraph-title.purple { color: var(--purple); }
  .fgraph-title.green  { color: var(--green); }
  .fgraph-title.red    { color: var(--red); }

  .fgraph-sub {
    margin-top: 3px;
    font-family: 'Space Mono', monospace;
    font-size: 8.5px;
    line-height: 1.3;
    color: var(--text-dim);
  }`;

function computeZoneY(index: number, count: number): number {
	if (count === 1) return 50;
	const top = 12;
	const bottom = 88;
	return top + (index * (bottom - top)) / (count - 1);
}

function distributeNodesX(count: number): number[] {
	if (count === 1) return [50];
	const gap = 96 / (count + 1);
	return Array.from({ length: count }, (_, i) => 2 + gap * (i + 1));
}

function renderNode(
	node: SystemArchitectureContent["zones"][number]["nodes"][number],
	x: number,
	y: number,
	widthClass: string,
): string {
	const toneClass = node.tone ? ` ${node.tone}` : "";
	const titleTone = node.tone ? ` ${node.tone}` : "";
	const subHtml = node.sub ? `\n    <div class="fgraph-sub">${escapeHtml(node.sub)}</div>` : "";
	return `  <div class="fgraph-node sys-node${toneClass}${widthClass}" style="--x:${x.toFixed(1)}; --y:${y.toFixed(1)};">
    <div class="fgraph-title${titleTone}">${escapeHtml(node.name)}</div>${subHtml}
  </div>`;
}

function renderEdge(
	edge: { from: number; to: number; label?: string; tone?: FgraphTone },
	allNodes: { x: number; y: number }[],
): string {
	const fromPos = allNodes[edge.from];
	const toPos = allNodes[edge.to];
	if (!fromPos || !toPos) return "";
	const midX = (fromPos.x + toPos.x) / 2;
	const midY = (fromPos.y + toPos.y) / 2;
	const tone: FgraphTone = edge.tone ?? "cyan";
	const path = `    <path class="fg-edge ${tone}" d="M ${fromPos.x.toFixed(1)},${fromPos.y.toFixed(1)} L ${toPos.x.toFixed(1)},${toPos.y.toFixed(1)}" marker-end="url(#fg-arr-${tone})"/>`;
	const label = edge.label
		? `  <div class="fgraph-lbl ${tone}" style="--x:${midX.toFixed(1)}; --y:${midY.toFixed(1)};">${escapeHtml(edge.label)}</div>`
		: undefined;
	return label ? `${path}\n${label}` : path;
}

function generateBody(content: SystemArchitectureContent, ariaLabel: string): string {
	const { zones, edges, legend } = content;

	const zoneYs = zones.map((_, i) => computeZoneY(i, zones.length));
	const step = zones.length > 1 ? (zoneYs[1] ?? 0) - (zoneYs[0] ?? 0) : 30;

	const frameHtml = zones
		.map((zone, i) => {
			const y = zoneYs[i] ?? 50;
			const top = (y - step / 2 + 2).toFixed(1);
			const height = (step - 4).toFixed(1);
			const labelTop = (y - step / 2).toFixed(1);
			return `  <div class="sys-zone-frame" style="top: ${top}%; height: ${height}%;"></div>
  <div class="sys-zone-lbl" style="top: ${labelTop}%;">${escapeHtml(zone.label)}</div>`;
		})
		.join("\n");

	const allNodes: { x: number; y: number }[] = [];
	const nodeHtml = zones
		.flatMap((zone, zi) => {
			const y = zoneYs[zi] ?? 50;
			const xs = distributeNodesX(zone.nodes.length);
			const widthClass = zone.nodes.length > 5 ? " narrow" : "";
			return zone.nodes.map((node, i) => {
				const x = xs[i] ?? 50;
				allNodes.push({ x, y });
				return renderNode(node, x, y, widthClass);
			});
		})
		.join("\n");

	const edgePaths =
		edges
			?.map((edge) => renderEdge(edge, allNodes))
			.filter((p) => p.length > 0)
			.join("\n") ?? "";

	const legendHtml = legend ? `\n  <div class="fgraph-legend">${escapeHtml(legend)}</div>` : "";

	return `<div class="fgraph-wrap sys" role="img" aria-label="${escapeHtml(ariaLabel)}">

  <!-- ── ZONE FRAMES + LABELS ───────────────────── -->
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

export interface SystemArchitectureRenderInput {
	title: string;
	subtitle?: string;
	content: SystemArchitectureContent;
}

export function renderSystemArchitectureBody({ title, content }: SystemArchitectureRenderInput): {
	bodyHtml: string;
	topologyCss: string;
} {
	const ariaLabel = `System architecture: ${title}. ${content.zones.map((z) => z.label).join(", ")}.`;
	return {
		bodyHtml: generateBody(content, ariaLabel),
		topologyCss: SYS_CSS,
	};
}
