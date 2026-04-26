/**
 * Mermaid template for flowcharts, sequence diagrams, ER diagrams, etc.
 * Based on nicobailon/visual-explainer mermaid-flowchart.html.
 *
 * Key invariants (each one exists because it was a real bug):
 *   1. Mermaid source is placed inside `<script type="text/plain" class="diagram-source">`
 *      — the HTML parser treats this as opaque data, so `<br/>`, `<`, `>`,
 *      `&` in the source survive untouched. Never use `<pre class="mermaid">`.
 *   2. Rendering is explicit via `mermaid.render(id, code)` with
 *      `startOnLoad: false`. This avoids the timing race between "mermaid
 *      finished mutating the DOM" and "our zoom/pan handlers bind".
 *   3. `themeVariables.fontFamily` uses a concrete font stack, not a CSS
 *      custom property. Mermaid bakes the value into SVG inline styles and
 *      CSS vars don't resolve when the SVG is exported to a new tab.
 *   4. The new-tab export reads the page background from a `data-bg`
 *      attribute on `.mermaid-wrap` so the exported view matches the
 *      baked-in SVG colors.
 */

import type { Aesthetic } from "../types.js";
import {
	FONT_PAIRINGS,
	MERMAID_SHELL_CSS,
	MERMAID_SHELL_JS,
	PALETTES,
	escapeHtml,
	generateCSSVariables,
	generateHtmlShell,
} from "./shared.js";

export interface MermaidContent {
	mermaidSyntax: string;
	caption?: string;
}

export function generateMermaidTemplate(
	title: string,
	content: MermaidContent,
	aesthetic: Aesthetic,
	isDark: boolean,
): string {
	const palette = isDark ? PALETTES[aesthetic].dark : PALETTES[aesthetic].light;
	const fonts = FONT_PAIRINGS[aesthetic];
	const cssVars = generateCSSVariables(palette, fonts, isDark);

	const themeConfig = generateMermaidThemeConfig(palette, fonts);
	const bodyContent = generateBody(title, content, palette.bg);

	return generateHtmlShell(
		title,
		bodyContent,
		aesthetic,
		cssVars,
		`${MERMAID_SHELL_CSS}${getExtraCSS()}`,
		getMermaidScript(themeConfig),
	);
}

function generateMermaidThemeConfig(
	palette: { [key: string]: string },
	fonts: { body: string; mono: string },
): string {
	// IMPORTANT: use concrete font strings — not `var(--font-body)` — because
	// Mermaid bakes the value into SVG attributes, and CSS custom properties
	// don't resolve inside an extracted SVG (see openInNewTab).
	const fontFamily = fonts.body.replace(/'/g, "\\'");
	return `
    theme: 'base',
    look: 'classic',
    layout: 'elk',
    themeVariables: {
      fontFamily: '${fontFamily}',
      fontSize: '16px',
      primaryColor: '${palette.surface}',
      primaryTextColor: '${palette.text}',
      primaryBorderColor: '${palette.accent}',
      lineColor: '${palette.textDim}',
      secondaryColor: '${palette.surface2}',
      secondaryBorderColor: '${palette.teal ?? palette.accent}',
      secondaryTextColor: '${palette.text}',
      tertiaryColor: '${palette.surfaceElevated}',
      tertiaryBorderColor: '${palette.orange ?? palette.accent}',
      tertiaryTextColor: '${palette.text}',
      noteBkgColor: '${palette.surfaceElevated}',
      noteTextColor: '${palette.text}',
      noteBorderColor: '${palette.accent}'
    },
    flowchart: { useMaxWidth: false, htmlLabels: true, curve: 'basis' },
    sequence: { useMaxWidth: false, diagramMarginX: 50, diagramMarginY: 10 }
  `;
}

/**
 * Escape mermaid source for safe inclusion in a `<script type="text/plain">`.
 * Browsers parse a script element's contents only looking for `</script>` —
 * so we only need to neutralize the literal sequence `</script` anywhere in
 * the source. Everything else (HTML entities, `<br/>`, `<`, `>`, `&`) passes
 * through untouched, which is exactly what Mermaid wants.
 */
export function escapeMermaidSource(source: string): string {
	return source.replace(/<\/script/gi, "<\\/script");
}

function generateBody(title: string, content: MermaidContent, bg: string): string {
	const captionHtml = content.caption
		? `<p class="caption">${escapeHtml(content.caption)}</p>`
		: "";

	const safeSource = escapeMermaidSource(content.mermaidSyntax);
	// Escape `"` in the bg value for the attribute — palette values are
	// hex/rgba, but belt-and-braces.
	const bgAttr = bg.replace(/"/g, "&quot;");

	return `
<div class="container">
  <h1>${escapeHtml(title)}</h1>
  <section class="diagram-shell">
    <p class="diagram-shell__hint">
      Ctrl/Cmd + wheel to zoom. Drag to pan when zoomed. Double-click to fit.
    </p>
    <div class="mermaid-wrap" data-bg="${bgAttr}">
      <div class="zoom-controls">
        <button type="button" data-action="zoom-in" title="Zoom in">+</button>
        <button type="button" data-action="zoom-out" title="Zoom out">&minus;</button>
        <button type="button" data-action="zoom-fit" title="Smart fit">&#8634;</button>
        <button type="button" data-action="zoom-one" title="1:1 zoom">1:1</button>
        <button type="button" data-action="zoom-expand" title="Open full size">&#x26F6;</button>
        <span class="zoom-label">Loading…</span>
      </div>
      <div class="mermaid-viewport">
        <div class="mermaid mermaid-canvas"></div>
      </div>
    </div>
    <script type="text/plain" class="diagram-source">
${safeSource}
    </script>
  </section>
  ${captionHtml}
</div>
`;
}

function getExtraCSS(): string {
	return `
body {
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-body);
  padding: 40px;
  min-height: 100vh;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

h1 {
  font-size: 32px;
  font-weight: 700;
  letter-spacing: -0.5px;
  margin-bottom: 24px;
  text-wrap: balance;
}

.caption {
  color: var(--text-dim);
  font-size: 14px;
  margin-top: 16px;
  text-align: center;
}

@media (max-width: 768px) {
  body { padding: 20px; }
  h1 { font-size: 24px; }
}
`;
}

function getMermaidScript(themeConfig: string): string {
	return `
<script type="module">
  import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
  import elkLayouts from 'https://cdn.jsdelivr.net/npm/@mermaid-js/layout-elk/dist/mermaid-layout-elk.esm.min.mjs';

  mermaid.registerLayoutLoaders(elkLayouts);
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'loose',
    ${themeConfig}
  });

  // Expose on window so the shell JS (classic script, IIFE) can await it.
  window.mermaid = mermaid;
  window.dispatchEvent(new Event('mermaid-ready'));
</script>
<script>
${MERMAID_SHELL_JS}
</script>
`;
}
