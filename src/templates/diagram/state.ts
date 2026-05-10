/**
 * State-machine (FSM) renderer.
 *
 * States are rendered as circles (or chosen shapes) with transitions
 * drawn as curved SVG paths between state positions.
 */

import { escapeHtml } from "../shared.js";
import { ARROW_MARKER_DEFS } from "./_shared.js";
import type { FgraphTone, StateContent } from "./schemas.js";

const STATE_CSS = `
  .fgraph-wrap.state {
    position: relative;
    width: 100%;
    max-width: 800px;
    aspect-ratio: 16 / 9;
    margin: 24px auto 16px;
    background: var(--bg-panel);
    border: 1px solid rgba(34,211,238,0.35);
    border-radius: 10px;
    padding: 14px;
  }

  .fgraph-node.state-node {
    position: absolute;
    left: calc(var(--x, 50) * 1%);
    top:  calc(var(--y, 50) * 1%);
    width: var(--w, 14%);
    transform: translate(-50%, -50%);
    background: var(--bg-card);
    border: 1.5px solid var(--border-bright);
    border-radius: 999px;
    padding: 10px 14px;
    text-align: center;
    z-index: 2;
  }
  .fgraph-node.state-node.final {
    border-width: 3px;
  }
  .fgraph-node.state-node.initial::before {
    content: '';
    position: absolute;
    left: -18px;
    top: 50%;
    transform: translateY(-50%);
    width: 0;
    height: 0;
    border-top: 6px solid transparent;
    border-bottom: 6px solid transparent;
    border-left: 10px solid var(--text-muted);
  }
  .fgraph-node.state-node.amber  { border-color: var(--amber);  background: rgba(251,191,36,0.10); }
  .fgraph-node.state-node.cyan   { border-color: var(--cyan);   background: rgba(34,211,238,0.10); }
  .fgraph-node.state-node.purple { border-color: var(--purple); background: rgba(167,139,250,0.10); }
  .fgraph-node.state-node.green  { border-color: var(--green);  background: rgba(52,211,153,0.10); }
  .fgraph-node.state-node.red    { border-color: var(--red);    background: rgba(251,113,133,0.10); }

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

function computeStatePositions(count: number): { x: number; y: number }[] {
	if (count <= 4) {
		const xs = [20, 50, 80, 35, 65];
		const ys = [30, 20, 30, 70, 70];
		return Array.from({ length: count }, (_, i) => ({ x: xs[i] ?? 0, y: ys[i] ?? 0 }));
	}
	const positions: { x: number; y: number }[] = [];
	for (let i = 0; i < count; i++) {
		const angle = (2 * Math.PI * i) / count - Math.PI / 2;
		positions.push({ x: 50 + 32 * Math.cos(angle), y: 50 + 28 * Math.sin(angle) });
	}
	return positions;
}

function renderNode(state: StateContent["states"][number], x: number, y: number): string {
	const toneClass = state.tone ? ` ${state.tone}` : "";
	const titleTone = state.tone ? ` ${state.tone}` : "";
	const subHtml = state.sub ? `\n    <div class="fgraph-sub">${escapeHtml(state.sub)}</div>` : "";
	const initialClass = state.initial ? " initial" : "";
	const finalClass = state.final ? " final" : "";
	return `  <div class="fgraph-node state-node${toneClass}${initialClass}${finalClass}" style="--x:${x.toFixed(1)}; --y:${y.toFixed(1)};">
    <div class="fgraph-title${titleTone}">${escapeHtml(state.name)}</div>${subHtml}
  </div>`;
}

function renderTransition(
	transition: StateContent["transitions"][number],
	positions: { x: number; y: number }[],
): string {
	const fromPos = positions[transition.from] ?? { x: 0, y: 0 };
	const toPos = positions[transition.to] ?? { x: 0, y: 0 };
	const tone: FgraphTone = transition.tone ?? "cyan";
	const midX = (fromPos.x + toPos.x) / 2;
	const midY = (fromPos.y + toPos.y) / 2;
	const dx = toPos.x - fromPos.x;
	const dy = toPos.y - fromPos.y;
	const dist = Math.sqrt(dx * dx + dy * dy);
	const curve = dist > 0 ? Math.min(10, dist / 3) : 0;
	const perpX = (-dy / dist) * curve;
	const perpY = (dx / dist) * curve;
	const cpX = midX + perpX;
	const cpY = midY + perpY;
	const path = `    <path class="fg-edge ${tone}" d="M ${fromPos.x.toFixed(1)},${fromPos.y.toFixed(1)} Q ${cpX.toFixed(1)},${cpY.toFixed(1)} ${toPos.x.toFixed(1)},${toPos.y.toFixed(1)}" marker-end="url(#fg-arr-${tone})"/>`;
	const label = transition.label
		? `  <div class="fgraph-lbl ${tone}" style="--x:${cpX.toFixed(1)}; --y:${cpY.toFixed(1)};">${escapeHtml(transition.label)}</div>`
		: undefined;
	return label ? `${path}\n${label}` : path;
}

function generateBody(content: StateContent, ariaLabel: string): string {
	const { states, transitions, legend } = content;
	const positions = computeStatePositions(states.length);

	const nodeHtml = states
		.map((state, i) => {
			const pos = positions[i] ?? { x: 0, y: 0 };
			return renderNode(state, pos.x, pos.y);
		})
		.join("\n");

	const edgePaths = transitions.map((t) => renderTransition(t, positions)).join("\n");

	const legendHtml = legend ? `\n  <div class="fgraph-legend">${escapeHtml(legend)}</div>` : "";

	return `<div class="fgraph-wrap state" role="img" aria-label="${escapeHtml(ariaLabel)}">

  <!-- ── STATES ─────────────────────────────────── -->
${nodeHtml}

  <!-- ── TRANSITIONS ─────────────────────────────── -->
  <svg class="fgraph-edges" viewBox="0 0 100 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
${ARROW_MARKER_DEFS}
${edgePaths}
  </svg>
${legendHtml}
</div>`;
}

export interface StateRenderInput {
	title: string;
	subtitle?: string;
	content: StateContent;
}

export function renderStateBody({ title, content }: StateRenderInput): {
	bodyHtml: string;
	topologyCss: string;
} {
	const ariaLabel = `State machine: ${title}. ${content.states.map((s) => s.name).join(", ")}.`;
	return {
		bodyHtml: generateBody(content, ariaLabel),
		topologyCss: STATE_CSS,
	};
}
