/**
 * Public entry for the type:"diagram" PI tool route (v0.2 slice 1).
 *
 * Dispatches to per-topology renderers based on the FgraphContent
 * discriminator, wraps the result in the standard fgraph HTML shell
 * (header + main + style block + aesthetic CSS).
 */

import type { FgraphAesthetic } from "../../types.js";
import { loadAestheticCss, renderDocumentShell } from "./_shared.js";
import { renderLayeredBody } from "./layered.js";
import { renderLinearFlowBody } from "./linear-flow.js";
import { renderRadialHubBody } from "./radial-hub.js";
import { renderSequenceBody } from "./sequence.js";

export {
	parseFgraphContent,
	SUPPORTED_TOPOLOGIES,
	type FgraphContent,
	type SupportedTopology,
} from "./schemas.js";
export type {
	FgraphEdge,
	FgraphNode,
	FgraphSemantic,
	FgraphShape,
	FgraphTone,
	LayeredContent,
	LinearFlowContent,
	RadialHubContent,
	RadialPosition,
	RadialSpoke,
	SequenceContent,
	SequenceMessage,
	SequenceParticipant,
} from "./schemas.js";

import type { FgraphContent } from "./schemas.js";

export interface GenerateDiagramInput {
	title: string;
	subtitle?: string;
	content: FgraphContent;
	aesthetic: FgraphAesthetic;
}

const TOPOLOGY_LABEL: Record<FgraphContent["topology"], string> = {
	sequence: "Sequence diagram",
	layered: "Layered architecture",
	"linear-flow": "Linear flow",
	"radial-hub": "Hub & spokes",
};

/**
 * Render a single-file HTML diagram from typed FgraphContent. Returns the
 * complete HTML string; the caller is responsible for writing it to disk
 * (see writeHtmlFile + openInBrowser in src/index.ts).
 */
export function generateDiagramTemplate(input: GenerateDiagramInput): string {
	const { title, subtitle, content, aesthetic } = input;
	const aestheticCss = loadAestheticCss(aesthetic);

	const renderers = {
		sequence: () => renderSequenceBody({ title, content: content as never }),
		layered: () => renderLayeredBody({ title, content: content as never }),
		"linear-flow": () => renderLinearFlowBody({ title, content: content as never }),
		"radial-hub": () => renderRadialHubBody({ title, content: content as never }),
	} as const;

	const { bodyHtml, topologyCss } = renderers[content.topology]();

	const eyebrow = `Lumen · ${TOPOLOGY_LABEL[content.topology]}`;

	return renderDocumentShell({
		title,
		eyebrow,
		subtitle,
		aestheticCss,
		topologyCss,
		bodyHtml,
	});
}
