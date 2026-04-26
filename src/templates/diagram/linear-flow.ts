/**
 * Linear-flow (2–7 stage pipeline) renderer.
 *
 * Layout (matches lumen-diagram/templates/linear-flow.html convention):
 *   - container aspect 16:10 (wide)
 *   - stages distributed evenly across [10%, 90%], all at y=50%
 *   - implicit chain edges (0→1, 1→2, …) unless caller provides edges
 *
 * Common semantic: "data" (purple) for payload flows; "control" (cyan) for
 * routing / invocation. RAG recipe in ai-patterns.md uses .data + .async.
 */

import { escapeHtml } from "../shared.js";
import { ARROW_MARKER_DEFS } from "./_shared.js";
import type {
	FgraphEdge,
	FgraphNode,
	FgraphSemantic,
	FgraphShape,
	FgraphTone,
	LinearFlowContent,
} from "./schemas.js";

const STAGE_PADDING = 10;
const STAGE_HALF_WIDTH = 5; // % — used to inset arrows from card edges
const STAGE_Y = 50;

const LINEAR_FLOW_CSS = `
  .fgraph-wrap {
    position: relative;
    width: 100%;
    max-width: 880px;
    aspect-ratio: 16 / 10;
    margin: 24px auto 16px;
    background: var(--bg-panel);
    border: 1px solid rgba(34,211,238,0.35);
    border-radius: 10px;
    padding: 14px;
  }

  .fgraph-node {
    position: absolute;
    left: calc(var(--x, 50) * 1%);
    top:  calc(var(--y, 50) * 1%);
    width: var(--w, 14%);
    transform: translate(-50%, -50%);
    background: var(--bg-card);
    border: 1.5px solid var(--border-bright);
    border-radius: 12px;
    padding: 10px 8px 11px;
    text-align: center;
    z-index: 2;
  }
  .fgraph-node.amber  { border-color: var(--amber);  background: rgba(251,191,36,0.10); }
  .fgraph-node.cyan   { border-color: var(--cyan);   background: rgba(34,211,238,0.10); }
  .fgraph-node.purple { border-color: var(--purple); background: rgba(167,139,250,0.10); }
  .fgraph-node.green  { border-color: var(--green);  background: rgba(52,211,153,0.10); }
  .fgraph-node.red    { border-color: var(--red);    background: rgba(251,113,133,0.10); }

  /* shape variants */
  .fgraph-node.pill { border-radius: 999px; padding: 12px 14px; }
  .fgraph-node.cylinder {
    border: none;
    border-left: 1.5px solid var(--border-bright);
    border-right: 1.5px solid var(--border-bright);
    border-radius: 0;
    background: var(--bg-card);
    padding: 14px 8px 11px;
  }
  .fgraph-node.cylinder.amber  { border-color: var(--amber);  background: rgba(251,191,36,0.10); }
  .fgraph-node.cylinder.cyan   { border-color: var(--cyan);   background: rgba(34,211,238,0.10); }
  .fgraph-node.cylinder.purple { border-color: var(--purple); background: rgba(167,139,250,0.10); }
  .fgraph-node.cylinder.green  { border-color: var(--green);  background: rgba(52,211,153,0.10); }
  .fgraph-node.hexagon {
    clip-path: polygon(15% 0%, 85% 0%, 100% 50%, 85% 100%, 15% 100%, 0% 50%);
    padding: 12px 14px;
  }

  .fgraph-title {
    font-family: 'Outfit', sans-serif;
    font-size: 12px;
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
    font-size: 9px;
    line-height: 1.3;
    color: var(--text-dim);
  }
  .fgraph-sub.muted { color: var(--text-muted); }`;

const SEMANTIC_TO_TONE: Record<FgraphSemantic, FgraphTone> = {
	data: "purple",
	control: "cyan",
	write: "green",
	feedback: "amber",
	async: "cyan",
};

function computeStageX(index: number, count: number): number {
	if (count === 1) return 50;
	const span = 100 - 2 * STAGE_PADDING;
	const step = span / (count - 1);
	return STAGE_PADDING + index * step;
}

function shapeClass(shape?: FgraphShape): string {
	if (!shape || shape === "rect") return "";
	return ` ${shape}`;
}

function renderStage(stage: FgraphNode, x: number): string {
	const toneClass = stage.tone ? ` ${stage.tone}` : "";
	const titleTone = stage.tone ? ` ${stage.tone}` : "";
	const subHtml = stage.sub ? `\n    <div class="fgraph-sub">${escapeHtml(stage.sub)}</div>` : "";
	const subMutedHtml = stage.subMuted
		? `\n    <div class="fgraph-sub muted">${escapeHtml(stage.subMuted)}</div>`
		: "";
	return `  <div class="fgraph-node${toneClass}${shapeClass(stage.shape)}" style="--x:${x.toFixed(1)}; --y:${STAGE_Y};">
    <div class="fgraph-title${titleTone}">${escapeHtml(stage.name)}</div>${subHtml}${subMutedHtml}
  </div>`;
}

function renderEdge(edge: FgraphEdge, stages: FgraphNode[]): { path: string; label?: string } {
	const fromX = computeStageX(edge.from, stages.length);
	const toX = computeStageX(edge.to, stages.length);
	const semantic = edge.semantic ?? "data";
	const tone = edge.tone ?? SEMANTIC_TO_TONE[semantic];
	const isAsync = semantic === "async";
	const styleClass = `${edge.style ? ` ${edge.style}` : ""}${isAsync ? " dashed" : ""}`;

	// Arrow from right edge of `from` card to left edge of `to` card.
	const x1 = (fromX + STAGE_HALF_WIDTH).toFixed(1);
	const x2 = (toX - STAGE_HALF_WIDTH).toFixed(1);

	const path = `    <path class="fg-edge ${tone}${styleClass}" d="M ${x1},${STAGE_Y} L ${x2},${STAGE_Y}" marker-end="url(#fg-arr-${tone})"/>`;

	const label = edge.label
		? `  <div class="fgraph-lbl ${tone}" style="--x:${((fromX + toX) / 2).toFixed(1)}; --y:${STAGE_Y - 8};">${escapeHtml(edge.label)}</div>`
		: undefined;

	return label ? { path, label } : { path };
}

function generateBody(content: LinearFlowContent, ariaLabel: string): string {
	const { stages, edges, legend } = content;

	const stageHtml = stages
		.map((stage, i) => renderStage(stage, computeStageX(i, stages.length)))
		.join("\n");

	const effectiveEdges: FgraphEdge[] =
		edges && edges.length > 0
			? edges
			: stages.slice(0, -1).map((_, i) => ({
					from: i,
					to: i + 1,
					semantic: "data" as const,
				}));

	const edgeRenderings = effectiveEdges.map((e) => renderEdge(e, stages));
	const edgePaths = edgeRenderings.map((e) => e.path).join("\n");
	const edgeLabels = edgeRenderings
		.filter((e) => e.label !== undefined)
		.map((e) => e.label)
		.join("\n");

	const legendHtml = legend ? `\n  <div class="fgraph-legend">${escapeHtml(legend)}</div>` : "";

	return `<div class="fgraph-wrap" role="img" aria-label="${escapeHtml(ariaLabel)}">

  <!-- ── EDGES ───────────────────────────────────── -->
  <svg class="fgraph-edges" viewBox="0 0 100 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
${ARROW_MARKER_DEFS}
${edgePaths}
  </svg>
${edgeLabels ? `\n  <!-- ── EDGE LABELS ───────────────────────────── -->\n${edgeLabels}` : ""}

  <!-- ── STAGES ─────────────────────────────────── -->
${stageHtml}${legendHtml}
</div>`;
}

export interface LinearFlowRenderInput {
	title: string;
	subtitle?: string;
	content: LinearFlowContent;
}

export function renderLinearFlowBody({ title, content }: LinearFlowRenderInput): {
	bodyHtml: string;
	topologyCss: string;
} {
	const ariaLabel = `Linear flow: ${title}. ${content.stages.map((s) => s.name).join(" → ")}.`;
	return {
		bodyHtml: generateBody(content, ariaLabel),
		topologyCss: LINEAR_FLOW_CSS,
	};
}
