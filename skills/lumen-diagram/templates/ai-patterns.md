# AI pattern recipes

Compose existing fgraph topologies into the canonical AI-system patterns. Lifted from [yizhiyanhua-ai/fireworks-tech-graph](https://github.com/yizhiyanhua-ai/fireworks-tech-graph) (MIT) prompt recipes; restated here so Claude can author the HTML directly without a separate template per pattern.

For each recipe: pick the listed topology, place the listed nodes at the listed coordinates, draw the listed edges with the listed semantic class.

## RAG (Retrieval-Augmented Generation)

**Topology:** `linear-flow.html`

**Nodes (left → right):** `Query` → `Embed` (hexagon, agent) → `VectorSearch` (cylinder, store) → `Retrieve` → `LLM` (hexagon) → `Response`

**Edges:**
- All hops: `.data` (purple) for payload flow
- `Embed → VectorSearch`: also `.async` (dashed) to signal embedding is non-blocking when batched

## Agentic RAG

**Topology:** `radial-hub.html` with linear-flow inset

**Center (hub):** `Agent` (hexagon)

**Spokes:** `Tool: Search`, `Tool: Calc`, `Tool: Code`, `Memory` (cylinder), `LLM`

**Edges:**
- Agent → tools: `.control` (accent)
- Tools → Agent (return): `.data` (purple)
- Agent ↻ LLM: `.thick` for reasoning loop

## Mem0 (memory architecture)

**Topology:** `layered.html` (3 tiers)

**Tier 1 (top, input):** `Input` → `Memory Manager` (hexagon)

**Tier 2 (middle, stores):** `VectorDB` (cylinder), `GraphDB` (cylinder)

**Tier 3 (bottom, output):** `Context` → `LLM`

**Edges:**
- Input → Manager → stores: `.write` (green dashed) into stores
- Stores → Context: `.data` (purple) read out
- Context → LLM: `.thick` (primary path)

## Multi-agent orchestration

**Topology:** `radial-hub.html`

**Center:** `Orchestrator` (pill, broker)

**Spokes:** `Agent A`, `Agent B`, `Agent C`, …, `Aggregator`

**Edges:**
- Orchestrator → Agent N: `.control` (accent), `.async` (dashed) for parallel dispatch
- Agent N → Aggregator: `.data` (purple)
- Aggregator → output: `.thick`

## Tool-call loop

**Topology:** `state.html` (FSM)

**States:** `LLM` → `Tool Selector` (diamond) → `Execution` (hexagon) → `Parser` → back to `LLM` (loop)

**Edges:**
- All transitions: `.control` (accent)
- Self-loop on LLM (when no tool needed): `.feedback` (amber)
- Termination edge to `Done`: `.thick`

## Agent memory types

**Topology:** `layered.html` (5 tiers, top → bottom)

**Tier order:** `Sensory` → `Working` → `Episodic` → `Semantic` → `Procedural`

**Edges:**
- Top-down: `.data` (purple) for memory promotion
- Bottom-up: `.feedback` (amber) for retrieval bias signals
- Within-tier `.async` for refresh

---

When in doubt, prefer the SIMPLER topology. A `linear-flow` of 5 nodes communicates a RAG pipeline more clearly than a `system-architecture` of 15. Apply layout rules R1–R7 (see SKILL.md) regardless of topology.
