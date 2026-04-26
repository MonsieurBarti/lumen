/**
 * Sequence-diagram renderer.
 *
 * Layout (matches lumen-diagram/templates/sequence.html convention):
 *   - participant pills at top:6%, evenly distributed in [12%, 88%]
 *   - lifelines drop from 18% to 92%
 *   - messages stacked vertically; auto-spaced based on count
 *   - container height = 140px + msg_count * 40px (variable, adapts to scale)
 *
 * Caller passes participants (2–6) + messages (1–15) as logical indices;
 * renderer computes absolute --x / --y.
 */

import { escapeHtml } from "../shared.js";
import { ARROW_MARKER_DEFS } from "./_shared.js";
import type { FgraphTone, SequenceContent, SequenceMessage } from "./schemas.js";

const PARTICIPANT_PADDING = 12; // % from each edge
const MSG_Y_START = 24;
const MSG_Y_END = 86;
const MSG_DEFAULT_STEP = 8;

/* ────────────────────────────────────────────────────────────────────
   CSS subset specific to sequence diagrams. Inlined into the document
   shell after the aesthetic CSS.
   ──────────────────────────────────────────────────────────────────── */
const SEQUENCE_CSS = `
  .fgraph-wrap.sequence {
    position: relative;
    width: 100%;
    --msg-count: 5;
    height: calc(140px + var(--msg-count) * 40px);
    max-width: 860px;
    margin: 24px auto 20px;
    background: var(--bg-panel);
    border: 1px solid rgba(34,211,238,0.35);
    border-radius: 10px;
    padding: 14px;
  }

  .fg-seq-participant {
    position: absolute;
    left: calc(var(--x, 50) * 1%);
    top: 6%;
    transform: translate(-50%, 0);
    padding: 6px 14px;
    background: var(--bg-card);
    border: 1.5px solid var(--border-bright);
    border-radius: 999px;
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    color: var(--text);
    white-space: nowrap;
    z-index: 2;
    text-align: center;
    line-height: 1.25;
  }
  .fg-seq-participant .sub {
    display: block;
    font-size: 8.5px;
    color: var(--text-muted);
    margin-top: 2px;
    font-weight: 400;
  }
  .fg-seq-participant.amber  { border-color: rgba(251,191,36,0.55);  color: var(--amber); }
  .fg-seq-participant.cyan   { border-color: rgba(34,211,238,0.55);  color: var(--cyan); }
  .fg-seq-participant.purple { border-color: rgba(167,139,250,0.55); color: var(--purple); }
  .fg-seq-participant.green  { border-color: rgba(52,211,153,0.55);  color: var(--green); }
  .fg-seq-participant.red    { border-color: rgba(251,113,133,0.55); color: var(--red); }

  .fg-lifeline {
    position: absolute;
    left: calc(var(--x, 50) * 1%);
    top: 18%;
    bottom: 8%;
    width: 0;
    border-left: 1px dashed var(--border-bright);
    pointer-events: none;
  }

  .fg-seq-msg-lbl {
    position: absolute;
    left: calc(var(--x, 50) * 1%);
    top:  calc(var(--y, 50) * 1%);
    transform: translate(-50%, -120%);
    font-family: 'Space Mono', monospace;
    font-size: 9.5px;
    color: var(--text-dim);
    background: var(--bg-panel);
    padding: 2px 6px;
    border-radius: 3px;
    white-space: nowrap;
    z-index: 1;
  }`;

function computeParticipantX(index: number, count: number): number {
	if (count === 1) return 50;
	const span = 100 - 2 * PARTICIPANT_PADDING;
	const step = span / (count - 1);
	return PARTICIPANT_PADDING + index * step;
}

function computeMessageY(index: number, count: number): number {
	if (count === 1) return MSG_Y_START;
	const naturalEnd = MSG_Y_START + (count - 1) * MSG_DEFAULT_STEP;
	const step = naturalEnd <= MSG_Y_END ? MSG_DEFAULT_STEP : (MSG_Y_END - MSG_Y_START) / (count - 1);
	return MSG_Y_START + index * step;
}

function resolveMessageTone(
	msg: SequenceMessage,
	participants: SequenceContent["participants"],
): FgraphTone {
	if (msg.tone !== undefined) return msg.tone;
	const fromTone = participants[msg.from]?.tone;
	if (fromTone !== undefined) return fromTone;
	const toTone = participants[msg.to]?.tone;
	if (toTone !== undefined) return toTone;
	return "cyan";
}

function generateBody(content: SequenceContent, ariaLabel: string): string {
	const { participants, messages, legend } = content;

	const participantHtml = participants
		.map((p, i) => {
			const x = computeParticipantX(i, participants.length).toFixed(1);
			const tone = p.tone ? ` ${p.tone}` : "";
			const sub = p.sub ? `<span class="sub">${escapeHtml(p.sub)}</span>` : "";
			return `  <div class="fg-seq-participant${tone}" style="--x:${x}">${escapeHtml(p.name)}${sub}</div>`;
		})
		.join("\n");

	const lifelineHtml = participants
		.map((_, i) => {
			const x = computeParticipantX(i, participants.length).toFixed(1);
			return `  <div class="fg-lifeline" style="--x:${x}"></div>`;
		})
		.join("\n");

	const edgePaths: string[] = [];
	const messageLabels: string[] = [];

	messages.forEach((msg, i) => {
		const fromX = computeParticipantX(msg.from, participants.length);
		const toX = computeParticipantX(msg.to, participants.length);
		const y = computeMessageY(i, messages.length);
		const tone = resolveMessageTone(msg, participants);
		const isReturn = msg.kind === "return";
		const dashedClass = isReturn ? " dashed" : "";

		edgePaths.push(
			`    <path class="fg-edge ${tone}${dashedClass}" d="M ${fromX.toFixed(1)},${y.toFixed(1)} L ${toX.toFixed(1)},${y.toFixed(1)}" marker-end="url(#fg-arr-${tone})"/>`,
		);

		// Label sits above the arrow at its midpoint.
		const labelX = (fromX + toX) / 2;
		messageLabels.push(
			`  <div class="fg-seq-msg-lbl" style="--x:${labelX.toFixed(1)}; --y:${y.toFixed(1)};">${escapeHtml(msg.label)}</div>`,
		);
	});

	const legendHtml = legend
		? `\n  <div class="fgraph-legend">${escapeHtml(legend)}</div>`
		: `\n  <div class="fgraph-legend">solid = forward call · dashed = return / response</div>`;

	return `<div class="fgraph-wrap sequence" style="--msg-count: ${messages.length};" role="img"
     aria-label="${escapeHtml(ariaLabel)}">

  <!-- ── PARTICIPANTS ───────────────────────────── -->
${participantHtml}

  <!-- ── LIFELINES ──────────────────────────────── -->
${lifelineHtml}

  <!-- ── MESSAGE ARROWS ─────────────────────────── -->
  <svg class="fgraph-edges" viewBox="0 0 100 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg"
       style="position:absolute; inset:0; width:100%; height:100%;">
${ARROW_MARKER_DEFS}
${edgePaths.join("\n")}
  </svg>

  <!-- ── MESSAGE LABELS ─────────────────────────── -->
${messageLabels.join("\n")}
${legendHtml}
</div>`;
}

export interface SequenceRenderInput {
	title: string;
	subtitle?: string;
	content: SequenceContent;
}

export function renderSequenceBody({ title, content }: SequenceRenderInput): {
	bodyHtml: string;
	topologyCss: string;
} {
	const ariaLabel = `Sequence diagram: ${title}. ${content.participants
		.map((p) => p.name)
		.join(", ")}.`;
	return {
		bodyHtml: generateBody(content, ariaLabel),
		topologyCss: SEQUENCE_CSS,
	};
}
