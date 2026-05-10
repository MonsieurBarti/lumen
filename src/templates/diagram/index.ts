/**
 * Public entry for the type:"diagram" PI tool route (v0.2 slice 1).
 *
 * Dispatches to per-topology renderers based on the FgraphContent
 * discriminator, wraps the result in the standard fgraph HTML shell
 * (header + main + style block + aesthetic CSS).
 */

import type { FgraphAesthetic } from "../../types.js";
import { loadAestheticCss, renderDocumentShell } from "./_shared.js";
import { renderDepGraphBody } from "./dep-graph.js";
import { renderDeploymentTiersBody } from "./deployment-tiers.js";
import { renderDualClusterBody } from "./dual-cluster.js";
import { renderErBody } from "./er.js";
import { renderGanttBody } from "./gantt.js";
import { renderLaneSwimBody } from "./lane-swim.js";
import { renderLayeredBody } from "./layered.js";
import { renderLinearFlowBody } from "./linear-flow.js";
import { renderMachineClustersBody } from "./machine-clusters.js";
import { renderPieBody } from "./pie.js";
import { renderRadialHubBody } from "./radial-hub.js";
import { renderRadialRingBody } from "./radial-ring.js";
import { renderSequenceBody } from "./sequence.js";
import { renderStateBody } from "./state.js";
import { renderSystemArchitectureBody } from "./system-architecture.js";

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
	"radial-ring": "Peer ring",
	"lane-swim": "Swimlanes",
	"deployment-tiers": "Deployment tiers",
	"machine-clusters": "Machine clusters",
	state: "State machine",
	gantt: "Gantt chart",
	pie: "Pie chart",
	er: "Entity relationship",
	"dep-graph": "Dependency graph",
	"dual-cluster": "Dual cluster",
	"system-architecture": "System architecture",
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
		"radial-ring": () => renderRadialRingBody({ title, content: content as never }),
		"lane-swim": () => renderLaneSwimBody({ title, content: content as never }),
		"deployment-tiers": () => renderDeploymentTiersBody({ title, content: content as never }),
		"machine-clusters": () => renderMachineClustersBody({ title, content: content as never }),
		state: () => renderStateBody({ title, content: content as never }),
		gantt: () => renderGanttBody({ title, content: content as never }),
		pie: () => renderPieBody({ title, content: content as never }),
		er: () => renderErBody({ title, content: content as never }),
		"dep-graph": () => renderDepGraphBody({ title, content: content as never }),
		"dual-cluster": () => renderDualClusterBody({ title, content: content as never }),
		"system-architecture": () => renderSystemArchitectureBody({ title, content: content as never }),
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
