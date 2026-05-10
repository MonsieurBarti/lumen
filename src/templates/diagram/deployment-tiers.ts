/**
 * Deployment-tiers renderer — multi-tier deployment.
 *
 * Similar to layered but with replica badges on nodes.
 */

import { escapeHtml } from "../shared.js";
import { ARROW_MARKER_DEFS } from "./_shared.js";
import type { DeploymentTiersContent, FgraphSemantic, FgraphTone, LayeredEdge } from "./schemas.js";

const TIER_TOP = 15;
const TIER_BOTTOM = 82;

const DEPLOYMENT_CSS = `
  .fgraph-wrap {
    position: relative;
    width: 100%;
    max-width: 760px;
    aspect-ratio: 4 / 5;
    margin: 24px auto 16px;
    background: var(--bg-panel);
    border: 1px solid rgba(34,211,238,0.35);
    border-radius: 10px;
    padding: 14px;
  }

  .tier-frame {
    position: absolute;
    left: 6%;
    width: 88%;
    border: 1px dashed var(--border-bright);
    border-radius: 10px;
    pointer-events: none;
    opacity: 0.55;
    z-index: 0;
  }
  .tier-lbl {
    position: absolute;
    left: 8%;
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

  .fgraph-node {
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
  .fgraph-node.wide   { --w: 40%; }
  .fgraph-node.narrow { --w: 18%; }
  .fgraph-node.pill   { border-radius: 999px; padding: 10px 14px; }
  .fgraph-node.amber  { border-color: var(--amber);  background: rgba(251,191,36,0.10); }
  .fgraph-node.cyan   { border-color: var(--cyan);   background: rgba(34,211,238,0.10); }
  .fgraph-node.purple { border-color: var(--purple); background: rgba(167,139,250,0.10); }
  .fgraph-node.green  { border-color: var(--green);  background: rgba(52,211,153,0.10); }
  .fgraph-node.red    { border-color: var(--red);    background: rgba(251,113,133,0.10); }

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
  }
  .fgraph-sub.muted { color: var(--text-muted); }

  .replica-badge {
    position: absolute;
    top: -6px;
    right: -6px;
    background: var(--bg-card);
    border: 1px solid var(--border-bright);
    border-radius: 999px;
    font-family: 'Space Mono', monospace;
    font-size: 8px;
    font-weight: 700;
    padding: 1px 5px;
    color: var(--text-muted);
    z-index: 3;
  }`;

const SEMANTIC_TO_TONE: Record<FgraphSemantic, FgraphTone> = {
	data: "purple",
	control: "cyan",
	write: "green",
	feedback: "amber",
	async: "cyan",
};

function computeTierY(index: number, count: number): number {
	if (count === 1) return 50;
	const step = (TIER_BOTTOM - TIER_TOP) / (count - 1);
	return TIER_TOP + index * step;
}

function computeTierStep(count: number): number {
	if (count === 1) return 30;
	return (TIER_BOTTOM - TIER_TOP) / (count - 1);
}

interface NodeXW {
	x: number;
	widthClass: string;
}

function distributeNodes(count: number): NodeXW[] {
	if (count === 1) return [{ x: 50, widthClass: " wide" }];
	if (count === 2)
		return [
			{ x: 28, widthClass: "" },
			{ x: 72, widthClass: "" },
		];
	if (count === 3)
		return [
			{ x: 20, widthClass: "" },
			{ x: 50, widthClass: "" },
			{ x: 80, widthClass: "" },
		];
	return [
		{ x: 15, widthClass: " narrow" },
		{ x: 38, widthClass: " narrow" },
		{ x: 62, widthClass: " narrow" },
		{ x: 85, widthClass: " narrow" },
	];
}

function renderNode(
	node: { name: string; tone?: FgraphTone; shape?: string; sub?: string; subMuted?: string },
	x: number,
	y: number,
	widthClass: string,
	replicas?: number,
): string {
	const toneClass = node.tone ? ` ${node.tone}` : "";
	const titleTone = node.tone ? ` ${node.tone}` : "";
	const subHtml = node.sub ? `\n    <div class="fgraph-sub">${escapeHtml(node.sub)}</div>` : "";
	const subMutedHtml = node.subMuted
		? `\n    <div class="fgraph-sub muted">${escapeHtml(node.subMuted)}</div>`
		: "";
	const shapeClass = node.shape && node.shape !== "rect" ? ` ${node.shape}` : "";
	const badge =
		replicas !== undefined && replicas > 1 ? `<span class="replica-badge">×${replicas}</span>` : "";
	return `  <div class="fgraph-node${toneClass}${widthClass}${shapeClass}" style="--x:${x}; --y:${y};">
    ${badge}<div class="fgraph-title${titleTone}">${escapeHtml(node.name)}</div>${subHtml}${subMutedHtml}
  </div>`;
}

function generateBody(content: DeploymentTiersContent, ariaLabel: string): string {
	const { tiers, edges, legend } = content;
	const tierYs = tiers.map((_, i) => computeTierY(i, tiers.length));
	const step = computeTierStep(tiers.length);

	const frameHtml = tiers
		.map((tier, i) => {
			const y = tierYs[i] ?? 50;
			const frameTop = (y - step / 2 + 2).toFixed(1);
			const frameHeight = (step - 4).toFixed(1);
			const labelTop = (y - step / 2).toFixed(1);
			return `  <div class="tier-frame" style="top: ${frameTop}%; height: ${frameHeight}%;"></div>
  <div class="tier-lbl" style="top: ${labelTop}%;">${escapeHtml(tier.label)}</div>`;
		})
		.join("\n");

	const effectiveEdges: LayeredEdge[] =
		edges && edges.length > 0
			? edges
			: tiers
					.slice(0, -1)
					.map((_, i): LayeredEdge => ({ fromLayer: i, toLayer: i + 1, semantic: "control" }));

	const edgePaths = effectiveEdges
		.map((edge) => {
			const fromY = tierYs[edge.fromLayer] ?? 50;
			const toY = tierYs[edge.toLayer] ?? 50;
			const semantic = edge.semantic ?? "control";
			const tone = SEMANTIC_TO_TONE[semantic];
			const styleClass = `${edge.style ? ` ${edge.style}` : ""}${semantic === "async" ? " dashed" : ""}`;
			const startY = (fromY + 7).toFixed(1);
			const endY = (toY - 7).toFixed(1);
			return `    <path class="fg-edge ${tone}${styleClass}" d="M 50,${startY} L 50,${endY}" marker-end="url(#fg-arr-${tone})"/>`;
		})
		.join("\n");

	const nodeHtml = tiers
		.flatMap((tier, tierIdx) => {
			const y = tierYs[tierIdx] ?? 50;
			const positions = distributeNodes(tier.nodes.length);
			return tier.nodes.map((node, i) => {
				const pos = positions[i];
				if (!pos) return "";
				return renderNode(node, pos.x, y, pos.widthClass, tier.replicas);
			});
		})
		.filter((html) => html.length > 0)
		.join("\n");

	const legendHtml = legend ? `\n  <div class="fgraph-legend">${escapeHtml(legend)}</div>` : "";

	return `<div class="fgraph-wrap" role="img" aria-label="${escapeHtml(ariaLabel)}">

  <!-- ── TIER FRAMES + LABELS ─────────────────── -->
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

export interface DeploymentTiersRenderInput {
	title: string;
	subtitle?: string;
	content: DeploymentTiersContent;
}

export function renderDeploymentTiersBody({ title, content }: DeploymentTiersRenderInput): {
	bodyHtml: string;
	topologyCss: string;
} {
	const ariaLabel = `Deployment tiers: ${title}. ${content.tiers.map((t) => t.label).join(", ")}.`;
	return {
		bodyHtml: generateBody(content, ariaLabel),
		topologyCss: DEPLOYMENT_CSS,
	};
}
