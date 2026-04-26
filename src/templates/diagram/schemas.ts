/**
 * Schemas for the type:"diagram" PI tool route (v0.2 slice 1).
 *
 * Four topologies ship in slice 1 — they cover every recipe in
 * skills/lumen-diagram/templates/ai-patterns.md (RAG, Agentic RAG, Mem0,
 * Multi-Agent). The remaining 11 fgraph topologies land as patch-series
 * extensions; new entries plug into FgraphContent's discriminated union.
 *
 * Coordinate philosophy: callers describe topology semantically (lane
 * indices, layer indices, compass positions) and the renderer computes
 * absolute --x/--y. The free-form topologies (system-architecture,
 * dual-cluster) that genuinely need pixel coords are deferred.
 */

/** Border / fill tone for nodes + arrows. */
export type FgraphTone = "amber" | "cyan" | "purple" | "green" | "red";

/** Node shape vocabulary — see lumen-diagram/SKILL.md table 2. */
export type FgraphShape =
	| "rect"
	| "pill"
	| "circle"
	| "hexagon"
	| "diamond"
	| "cylinder"
	| "folded";

/** Edge semantic class — see lumen-diagram/SKILL.md table 3. */
export type FgraphSemantic = "data" | "control" | "write" | "feedback" | "async";

/** Optional edge style modifiers. Compose with semantic. */
export type FgraphEdgeStyle = "dashed" | "thick";

export interface FgraphNode {
	name: string;
	sub?: string;
	subMuted?: string;
	tone?: FgraphTone;
	shape?: FgraphShape;
}

export interface FgraphEdge {
	from: number;
	to: number;
	label?: string;
	semantic?: FgraphSemantic;
	style?: FgraphEdgeStyle;
	tone?: FgraphTone;
}

/** Compass position around the hub (radial-hub). */
export type RadialPosition =
	| "top"
	| "top-right"
	| "right"
	| "bottom-right"
	| "bottom"
	| "bottom-left"
	| "left"
	| "top-left";

export interface SequenceParticipant {
	name: string;
	tone?: FgraphTone;
	sub?: string;
}

export interface SequenceMessage {
	from: number;
	to: number;
	label: string;
	/** "request" = solid forward call; "return" = dashed return / response. */
	kind?: "request" | "return";
	tone?: FgraphTone;
}

export interface SequenceContent {
	topology: "sequence";
	participants: SequenceParticipant[];
	messages: SequenceMessage[];
	legend?: string;
}

export interface LayeredLayer {
	label: string;
	nodes: FgraphNode[];
}

export interface LayeredEdge {
	fromLayer: number;
	toLayer: number;
	semantic?: FgraphSemantic;
	style?: FgraphEdgeStyle;
	label?: string;
}

export interface LayeredContent {
	topology: "layered";
	layers: LayeredLayer[];
	edges?: LayeredEdge[];
	legend?: string;
}

export interface LinearFlowContent {
	topology: "linear-flow";
	stages: FgraphNode[];
	/** Defaults to implicit chain (0→1, 1→2, …). Provide to override semantics. */
	edges?: FgraphEdge[];
	legend?: string;
}

export interface RadialSpoke extends FgraphNode {
	position: RadialPosition;
	semantic?: FgraphSemantic;
	/** Edge direction relative to hub. Default "both". */
	direction?: "in" | "out" | "both";
	style?: FgraphEdgeStyle;
}

export interface RadialHubContent {
	topology: "radial-hub";
	hub: FgraphNode;
	spokes: RadialSpoke[];
	legend?: string;
}

export type FgraphContent = SequenceContent | LayeredContent | LinearFlowContent | RadialHubContent;

export const SUPPORTED_TOPOLOGIES = [
	"sequence",
	"layered",
	"linear-flow",
	"radial-hub",
] as const satisfies readonly FgraphContent["topology"][];

export type SupportedTopology = (typeof SUPPORTED_TOPOLOGIES)[number];

/* ────────────────────────────────────────────────────────────────────
   Parsers — convert untrusted JSON from the PI tool param into typed
   FgraphContent. Throws Error on invalid shape with a precise message.
   Style matches src/utils/validators.ts (Reflect.get + manual guards).
   ──────────────────────────────────────────────────────────────────── */

const TONES: ReadonlySet<string> = new Set(["amber", "cyan", "purple", "green", "red"]);

const SHAPES: ReadonlySet<string> = new Set([
	"rect",
	"pill",
	"circle",
	"hexagon",
	"diamond",
	"cylinder",
	"folded",
]);

const SEMANTICS: ReadonlySet<string> = new Set(["data", "control", "write", "feedback", "async"]);

const EDGE_STYLES: ReadonlySet<string> = new Set(["dashed", "thick"]);

const RADIAL_POSITIONS: ReadonlySet<string> = new Set([
	"top",
	"top-right",
	"right",
	"bottom-right",
	"bottom",
	"bottom-left",
	"left",
	"top-left",
]);

const TOPOLOGIES: ReadonlySet<string> = new Set(SUPPORTED_TOPOLOGIES);

function asString(value: unknown, path: string): string {
	if (typeof value !== "string" || value.length === 0) {
		throw new Error(`${path} must be a non-empty string (got ${typeof value})`);
	}
	return value;
}

function asOptionalString(value: unknown, path: string): string | undefined {
	if (value === undefined) return undefined;
	if (typeof value !== "string") {
		throw new Error(`${path} must be a string when present (got ${typeof value})`);
	}
	return value;
}

function asInt(value: unknown, path: string): number {
	if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
		throw new Error(`${path} must be a non-negative integer (got ${String(value)})`);
	}
	return value;
}

function asTone(value: unknown, path: string): FgraphTone | undefined {
	if (value === undefined) return undefined;
	if (typeof value !== "string" || !TONES.has(value)) {
		throw new Error(
			`${path} must be one of ${Array.from(TONES).join(", ")} (got ${String(value)})`,
		);
	}
	return value as FgraphTone;
}

function asShape(value: unknown, path: string): FgraphShape | undefined {
	if (value === undefined) return undefined;
	if (typeof value !== "string" || !SHAPES.has(value)) {
		throw new Error(
			`${path} must be one of ${Array.from(SHAPES).join(", ")} (got ${String(value)})`,
		);
	}
	return value as FgraphShape;
}

function asSemantic(value: unknown, path: string): FgraphSemantic | undefined {
	if (value === undefined) return undefined;
	if (typeof value !== "string" || !SEMANTICS.has(value)) {
		throw new Error(
			`${path} must be one of ${Array.from(SEMANTICS).join(", ")} (got ${String(value)})`,
		);
	}
	return value as FgraphSemantic;
}

function asEdgeStyle(value: unknown, path: string): FgraphEdgeStyle | undefined {
	if (value === undefined) return undefined;
	if (typeof value !== "string" || !EDGE_STYLES.has(value)) {
		throw new Error(
			`${path} must be one of ${Array.from(EDGE_STYLES).join(", ")} (got ${String(value)})`,
		);
	}
	return value as FgraphEdgeStyle;
}

/**
 * Validate an array of items, throw on bad shape, then call mapItem on each.
 * Items are narrowed to `object` so mappers can use Reflect.get directly.
 */
function asArray<T>(
	value: unknown,
	path: string,
	mapItem: (item: object, itemPath: string) => T,
	{ min, max }: { min?: number; max?: number } = {},
): T[] {
	if (!Array.isArray(value)) {
		throw new Error(`${path} must be an array (got ${typeof value})`);
	}
	if (min !== undefined && value.length < min) {
		throw new Error(`${path} must contain at least ${min} item(s); got ${value.length}`);
	}
	if (max !== undefined && value.length > max) {
		throw new Error(`${path} must contain at most ${max} item(s); got ${value.length}`);
	}
	return value.map((item, i) => {
		const itemPath = `${path}[${i}]`;
		if (typeof item !== "object" || item === null || Array.isArray(item)) {
			throw new Error(`${itemPath} must be an object`);
		}
		return mapItem(item, itemPath);
	});
}

function parseFgraphNode(value: object, path: string): FgraphNode {
	const node: FgraphNode = {
		name: asString(Reflect.get(value, "name"), `${path}.name`),
	};
	const sub = asOptionalString(Reflect.get(value, "sub"), `${path}.sub`);
	if (sub !== undefined) node.sub = sub;
	const subMuted = asOptionalString(Reflect.get(value, "subMuted"), `${path}.subMuted`);
	if (subMuted !== undefined) node.subMuted = subMuted;
	const tone = asTone(Reflect.get(value, "tone"), `${path}.tone`);
	if (tone !== undefined) node.tone = tone;
	const shape = asShape(Reflect.get(value, "shape"), `${path}.shape`);
	if (shape !== undefined) node.shape = shape;
	return node;
}

function parseFgraphEdge(value: object, path: string): FgraphEdge {
	const edge: FgraphEdge = {
		from: asInt(Reflect.get(value, "from"), `${path}.from`),
		to: asInt(Reflect.get(value, "to"), `${path}.to`),
	};
	const label = asOptionalString(Reflect.get(value, "label"), `${path}.label`);
	if (label !== undefined) edge.label = label;
	const semantic = asSemantic(Reflect.get(value, "semantic"), `${path}.semantic`);
	if (semantic !== undefined) edge.semantic = semantic;
	const style = asEdgeStyle(Reflect.get(value, "style"), `${path}.style`);
	if (style !== undefined) edge.style = style;
	const tone = asTone(Reflect.get(value, "tone"), `${path}.tone`);
	if (tone !== undefined) edge.tone = tone;
	return edge;
}

function parseSequenceContent(raw: object): SequenceContent {
	const participants = asArray(
		Reflect.get(raw, "participants"),
		"content.participants",
		(item, p) => {
			const participant: SequenceParticipant = {
				name: asString(Reflect.get(item, "name"), `${p}.name`),
			};
			const tone = asTone(Reflect.get(item, "tone"), `${p}.tone`);
			if (tone !== undefined) participant.tone = tone;
			const sub = asOptionalString(Reflect.get(item, "sub"), `${p}.sub`);
			if (sub !== undefined) participant.sub = sub;
			return participant;
		},
		{ min: 2, max: 6 },
	);

	const messages = asArray(
		Reflect.get(raw, "messages"),
		"content.messages",
		(item, p) => {
			const from = asInt(Reflect.get(item, "from"), `${p}.from`);
			const to = asInt(Reflect.get(item, "to"), `${p}.to`);
			if (from >= participants.length || to >= participants.length) {
				throw new Error(
					`${p} references participant index >= ${participants.length}; from=${from}, to=${to}`,
				);
			}
			if (from === to) {
				throw new Error(`${p} self-message (from===to===${from}) — not supported in slice 1`);
			}
			const msg: SequenceMessage = {
				from,
				to,
				label: asString(Reflect.get(item, "label"), `${p}.label`),
			};
			const kindRaw = Reflect.get(item, "kind");
			if (kindRaw !== undefined) {
				if (kindRaw !== "request" && kindRaw !== "return") {
					throw new Error(`${p}.kind must be "request" or "return" (got ${String(kindRaw)})`);
				}
				msg.kind = kindRaw;
			}
			const tone = asTone(Reflect.get(item, "tone"), `${p}.tone`);
			if (tone !== undefined) msg.tone = tone;
			return msg;
		},
		{ min: 1, max: 15 },
	);

	const result: SequenceContent = {
		topology: "sequence",
		participants,
		messages,
	};
	const legend = asOptionalString(Reflect.get(raw, "legend"), "content.legend");
	if (legend !== undefined) result.legend = legend;
	return result;
}

function parseLayeredContent(raw: object): LayeredContent {
	const layers = asArray(
		Reflect.get(raw, "layers"),
		"content.layers",
		(item, p) => {
			return {
				label: asString(Reflect.get(item, "label"), `${p}.label`),
				nodes: asArray(
					Reflect.get(item, "nodes"),
					`${p}.nodes`,
					(n, np) => parseFgraphNode(n, np),
					{ min: 1, max: 4 },
				),
			};
		},
		{ min: 2, max: 5 },
	);

	const edgesRaw = Reflect.get(raw, "edges");
	const edges =
		edgesRaw === undefined
			? undefined
			: asArray(edgesRaw, "content.edges", (item, p) => {
					const fromLayer = asInt(Reflect.get(item, "fromLayer"), `${p}.fromLayer`);
					const toLayer = asInt(Reflect.get(item, "toLayer"), `${p}.toLayer`);
					if (fromLayer >= layers.length || toLayer >= layers.length) {
						throw new Error(`${p} references layer index >= ${layers.length}`);
					}
					const edge: LayeredEdge = { fromLayer, toLayer };
					const semantic = asSemantic(Reflect.get(item, "semantic"), `${p}.semantic`);
					if (semantic !== undefined) edge.semantic = semantic;
					const style = asEdgeStyle(Reflect.get(item, "style"), `${p}.style`);
					if (style !== undefined) edge.style = style;
					const label = asOptionalString(Reflect.get(item, "label"), `${p}.label`);
					if (label !== undefined) edge.label = label;
					return edge;
				});

	const result: LayeredContent = { topology: "layered", layers };
	if (edges !== undefined) result.edges = edges;
	const legend = asOptionalString(Reflect.get(raw, "legend"), "content.legend");
	if (legend !== undefined) result.legend = legend;
	return result;
}

function parseLinearFlowContent(raw: object): LinearFlowContent {
	const stages = asArray(
		Reflect.get(raw, "stages"),
		"content.stages",
		(item, p) => parseFgraphNode(item, p),
		{ min: 2, max: 7 },
	);

	const edgesRaw = Reflect.get(raw, "edges");
	const edges =
		edgesRaw === undefined
			? undefined
			: asArray(edgesRaw, "content.edges", (item, p) => {
					const edge = parseFgraphEdge(item, p);
					if (edge.from >= stages.length || edge.to >= stages.length) {
						throw new Error(`${p} references stage index >= ${stages.length}`);
					}
					return edge;
				});

	const result: LinearFlowContent = { topology: "linear-flow", stages };
	if (edges !== undefined) result.edges = edges;
	const legend = asOptionalString(Reflect.get(raw, "legend"), "content.legend");
	if (legend !== undefined) result.legend = legend;
	return result;
}

function parseRadialHubContent(raw: object): RadialHubContent {
	const hubRaw = Reflect.get(raw, "hub");
	if (typeof hubRaw !== "object" || hubRaw === null) {
		throw new Error("content.hub is required and must be an object");
	}
	const hub = parseFgraphNode(hubRaw, "content.hub");

	const spokes = asArray(
		Reflect.get(raw, "spokes"),
		"content.spokes",
		(item, p) => {
			const node = parseFgraphNode(item, p);
			const positionRaw = Reflect.get(item, "position");
			if (typeof positionRaw !== "string" || !RADIAL_POSITIONS.has(positionRaw)) {
				throw new Error(
					`${p}.position is required; one of ${Array.from(RADIAL_POSITIONS).join(", ")}`,
				);
			}
			const spoke: RadialSpoke = { ...node, position: positionRaw as RadialPosition };
			const semantic = asSemantic(Reflect.get(item, "semantic"), `${p}.semantic`);
			if (semantic !== undefined) spoke.semantic = semantic;
			const direction = Reflect.get(item, "direction");
			if (direction !== undefined) {
				if (direction !== "in" && direction !== "out" && direction !== "both") {
					throw new Error(
						`${p}.direction must be "in" | "out" | "both" (got ${String(direction)})`,
					);
				}
				spoke.direction = direction;
			}
			const style = asEdgeStyle(Reflect.get(item, "style"), `${p}.style`);
			if (style !== undefined) spoke.style = style;
			return spoke;
		},
		{ min: 2, max: 8 },
	);

	// All 8 positions are unique anchor slots; reject duplicates so the
	// renderer never has two cards stacked at the same coordinate.
	const seen = new Set<string>();
	for (const spoke of spokes) {
		if (seen.has(spoke.position)) {
			throw new Error(`content.spokes: duplicate position "${spoke.position}"`);
		}
		seen.add(spoke.position);
	}

	const result: RadialHubContent = { topology: "radial-hub", hub, spokes };
	const legend = asOptionalString(Reflect.get(raw, "legend"), "content.legend");
	if (legend !== undefined) result.legend = legend;
	return result;
}

/**
 * Validate + normalize an untrusted `content` object from the PI tool param.
 * Throws Error with a precise path on any structural problem.
 */
export function parseFgraphContent(raw: unknown): FgraphContent {
	if (typeof raw !== "object" || raw === null) {
		throw new Error('type:"diagram" content must be a plain object describing an fgraph topology');
	}
	if (Array.isArray(raw)) {
		throw new Error('type:"diagram" content must be a plain object, not an array');
	}
	const obj = raw as object;
	const topology = Reflect.get(obj, "topology");
	if (typeof topology !== "string" || !TOPOLOGIES.has(topology)) {
		throw new Error(
			`content.topology must be one of: ${SUPPORTED_TOPOLOGIES.join(
				", ",
			)} (got ${String(topology)}). The other 11 fgraph topologies land in v0.2.x patches; use the lumen-diagram skill directly until then.`,
		);
	}
	switch (topology as SupportedTopology) {
		case "sequence":
			return parseSequenceContent(obj);
		case "layered":
			return parseLayeredContent(obj);
		case "linear-flow":
			return parseLinearFlowContent(obj);
		case "radial-hub":
			return parseRadialHubContent(obj);
	}
}
