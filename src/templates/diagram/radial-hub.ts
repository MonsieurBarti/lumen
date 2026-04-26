/**
 * Radial-hub renderer (hub + spokes at 8 compass positions).
 *
 * Layout (matches lumen-diagram/templates/radial-hub.html convention):
 *   - container square (1:1)
 *   - hub at (50, 50), default pill shape
 *   - 8 fixed compass slots — caller picks any subset, no duplicates
 *   - edges hub ↔ spoke; angle-based endpoint computation insets the
 *     arrows from card edges so arrowheads stay visible
 *
 * Default semantic: "control" (cyan/accent — invocation pattern).
 * Default direction: "both" (typical agent ↔ tool call/return).
 */

import { escapeHtml } from "../shared.js";
import { ARROW_MARKER_DEFS } from "./_shared.js";
import type {
	FgraphNode,
	FgraphSemantic,
	FgraphShape,
	FgraphTone,
	RadialHubContent,
	RadialPosition,
	RadialSpoke,
} from "./schemas.js";

const HUB_X = 50;
const HUB_Y = 50;
const HUB_HALF = 10;
const SPOKE_HALF = 9;

const POSITION_COORDS: Record<RadialPosition, { x: number; y: number }> = {
	top: { x: 50, y: 15 },
	"top-right": { x: 82, y: 22 },
	right: { x: 88, y: 50 },
	"bottom-right": { x: 82, y: 78 },
	bottom: { x: 50, y: 85 },
	"bottom-left": { x: 18, y: 78 },
	left: { x: 12, y: 50 },
	"top-left": { x: 18, y: 22 },
};

const RADIAL_HUB_CSS = `
  .fgraph-wrap {
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

  .fgraph-node {
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
  .fgraph-node.hub  { --w: 22%; }
  .fgraph-node.pill { border-radius: 999px; padding: 10px 14px; }
  .fgraph-node.amber  { border-color: var(--amber);  background: rgba(251,191,36,0.10); }
  .fgraph-node.cyan   { border-color: var(--cyan);   background: rgba(34,211,238,0.10); }
  .fgraph-node.purple { border-color: var(--purple); background: rgba(167,139,250,0.10); }
  .fgraph-node.green  { border-color: var(--green);  background: rgba(52,211,153,0.10); }
  .fgraph-node.red    { border-color: var(--red);    background: rgba(251,113,133,0.10); }

  /* shape variants reused from linear-flow CSS */
  .fgraph-node.cylinder {
    border: none;
    border-left: 1.5px solid var(--border-bright);
    border-right: 1.5px solid var(--border-bright);
    border-radius: 0;
    background: var(--bg-card);
    padding: 14px 10px;
  }
  .fgraph-node.cylinder.amber  { border-color: var(--amber);  background: rgba(251,191,36,0.10); }
  .fgraph-node.cylinder.cyan   { border-color: var(--cyan);   background: rgba(34,211,238,0.10); }
  .fgraph-node.cylinder.purple { border-color: var(--purple); background: rgba(167,139,250,0.10); }
  .fgraph-node.cylinder.green  { border-color: var(--green);  background: rgba(52,211,153,0.10); }
  .fgraph-node.hexagon {
    clip-path: polygon(15% 0%, 85% 0%, 100% 50%, 85% 100%, 15% 100%, 0% 50%);
    padding: 10px 16px;
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

function shapeClass(shape?: FgraphShape, isHub = false): string {
	const baseShape = shape && shape !== "rect" ? ` ${shape}` : "";
	// Default hub shape is pill if caller didn't specify another shape.
	if (isHub && !shape) return " pill";
	return baseShape;
}

function renderHub(node: FgraphNode): string {
	const toneClass = node.tone ? ` ${node.tone}` : "";
	const titleTone = node.tone ? ` ${node.tone}` : "";
	const sub = node.sub ? `\n    <div class="fgraph-sub">${escapeHtml(node.sub)}</div>` : "";
	const subMuted = node.subMuted
		? `\n    <div class="fgraph-sub muted">${escapeHtml(node.subMuted)}</div>`
		: "";
	return `  <div class="fgraph-node hub${toneClass}${shapeClass(node.shape, true)}" style="--x:${HUB_X}; --y:${HUB_Y};">
    <div class="fgraph-title${titleTone}">${escapeHtml(node.name)}</div>${sub}${subMuted}
  </div>`;
}

function renderSpoke(spoke: RadialSpoke): string {
	const { x, y } = POSITION_COORDS[spoke.position];
	const toneClass = spoke.tone ? ` ${spoke.tone}` : "";
	const titleTone = spoke.tone ? ` ${spoke.tone}` : "";
	const sub = spoke.sub ? `\n    <div class="fgraph-sub">${escapeHtml(spoke.sub)}</div>` : "";
	const subMuted = spoke.subMuted
		? `\n    <div class="fgraph-sub muted">${escapeHtml(spoke.subMuted)}</div>`
		: "";
	return `  <div class="fgraph-node${toneClass}${shapeClass(spoke.shape)}" style="--x:${x}; --y:${y};">
    <div class="fgraph-title${titleTone}">${escapeHtml(spoke.name)}</div>${sub}${subMuted}
  </div>`;
}

interface EdgeEndpoints {
	x1: string;
	y1: string;
	x2: string;
	y2: string;
}

/** Angle-based endpoint computation — see fgraph-base.css comments. */
function computeEdgeEndpoints(spoke: RadialSpoke): EdgeEndpoints {
	const { x: sx, y: sy } = POSITION_COORDS[spoke.position];
	const dx = sx - HUB_X;
	const dy = sy - HUB_Y;
	const angle = Math.atan2(dy, dx);
	const cos = Math.cos(angle);
	const sin = Math.sin(angle);
	return {
		x1: (HUB_X + cos * HUB_HALF).toFixed(2),
		y1: (HUB_Y + sin * HUB_HALF).toFixed(2),
		x2: (sx - cos * SPOKE_HALF).toFixed(2),
		y2: (sy - sin * SPOKE_HALF).toFixed(2),
	};
}

function renderEdge(spoke: RadialSpoke): string {
	const semantic = spoke.semantic ?? "control";
	const tone = SEMANTIC_TO_TONE[semantic];
	const isAsync = semantic === "async";
	const direction = spoke.direction ?? "both";
	const styleClass = `${spoke.style ? ` ${spoke.style}` : ""}${isAsync ? " dashed" : ""}`;
	const { x1, y1, x2, y2 } = computeEdgeEndpoints(spoke);

	let markers = "";
	if (direction === "out") {
		markers = ` marker-end="url(#fg-arr-${tone})"`;
	} else if (direction === "in") {
		markers = ` marker-start="url(#fg-arr-${tone}-bi)"`;
	} else {
		markers = ` marker-start="url(#fg-arr-${tone}-bi)" marker-end="url(#fg-arr-${tone}-bi)"`;
	}

	return `    <path class="fg-edge ${tone}${styleClass}" d="M ${x1},${y1} L ${x2},${y2}"${markers}/>`;
}

function generateBody(content: RadialHubContent, ariaLabel: string): string {
	const { hub, spokes, legend } = content;

	const edgePaths = spokes.map((s) => renderEdge(s)).join("\n");
	const spokeNodesHtml = spokes.map((s) => renderSpoke(s)).join("\n");

	const legendHtml = legend ? `\n  <div class="fgraph-legend">${escapeHtml(legend)}</div>` : "";

	return `<div class="fgraph-wrap" role="img" aria-label="${escapeHtml(ariaLabel)}">

  <!-- ── EDGES (hub ↔ spokes) ──────────────────── -->
  <svg class="fgraph-edges" viewBox="0 0 100 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
${ARROW_MARKER_DEFS}
${edgePaths}
  </svg>

  <!-- ── HUB ────────────────────────────────────── -->
${renderHub(hub)}

  <!-- ── SPOKES ─────────────────────────────────── -->
${spokeNodesHtml}${legendHtml}
</div>`;
}

export interface RadialHubRenderInput {
	title: string;
	subtitle?: string;
	content: RadialHubContent;
}

export function renderRadialHubBody({ title, content }: RadialHubRenderInput): {
	bodyHtml: string;
	topologyCss: string;
} {
	const spokeNames = content.spokes.map((s) => s.name).join(", ");
	const ariaLabel = `Radial hub: ${title}. Hub ${content.hub.name} connected to spokes: ${spokeNames}.`;
	return {
		bodyHtml: generateBody(content, ariaLabel),
		topologyCss: RADIAL_HUB_CSS,
	};
}
