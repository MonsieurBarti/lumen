/**
 * Shared helpers for fgraph topology renderers.
 * - aesthetic CSS loader (reads from skills/lumen-diagram/templates/aesthetics/)
 * - HTML document shell (header + main + style block)
 * - common SVG arrow markers + base CSS shared across all 4 topologies
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import type { FgraphAesthetic } from "../../types.js";
import { escapeHtml } from "../shared.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Candidate locations for the aesthetics CSS directory. Try each in order,
 * use the first that exists. Two layouts to support:
 *   - production install: <pkg>/dist/templates/diagram/ → <pkg>/dist/skills/...
 *     (also mirrored at <pkg>/skills/... since both are in package.files)
 *   - dev / vitest: src/templates/diagram/ → repo-root/skills/...
 */
const CANDIDATE_AESTHETICS_DIRS = [
	join(__dirname, "..", "..", "skills", "lumen-diagram", "templates", "aesthetics"),
	join(__dirname, "..", "..", "..", "skills", "lumen-diagram", "templates", "aesthetics"),
] as const;

let resolvedAestheticsDir: string | undefined;

function resolveAestheticsDir(): string {
	if (resolvedAestheticsDir !== undefined) return resolvedAestheticsDir;
	for (const dir of CANDIDATE_AESTHETICS_DIRS) {
		if (existsSync(dir)) {
			resolvedAestheticsDir = dir;
			return dir;
		}
	}
	throw new Error(
		`Could not locate fgraph aesthetics directory. Tried: ${CANDIDATE_AESTHETICS_DIRS.join(", ")}. Ensure the package was built (bun run build) so dist/skills/ exists.`,
	);
}

const aestheticCache = new Map<FgraphAesthetic, string>();

/** Read and cache an aesthetic CSS file. */
export function loadAestheticCss(aesthetic: FgraphAesthetic): string {
	const cached = aestheticCache.get(aesthetic);
	if (cached !== undefined) return cached;
	const path = join(resolveAestheticsDir(), `${aesthetic}.css`);
	if (!existsSync(path)) {
		throw new Error(`Aesthetic CSS file not found: ${path}`);
	}
	const css = readFileSync(path, "utf-8");
	aestheticCache.set(aesthetic, css);
	return css;
}

/* ────────────────────────────────────────────────────────────────────
   Common SVG arrow-marker defs — shared across all 4 topologies.
   Inlined into each renderer's <svg class="fgraph-edges">.
   ──────────────────────────────────────────────────────────────────── */
export const ARROW_MARKER_DEFS = `
    <defs>
      <marker id="fg-arr-amber"  viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" class="mk-amber"/></marker>
      <marker id="fg-arr-cyan"   viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" class="mk-cyan"/></marker>
      <marker id="fg-arr-purple" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" class="mk-purple"/></marker>
      <marker id="fg-arr-green"  viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" class="mk-green"/></marker>
      <marker id="fg-arr-red"    viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" class="mk-red"/></marker>
      <marker id="fg-arr-amber-bi"  viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="mk-amber"/></marker>
      <marker id="fg-arr-cyan-bi"   viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="mk-cyan"/></marker>
      <marker id="fg-arr-purple-bi" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="mk-purple"/></marker>
      <marker id="fg-arr-green-bi"  viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="mk-green"/></marker>
      <marker id="fg-arr-red-bi"    viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="mk-red"/></marker>
    </defs>`;

/**
 * CSS shared by all 4 topologies — body shell + header + arrow tones +
 * arrowhead fills + edge label primitives. Per-topology CSS is appended
 * by each renderer.
 */
export const BASE_DIAGRAM_CSS = `
  body {
    background: var(--bg);
    color: var(--text);
    font-family: 'Inter', system-ui, sans-serif;
    padding: 32px 24px 40px;
    max-width: 960px;
    margin: 0 auto;
  }
  header { margin-bottom: 20px; }
  .header-eyebrow {
    font-family: 'Space Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-muted);
  }
  h1 { font-size: 28px; font-weight: 700; margin: 6px 0 4px; font-family: 'Outfit', sans-serif; }
  h1 .accent { color: var(--cyan); }
  .header-subtitle { color: var(--text-dim); font-size: 13px; margin: 0; max-width: 740px; }

  .fgraph-edges { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; overflow: visible; z-index: 1; }
  .fgraph-edges .fg-edge { fill: none; stroke-width: 1.6; opacity: 0.95; vector-effect: non-scaling-stroke; }
  .fgraph-edges .fg-edge.amber  { stroke: var(--amber); }
  .fgraph-edges .fg-edge.cyan   { stroke: var(--cyan); }
  .fgraph-edges .fg-edge.purple { stroke: var(--purple); }
  .fgraph-edges .fg-edge.green  { stroke: var(--green); }
  .fgraph-edges .fg-edge.red    { stroke: var(--red); }
  .fgraph-edges .fg-edge.dashed { stroke-dasharray: 4 3; }
  .fgraph-edges .fg-edge.thick  { stroke-width: 2.6; }
  .fgraph-edges .mk-amber  { fill: var(--amber); }
  .fgraph-edges .mk-cyan   { fill: var(--cyan); }
  .fgraph-edges .mk-purple { fill: var(--purple); }
  .fgraph-edges .mk-green  { fill: var(--green); }
  .fgraph-edges .mk-red    { fill: var(--red); }

  .fgraph-lbl {
    position: absolute;
    left: calc(var(--x, 50) * 1%);
    top:  calc(var(--y, 50) * 1%);
    transform: translate(-50%, -50%);
    font-family: 'Space Mono', monospace;
    font-size: 9.5px;
    font-weight: 700;
    padding: 2px 6px;
    background: var(--bg-panel);
    border-radius: 3px;
    pointer-events: none;
    white-space: nowrap;
    z-index: 3;
  }
  .fgraph-lbl.amber  { color: var(--amber); }
  .fgraph-lbl.cyan   { color: var(--cyan); }
  .fgraph-lbl.purple { color: var(--purple); }
  .fgraph-lbl.green  { color: var(--green); }
  .fgraph-lbl.red    { color: var(--red); }
  .fgraph-lbl .dim   { color: var(--text-muted); font-weight: 400; }

  .fgraph-legend {
    position: absolute;
    bottom: 10px;
    left: 0;
    right: 0;
    text-align: center;
    font-family: 'Space Mono', monospace;
    font-size: 9.5px;
    color: var(--text-muted);
    pointer-events: none;
  }`;

export interface DocumentShellInput {
	title: string;
	eyebrow: string;
	subtitle?: string | undefined;
	aestheticCss: string;
	topologyCss: string;
	bodyHtml: string;
}

/**
 * Wrap a topology body in the standard fgraph HTML shell (DOCTYPE, head,
 * inlined Google fonts, aesthetic + base + per-topology CSS, header, body).
 * Returns a single-file offline-safe HTML string.
 */
export function renderDocumentShell({
	title,
	eyebrow,
	subtitle,
	aestheticCss,
	topologyCss,
	bodyHtml,
}: DocumentShellInput): string {
	const safeTitle = escapeHtml(title);
	const safeEyebrow = escapeHtml(eyebrow);
	const safeSubtitle = subtitle ? escapeHtml(subtitle) : "";

	return `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="generator" content="lumen / fgraph deterministic renderer">
<title>${safeTitle}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Inter:wght@300;400;500;600;700&family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
${aestheticCss}
${BASE_DIAGRAM_CSS}
${topologyCss}
</style>
</head>
<body>

<header>
  <div class="header-eyebrow">${safeEyebrow}</div>
  <h1>${safeTitle}</h1>
  ${safeSubtitle ? `<p class="header-subtitle">${safeSubtitle}</p>` : ""}
</header>

<main>
${bodyHtml}
</main>

</body>
</html>`;
}
