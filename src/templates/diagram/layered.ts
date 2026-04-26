/**
 * Layered (3–4 tier stack) renderer.
 *
 * Layout (matches lumen-diagram/templates/layered.html convention):
 *   - container aspect 4:5 (tall)
 *   - layers evenly distributed between y=15 and y=82
 *   - dashed frame around each layer + uppercase label on the left
 *   - nodes within a layer evenly distributed across [10%, 90%]
 *   - edges connect adjacent layers center-to-center (fan-out/fan-in is
 *     v0.2.x territory)
 */

import { escapeHtml } from "../shared.js";
import { ARROW_MARKER_DEFS } from "./_shared.js";
import type {
	FgraphNode,
	FgraphSemantic,
	FgraphShape,
	FgraphTone,
	LayeredContent,
	LayeredEdge,
} from "./schemas.js";

const LAYER_TOP = 15;
const LAYER_BOTTOM = 82;

const LAYERED_CSS = `
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

  .layer-frame {
    position: absolute;
    left: 6%;
    width: 88%;
    border: 1px dashed var(--border-bright);
    border-radius: 10px;
    pointer-events: none;
    opacity: 0.55;
    z-index: 0;
  }
  .layer-lbl {
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
  .fgraph-sub.muted { color: var(--text-muted); }`;

function computeLayerY(index: number, count: number): number {
	if (count === 1) return 50;
	const step = (LAYER_BOTTOM - LAYER_TOP) / (count - 1);
	return LAYER_TOP + index * step;
}

function computeLayerStep(count: number): number {
	if (count === 1) return 30;
	return (LAYER_BOTTOM - LAYER_TOP) / (count - 1);
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
	// count === 4 (parser caps at 4)
	return [
		{ x: 15, widthClass: " narrow" },
		{ x: 38, widthClass: " narrow" },
		{ x: 62, widthClass: " narrow" },
		{ x: 85, widthClass: " narrow" },
	];
}

const SEMANTIC_TO_TONE: Record<FgraphSemantic, FgraphTone> = {
	data: "purple",
	control: "cyan",
	write: "green",
	feedback: "amber",
	async: "cyan",
};

function shapeClass(shape?: FgraphShape): string {
	if (!shape || shape === "rect") return "";
	return ` ${shape}`;
}

function renderNode(node: FgraphNode, x: number, y: number, widthClass: string): string {
	const toneClass = node.tone ? ` ${node.tone}` : "";
	const titleTone = node.tone ? ` ${node.tone}` : "";
	const subHtml = node.sub ? `\n    <div class="fgraph-sub">${escapeHtml(node.sub)}</div>` : "";
	const subMutedHtml = node.subMuted
		? `\n    <div class="fgraph-sub muted">${escapeHtml(node.subMuted)}</div>`
		: "";
	return `  <div class="fgraph-node${toneClass}${widthClass}${shapeClass(node.shape)}" style="--x:${x}; --y:${y};">
    <div class="fgraph-title${titleTone}">${escapeHtml(node.name)}</div>${subHtml}${subMutedHtml}
  </div>`;
}

function renderEdge(edge: LayeredEdge, layerYs: number[]): { path: string; label?: string } {
	const fromY = layerYs[edge.fromLayer] ?? 50;
	const toY = layerYs[edge.toLayer] ?? 50;
	const semantic = edge.semantic ?? "control";
	const tone = SEMANTIC_TO_TONE[semantic];
	const isAsync = semantic === "async";
	const styleClass = `${edge.style ? ` ${edge.style}` : ""}${isAsync ? " dashed" : ""}`;

	// Edge from bottom of fromLayer to top of toLayer with small inset.
	const startY = (fromY + 7).toFixed(1);
	const endY = (toY - 7).toFixed(1);

	const path = `    <path class="fg-edge ${tone}${styleClass}" d="M 50,${startY} L 50,${endY}" marker-end="url(#fg-arr-${tone})"/>`;

	const label = edge.label
		? `  <div class="fgraph-lbl ${tone}" style="--x:60; --y:${((fromY + toY) / 2).toFixed(1)};">${escapeHtml(edge.label)}</div>`
		: undefined;

	return label ? { path, label } : { path };
}

function generateBody(content: LayeredContent, ariaLabel: string): string {
	const { layers, edges, legend } = content;
	const layerYs = layers.map((_, i) => computeLayerY(i, layers.length));
	const step = computeLayerStep(layers.length);

	// Frame + label per layer.
	const frameHtml = layers
		.map((layer, i) => {
			const y = layerYs[i] ?? 50;
			const frameTop = (y - step / 2 + 2).toFixed(1);
			const frameHeight = (step - 4).toFixed(1);
			const labelTop = (y - step / 2).toFixed(1);
			return `  <div class="layer-frame" style="top: ${frameTop}%; height: ${frameHeight}%;"></div>
  <div class="layer-lbl"   style="top: ${labelTop}%;">${escapeHtml(layer.label)}</div>`;
		})
		.join("\n");

	// Implicit edges (consecutive layers) if caller didn't specify any.
	const effectiveEdges: LayeredEdge[] =
		edges && edges.length > 0
			? edges
			: layers.slice(0, -1).map((_, i) => ({
					fromLayer: i,
					toLayer: i + 1,
					semantic: "control" as const,
				}));

	const edgeRenderings = effectiveEdges.map((edge) => renderEdge(edge, layerYs));
	const edgePaths = edgeRenderings.map((e) => e.path).join("\n");
	const edgeLabels = edgeRenderings
		.filter((e) => e.label !== undefined)
		.map((e) => e.label)
		.join("\n");

	// Nodes per layer.
	const nodeHtml = layers
		.flatMap((layer, layerIdx) => {
			const y = layerYs[layerIdx] ?? 50;
			const positions = distributeNodes(layer.nodes.length);
			return layer.nodes.map((node, i) => {
				const pos = positions[i];
				if (!pos) return "";
				return renderNode(node, pos.x, y, pos.widthClass);
			});
		})
		.filter((html) => html.length > 0)
		.join("\n");

	const legendHtml = legend ? `\n  <div class="fgraph-legend">${escapeHtml(legend)}</div>` : "";

	return `<div class="fgraph-wrap" role="img" aria-label="${escapeHtml(ariaLabel)}">

  <!-- ── LAYER FRAMES + LABELS ──────────────────── -->
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

export interface LayeredRenderInput {
	title: string;
	subtitle?: string;
	content: LayeredContent;
}

export function renderLayeredBody({ title, content }: LayeredRenderInput): {
	bodyHtml: string;
	topologyCss: string;
} {
	const ariaLabel = `Layered diagram: ${title}. ${content.layers.length} tiers — ${content.layers
		.map((l) => l.label)
		.join(", ")}.`;
	return {
		bodyHtml: generateBody(content, ariaLabel),
		topologyCss: LAYERED_CSS,
	};
}
