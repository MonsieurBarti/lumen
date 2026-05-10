/**
 * ER-diagram renderer — relational schema.
 *
 * Entities rendered as boxes with attribute lists. Relationships
 * drawn as lines between entity centers.
 */

import { escapeHtml } from "../shared.js";
import { ARROW_MARKER_DEFS } from "./_shared.js";
import type { ErContent, FgraphTone } from "./schemas.js";

const ER_CSS = `
  .fgraph-wrap.er {
    position: relative;
    width: 100%;
    max-width: 860px;
    aspect-ratio: 4 / 3;
    margin: 24px auto 16px;
    background: var(--bg-panel);
    border: 1px solid rgba(34,211,238,0.35);
    border-radius: 10px;
    padding: 14px;
  }

  .er-entity {
    position: absolute;
    left: calc(var(--x, 50) * 1%);
    top:  calc(var(--y, 50) * 1%);
    width: var(--w, 22%);
    transform: translate(-50%, -50%);
    background: var(--bg-card);
    border: 1.5px solid var(--border-bright);
    border-radius: 10px;
    padding: 8px 10px;
    text-align: left;
    z-index: 2;
  }
  .er-entity.amber  { border-color: var(--amber); }
  .er-entity.cyan   { border-color: var(--cyan); }
  .er-entity.purple { border-color: var(--purple); }
  .er-entity.green  { border-color: var(--green); }
  .er-entity.red    { border-color: var(--red); }

  .er-entity-name {
    font-family: 'Outfit', sans-serif;
    font-size: 12.5px;
    font-weight: 700;
    line-height: 1.2;
    margin-bottom: 4px;
    padding-bottom: 4px;
    border-bottom: 1px solid var(--border-bright);
  }
  .er-entity-name.amber  { color: var(--amber); }
  .er-entity-name.cyan   { color: var(--cyan); }
  .er-entity-name.purple { color: var(--purple); }
  .er-entity-name.green  { color: var(--green); }
  .er-entity-name.red    { color: var(--red); }

  .er-attr {
    font-family: 'Space Mono', monospace;
    font-size: 9px;
    line-height: 1.4;
    color: var(--text-dim);
  }
  .er-attr.key {
    font-weight: 700;
    color: var(--text);
  }

  .er-rel-label {
    position: absolute;
    left: calc(var(--x, 50) * 1%);
    top:  calc(var(--y, 50) * 1%);
    transform: translate(-50%, -50%);
    font-family: 'Space Mono', monospace;
    font-size: 9px;
    color: var(--text-muted);
    background: var(--bg-panel);
    padding: 1px 4px;
    border-radius: 3px;
    white-space: nowrap;
    z-index: 3;
  }`;

function distributeEntities(count: number): { x: number; y: number }[] {
	if (count <= 3) {
		const xs = [25, 50, 75];
		const y = 35;
		return Array.from({ length: count }, (_, i) => ({ x: xs[i] ?? 0, y }));
	}
	if (count <= 6) {
		const xs = [20, 50, 80, 35, 65];
		const ys = [30, 30, 30, 70, 70];
		return Array.from({ length: count }, (_, i) => ({ x: xs[i] ?? 0, y: ys[i] ?? 0 }));
	}
	const positions: { x: number; y: number }[] = [];
	const cols = 3;
	const rows = Math.ceil(count / cols);
	for (let i = 0; i < count; i++) {
		const col = i % cols;
		const row = Math.floor(i / cols);
		positions.push({ x: 20 + col * 30, y: 20 + (row * 60) / Math.max(rows - 1, 1) });
	}
	return positions;
}

function renderEntity(
	entity: ErContent["entities"][number],
	x: number,
	y: number,
	_index: number,
): string {
	const tone: FgraphTone = (entity.attributes.find((a) => a.key)?.type as FgraphTone) ?? "cyan";
	const nameClass = tone;
	const attrsHtml = entity.attributes
		.map((attr) => {
			const keyClass = attr.key ? " key" : "";
			const typeStr = attr.type ? ` <span class="dim">(${escapeHtml(attr.type)})</span>` : "";
			return `    <div class="er-attr${keyClass}">${escapeHtml(attr.name)}${typeStr}</div>`;
		})
		.join("\n");
	return `  <div class="er-entity ${nameClass}" style="--x:${x.toFixed(1)}; --y:${y.toFixed(1)};">
    <div class="er-entity-name ${nameClass}">${escapeHtml(entity.name)}</div>
${attrsHtml}
  </div>`;
}

function renderRelationship(
	rel: ErContent["relationships"][number],
	positions: { x: number; y: number }[],
): string {
	const fromPos = positions[rel.from] ?? { x: 0, y: 0 };
	const toPos = positions[rel.to] ?? { x: 0, y: 0 };
	const midX = (fromPos.x + toPos.x) / 2;
	const midY = (fromPos.y + toPos.y) / 2;
	const tone: FgraphTone = "cyan";
	const path = `    <path class="fg-edge ${tone}" d="M ${fromPos.x.toFixed(1)},${fromPos.y.toFixed(1)} L ${toPos.x.toFixed(1)},${toPos.y.toFixed(1)}" marker-end="url(#fg-arr-${tone})"/>`;
	const label =
		rel.label || rel.type
			? `  <div class="er-rel-label" style="--x:${midX.toFixed(1)}; --y:${midY.toFixed(1)};">${escapeHtml(rel.label ?? rel.type ?? "")}</div>`
			: undefined;
	return label ? `${path}\n${label}` : path;
}

function generateBody(content: ErContent, ariaLabel: string): string {
	const { entities, relationships, legend } = content;
	const positions = distributeEntities(entities.length);

	const entityHtml = entities
		.map((entity, i) => {
			const pos = positions[i] ?? { x: 0, y: 0 };
			return renderEntity(entity, pos.x, pos.y, i);
		})
		.join("\n");

	const edgePaths = relationships.map((rel) => renderRelationship(rel, positions)).join("\n");

	const legendHtml = legend ? `\n  <div class="fgraph-legend">${escapeHtml(legend)}</div>` : "";

	return `<div class="fgraph-wrap er" role="img" aria-label="${escapeHtml(ariaLabel)}">

  <!-- ── ENTITIES ───────────────────────────────── -->
${entityHtml}

  <!-- ── RELATIONSHIPS ──────────────────────────── -->
  <svg class="fgraph-edges" viewBox="0 0 100 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
${ARROW_MARKER_DEFS}
${edgePaths}
  </svg>
${legendHtml}
</div>`;
}

export interface ErRenderInput {
	title: string;
	subtitle?: string;
	content: ErContent;
}

export function renderErBody({ title, content }: ErRenderInput): {
	bodyHtml: string;
	topologyCss: string;
} {
	const ariaLabel = `ER diagram: ${title}. ${content.entities.map((e) => e.name).join(", ")}.`;
	return {
		bodyHtml: generateBody(content, ariaLabel),
		topologyCss: ER_CSS,
	};
}
