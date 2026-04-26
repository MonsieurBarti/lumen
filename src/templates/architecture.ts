/**
 * Architecture template — CSS Grid card layout for text-heavy system overviews.
 * Lifted from @the-forge-flow/visual-explainer-pi: src/templates/architecture.ts.
 * Originally based on nicobailon/visual-explainer architecture.html.
 */

import type { Aesthetic, Palette } from "../types.js";
import {
	FONT_PAIRINGS,
	PALETTES,
	SHARED_CSS,
	escapeHtml,
	generateCSSVariables,
	generateHtmlShell,
} from "./shared.js";

export interface ArchitectureSection {
	label: string;
	labelColor?: "accent" | "green" | "orange" | "teal" | "plum";
	content: string;
	isHero?: boolean;
	isRecessed?: boolean;
}

export interface ArchitectureContent {
	sections: ArchitectureSection[];
	flowArrows?: { label: string }[];
	threeColumn?: ArchitectureSection[];
	pipeline?: {
		steps: { num: string; name: string; detail: string; color: string }[];
		legend?: { color: string; label: string }[];
	};
}

export function generateArchitectureTemplate(
	title: string,
	content: ArchitectureContent,
	aesthetic: Aesthetic,
	isDark: boolean,
): string {
	const palette = isDark ? PALETTES[aesthetic].dark : PALETTES[aesthetic].light;
	const fonts = FONT_PAIRINGS[aesthetic];
	const cssVars = generateCSSVariables(palette, fonts, isDark);

	const bodyContent = generateBody(title, content, palette);

	return generateHtmlShell(title, bodyContent, aesthetic, cssVars, getExtraCSS());
}

function generateBody(title: string, content: ArchitectureContent, _palette: Palette): string {
	let html = `
<div class="diagram">
  <h1>${escapeHtml(title)}</h1>
  <p class="subtitle">Architecture Overview</p>
`;

	let index = 0;

	// Render sections with flow arrows
	for (const section of content.sections) {
		const colorClass = section.labelColor ? `section--${section.labelColor}` : "";
		const depthClass = section.isHero
			? "section--hero"
			: section.isRecessed
				? "section--recessed"
				: "";
		const dotColor = section.labelColor ? `var(--${section.labelColor})` : "var(--text-dim)";

		html += `
  <div class="section ${colorClass} ${depthClass}" style="--i:${index++}">
    <div class="section-label"><span class="dot" style="background:${dotColor}"></span> ${escapeHtml(section.label)}</div>
    ${section.content}
  </div>
`;

		// Add flow arrow if specified
		const arrow = content.flowArrows?.[index - 1];
		if (arrow) {
			html += `
  <div class="flow-arrow" style="--i:${index++}">
    <svg viewBox="0 0 20 20"><path d="M10 4 L10 16 M6 12 L10 16 L14 12"/></svg>
    ${escapeHtml(arrow.label)}
  </div>
`;
		}
	}

	// Three column row if specified
	if (content.threeColumn && content.threeColumn.length > 0) {
		html += `  <div class="three-col">\n`;
		for (const col of content.threeColumn) {
			const colorClass = col.labelColor ? `section--${col.labelColor}` : "";
			const dotColor = col.labelColor ? `var(--${col.labelColor})` : "var(--text-dim)";
			html += `
    <div class="section ${colorClass}" style="--i:${index++}">
      <div class="section-label"><span class="dot" style="background:${dotColor}"></span> ${escapeHtml(col.label)}</div>
      ${col.content}
    </div>
`;
		}
		html += "  </div>\n";
	}

	html += "</div>";
	return html;
}

function getExtraCSS(): string {
	return `
${SHARED_CSS}

body {
  background: var(--bg);
  background-image:
    radial-gradient(ellipse at 20% 0%, var(--accent-dim) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 100%, var(--green-dim) 0%, transparent 40%);
  color: var(--text);
  font-family: var(--font-body);
  padding: 40px;
}

h1 {
  font-size: 38px;
  font-weight: 700;
  letter-spacing: -1px;
  margin-bottom: 6px;
  text-wrap: balance;
}

.subtitle {
  color: var(--text-dim);
  font-size: 14px;
  margin-bottom: 40px;
  font-family: var(--font-mono);
}

.diagram {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  max-width: 1100px;
  margin: 0 auto;
}

/* Color variants */
.section--accent { border-color: var(--accent-dim); }
.section--accent .section-label { color: var(--accent); }
.section--accent .section-label .dot { background: var(--accent) !important; }

.section--green { border-color: var(--green-dim); }
.section--green .section-label { color: var(--green); }
.section--green .section-label .dot { background: var(--green) !important; }

.section--orange { border-color: var(--orange-dim); }
.section--orange .section-label { color: var(--orange); }
.section--orange .section-label .dot { background: var(--orange) !important; }

.section--teal { border-color: var(--teal-dim); }
.section--teal .section-label { color: var(--teal); }
.section--teal .section-label .dot { background: var(--teal) !important; }

.section--plum { border-color: var(--plum-dim); }
.section--plum .section-label { color: var(--plum); }
.section--plum .section-label .dot { background: var(--plum) !important; }

/* Inner grid for sub-cards */
.inner-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.inner-card {
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px 16px;
}

.inner-card .title {
  font-weight: 600;
  font-size: 13px;
  margin-bottom: 4px;
}

.inner-card .desc {
  color: var(--text-dim);
  font-size: 12px;
  line-height: 1.5;
}

/* Three column layout */
.three-col {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 16px;
}

/* Node lists */
.node-list {
  list-style: none;
  font-size: 12px;
  line-height: 1.8;
}

.node-list li {
  padding-left: 14px;
  position: relative;
}

.node-list li::before {
  content: '›';
  color: var(--text-dim);
  font-weight: 600;
  position: absolute;
  left: 0;
}

/* Pipeline */
.pipeline {
  display: flex;
  gap: 0;
  align-items: stretch;
  overflow-x: auto;
  padding-bottom: 4px;
}

.pipeline-step {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 10px 12px;
  min-width: 120px;
  flex-shrink: 0;
  text-align: center;
}

.pipeline-step .step-num {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 600;
  margin-bottom: 4px;
}

.pipeline-step .step-name {
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 3px;
}

.pipeline-step .step-detail {
  font-size: 10px;
  color: var(--text-dim);
  line-height: 1.4;
}

.pipeline-arrow {
  display: flex;
  align-items: center;
  padding: 0 2px;
  color: var(--border-bright);
  font-size: 16px;
  flex-shrink: 0;
}

/* Legend */
.legend {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--text-dim);
  font-family: var(--font-mono);
}

.legend-swatch {
  width: 12px;
  height: 12px;
  border-radius: 3px;
}

/* Sources */
.sources {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

.source {
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 10px 18px;
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: border-color 0.2s;
}

.source:hover { border-color: var(--border-bright); }

/* Callout */
.callout {
  background: var(--surface2);
  border: 1px solid var(--border);
  border-left: 3px solid var(--accent);
  border-radius: 0 8px 8px 0;
  padding: 14px 18px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--text-dim);
}

.callout strong { color: var(--text); font-weight: 600; }

/* Responsive */
@media (max-width: 768px) {
  body { padding: 20px; }
  .inner-grid { grid-template-columns: 1fr; }
  .three-col { grid-template-columns: 1fr; }
  .pipeline { flex-wrap: wrap; gap: 6px; }
  .pipeline-arrow { display: none; }
}
`;
}
