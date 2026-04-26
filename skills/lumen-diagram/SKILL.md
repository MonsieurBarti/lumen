---
name: lumen-diagram
description: Generate single-file HTML diagram (architecture, flow, sequence, ER, state, gantt, network, dependency graph, AI pattern). Invoke when user asks to draw, diagram, visualize, sketch architecture, show flow, or describes system / pipeline / topology to illustrate.
version: 0.1.4 # x-release-please-version
---

# lumen-diagram

Single-file HTML diagram via `foreignObject` + CSS flexbox in 0–100 coordinate space. Offline-safe (`file://`). No JS at runtime.

**Tier:** capability (atomic) — does not invoke other lumen skills. Composites and playbooks may invoke it.

## When to invoke

Triggers: `draw`, `diagram`, `visualize`, `sketch`, `map`, `show the flow`, `architecture of X`, `sequence of Y`, `state machine`, `network topology`, `ER diagram`, `RAG pipeline`, `multi-agent`, `tool-call flow`, `dependency graph`.

## Pipeline

1. **Pick topology** — read `templates/<topology>.html` (15 ship in this skill, see table below). The HTML is the structural skeleton; you fill in nodes + edges.
2. **Set node coordinates** in 0–100 space via CSS custom props on each node: `style="--x:20; --y:30; --w:18; --h:12"`. CSS does the layout math; LLM does not.
3. **Pick node shape** per semantic class (table 2 below).
4. **Pick edge class** per semantic role (table 3 below).
5. **Inline only the CSS subset your topology uses** into a `<style>` block — never the whole 1300-line `templates/fgraph-base.css`. Each `examples/*.html` shows the right subset for its topology (typically 60–120 lines: container + chosen primitives + arrow markers). Inlining the full base would 10× the output size for no semantic gain. Keep the file single, offline-safe.

## Topology selection (1)

| Pattern | Template |
|---|---|
| hub-spoke, message bus, central broker | `radial-hub.html` |
| peer cluster, no center | `radial-ring.html` |
| 2–4 stage pipeline | `linear-flow.html` |
| lanes × rows pipeline | `lane-swim.html` |
| 3–4 tier stack | `layered.html` |
| multi-tier deployment | `deployment-tiers.html` |
| cross-host deployment | `machine-clusters.html` |
| API / message exchange | `sequence.html` |
| FSM, state machine | `state.html` |
| schedule, roadmap, timeline bars | `gantt.html` |
| composition, proportion | `pie.html` |
| relational schema | `er.html` |
| issue / dependency DAG | `dep-graph.html` |
| dual-cluster comparison | `dual-cluster.html` |
| ≥15 components, full-system | `system-architecture.html` |

For RAG / Mem0 / Multi-Agent / Tool-Call / Agent-Memory: compose existing topologies per `templates/ai-patterns.md` recipes (lifted from fireworks-tech-graph).

## Node shape vocabulary (2)

| CSS class | Semantic |
|---|---|
| `.cylinder` | database, store, persistent state |
| `.hexagon` | agent, worker, processor |
| `.pill` | message broker, bus, queue |
| `.folded` | file, config, document |
| `.diamond` | decision gate |
| `.circle` | event, trigger |
| (default `rect`) | service, microservice, generic component |

## Edge semantics (3)

| CSS class | Color | Use |
|---|---|---|
| `.data` | purple | payloads, results |
| `.control` | accent | invocation, routing |
| `.write` | green dashed | writes to store |
| `.feedback` | amber | reward, loss, retry signal |
| `.async` | muted dashed | pub/sub, queues |
| `.thick` | (any) | critical path; one per diagram |

## Layout rules (lift verbatim from roxabi)

- R1 even stride between sibling nodes
- R2 ≥2% gap between adjacent nodes
- R3 ≥2% row clearance
- R4 arrows straight (no diagonal through nodes)
- R5 edge color matches semantic class
- R6 solid component fills cover edges (z-order: arrows first in DOM, nodes last)
- R7 ≤20-char node labels; longer goes in `title` tooltip. Sequence message labels (`.fg-seq-msg-lbl`) are exempt — call signatures and return shapes commonly run 30–50 chars and read fine on the wire.

## Output

Single HTML file. The CSS subset of `templates/fgraph-base.css` your topology uses is inlined in `<style>` (see Pipeline step 5). SVG inlined. No external deps. Opens via `file://`.

## Aesthetics

5 ship in `skills/_shared/aesthetics/` (promoted from `templates/aesthetics/` in v0.2 once chart + guide + slides + gallery started consuming them). Pick one and inline it into the output `<style>` block AFTER `fgraph-base.css` (it overrides tokens).

| File | Identity |
|---|---|
| `dark-professional.css` (default) | semantic palette (cyan=frontend, emerald=backend, violet=database, amber=cloud, rose=security); JetBrains Mono |
| `editorial.css` | warm technical document; serif feel |
| `blueprint.css` | clean technical, monospace |
| `terminal.css` | retro CLI, high contrast |
| `lyra.css` | warm amber, narrative tone |

Each file defines `[data-theme="dark"]` and `[data-theme="light"]` tokens. Set `data-theme` on `<html>` or `<body>` to switch.

## Examples

10 ship in `examples/`. Each demonstrates one topology:

| File | Topology | Source |
|---|---|---|
| `web-app.html`, `microservices.html`, `aws-serverless.html` | various | architecture-diagram-generator |
| `dep-graph.html` | dep-graph | roxabi |
| `er-schema.html` | er | roxabi |
| `gantt-roadmap.html` | gantt | roxabi |
| `pie-composition.html` | pie | roxabi |
| `sequence-api.html` | sequence | roxabi |
| `state-machine.html` | state | roxabi |
| `system-architecture.html` | system-architecture | roxabi |

Open any in a browser. Use the closest-match as a starting point when authoring a new diagram.

## PI extension route (v0.2)

The `lumen-generate_visual` PI tool wires `type: "diagram"` for **4 of the 15 topologies**: `sequence`, `layered`, `linear-flow`, `radial-hub` — these cover every recipe in `templates/ai-patterns.md` (RAG, Agentic RAG, Mem0, Multi-Agent). The other 11 topologies remain LLM-authored via this skill's pipeline; they land as patch-series extensions.

**Coordinate philosophy for the PI route**: callers describe topology semantically (lane indices, layer indices, compass positions, stage chains) and the renderer computes absolute `--x/--y`. Free-form topologies (`system-architecture`, `dual-cluster`) keep the LLM-authored path because they genuinely need pixel coords.

**Call shape:**

```js
generateVisual({
  type: "diagram",
  title: "RAG pipeline",
  aesthetic: "dark-professional",  // any of the 5 fgraph aesthetics
  content: {
    topology: "linear-flow",
    stages: [
      { name: "Query" },
      { name: "Embed", shape: "hexagon", tone: "cyan" },
      { name: "VectorSearch", shape: "cylinder", tone: "purple" },
      { name: "LLM", shape: "hexagon", tone: "amber" },
      { name: "Response" },
    ],
    edges: [{ from: 1, to: 2, semantic: "async", label: "embedding" }],
  },
});
```

Full `FgraphContent` shape and per-topology field requirements: `src/templates/diagram/schemas.ts`.

**Library exports** (for direct programmatic use without the PI tool):
- `generateDiagramTemplate(input)` — returns the single-file HTML string
- `parseFgraphContent(unknown)` — schema validator with precise error paths
- `generateArchitectureTemplate(...)` — visual-explainer text-card layout (separate from fgraph)

## Sources

- `roxabi-forge/plugins/forge/references/graph-templates/` (MIT) → 15 templates + 7 examples + `fgraph-base.css`
- `roxabi-forge/plugins/forge/references/aesthetics/` (MIT) → 4 aesthetics
- `architecture-diagram-generator` (MIT) → 3 examples + semantic palette behind `dark-professional.css`
- `fireworks-tech-graph` (MIT) → AI pattern recipes paraphrased into `templates/ai-patterns.md`
- `gmdiagram/gm-architecture` (MIT) → JSON schemas (land in `_shared/schemas/diagram/` when type: "diagram" PI route is wired)
