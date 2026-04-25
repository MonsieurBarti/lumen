# fireworks-tech-graph

Source: https://github.com/yizhiyanhua-ai/fireworks-tech-graph

## What it does

**fireworks-tech-graph** is a natural-language-to-SVG diagram generator designed as a Claude Code skill. Users describe systems, workflows, or architectures in plain English or Chinese, and the skill generates publication-quality technical diagrams in multiple visual styles, then exports high-resolution PNGs. The project takes the stance that diagram authoring should be conversational, not DSL-based or GUI-driven. Under the hood, it pairs a pre-built Python renderer (which handles all SVG generation, layout, styling, and PNG export) with Claude's natural language understanding to extract diagram semantics from user descriptions. The skill auto-triggers on phrases like "generate diagram", "draw flowchart", "visualize architecture", and supports 7 distinct visual styles optimized for different contexts (blogs, GitHub README, presentations, documentation, brand consistency). It also bundles deep knowledge of AI/Agent domain patterns (RAG, Agentic Search, Mem0, Multi-Agent, Tool Call flows) and full UML support (14 types).

## Interface (how a user invokes it)

**Claude Code auto-trigger:**
The skill auto-activates on user queries containing trigger phrases:
- "generate diagram", "draw diagram", "create chart", "visualize"
- "architecture diagram", "flowchart", "sequence diagram", "data flow"
- Any system/workflow description the user wants illustrated

**Installation:**

```bash
npx skills add yizhiyanhua-ai/fireworks-tech-graph
```

**Usage examples (from README):**

```
Draw a RAG pipeline flowchart
Generate an Agentic Search architecture diagram
Draw a microservices architecture diagram, style 2 (dark terminal)
Draw a multi-agent collaboration diagram --style glassmorphism
Generate a Mem0 architecture diagram, output to ~/Desktop/
```

**Interface type:**
This is a skill-based interface in the Claude Code system. No CLI commands, no MCP tools exposed directly. The user interface is conversational text prompts. The skill's `SKILL.md` file declares the trigger phrases and expected behavior for the harness. The associated `agents/openai.yaml` metadata file configures agent display name and system prompt.

**Output:**
Files written to disk:
- `<diagram-name>.svg` (editable SVG)
- `<diagram-name>.png` (1920px width, via `rsvg-convert`)

Users can specify output path via `--output /path/` or `输出到 /path/` (Chinese).

## Capabilities (extractable as skills)

1. **Architecture diagram generation** — horizontal-layered system architecture with services, gateways, storage; swim lanes, semantic shapes, labeled data flows.
2. **Flowchart / process flow generation** — sequential decision and process diagrams (diamonds = decisions, rectangles = steps), top-to-bottom flow with grid-snapped node alignment.
3. **UML class diagram generation** — static structure diagrams: 3-compartment class boxes, attributes, methods, inheritance.
4. **Sequence diagram generation** — vertical lifelines, horizontal messages, activation boxes; time-ordered API call chains.
5. **ER diagram generation** — entities, relationships (cardinality), database schema visualization.
6. **Data flow diagram generation** — labeled arrows encoding data types, read/write semantics, transformation steps.
7. **Agent / memory architecture diagram generation** — specialized 5-layer model (input, core, memory, tool, output) with loop arcs for iterative reasoning.
8. **Mem0 memory layer diagram generation** — separated read/write paths, stacked memory tiers, operation labels.
9. **Multi-agent collaboration diagram generation** — orchestrator dispatching to sub-agents, hexagon agents, delegation arrows, aggregator node.
10. **Comparison / feature matrix generation** — checked/unchecked cells, row/column headers, tinted backgrounds.
11. **Mind map / concept map generation** — radial layout from central concept; bezier curves; radial distribution.
12. **Style adaptation engine** — apply one of 7 visual styles to any diagram type (Flat Icon, Dark Terminal, Blueprint, Notion Clean, Glassmorphism, Claude Official, OpenAI Official).
13. **SVG validation** — syntax, tag balance, marker references, attribute completeness.
14. **PNG export via rsvg-convert** — high-resolution PNG export (1920px or user-specified width).

## Key techniques / prompts / algorithms

### Template-driven rendering (`generate-from-template.py`, 1556 lines)
- Not a freeform SVG generator; instead, uses pre-built templates per diagram type and a deterministic Python engine to:
  1. Normalize node positions (x, y, width, height)
  2. Apply style profiles (colors, fonts, effects) from a hardcoded `STYLE_PROFILES` dict
  3. Route arrows orthogonally (L-shaped) with obstacle avoidance
  4. Place arrow labels on transparent background rects
  5. Render nodes with semantic shapes (cylinder = database, hexagon = agent, diamond = decision)
  6. Compose SVG from parts (defs, style, background, sections, nodes, arrows, labels, legend, footer)

### Shape vocabulary (from SKILL.md and icons.md)

Semantic shapes encode meaning consistently:
- **LLM / Model** = rounded rect with double border + ⚡ spark icon
- **Agent / Orchestrator** = hexagon (signals "active controller")
- **Memory (short-term)** = dashed-border rounded rect (ephemeral)
- **Memory (long-term)** = cylinder (persistent, database-like)
- **Vector Store** = cylinder with 3 inner rings (visual distinction from generic DB)
- **Graph DB** = 3 overlapping circles (cluster visual)
- **Tool / Function** = rect with ⚙ gear icon
- **API / Gateway** = single-border hexagon
- **User / Human** = circle + body path (stick figure)
- **Queue / Stream** = horizontal tube/pipe
- **File / Document** = folded-corner rectangle
- **Decision** = diamond (flowchart-only)

### Arrow semantics

Flow types encode meaning via color + dash pattern:
- **Primary data flow** = blue, 2px solid (main request/response)
- **Control / trigger** = orange, 1.5px solid (system A triggers B)
- **Memory read** = green, 1.5px solid (retrieve from store)
- **Memory write** = green, 1.5px, `5,3` dashes (write operation)
- **Async / event** = gray, 1.5px, `4,2` dashes (non-blocking)
- **Embedding / transform** = purple, 1px solid (data transformation)
- **Feedback / loop** = purple, 1.5px curved (iterative reasoning)

Always includes a legend when 2+ arrow types are used.

### Style profiles (7 hardcoded dicts in Python)

Each style (1–7) has a complete profile:
- Font family, background color, shadow treatment
- Node fill/stroke colors, radius
- Section (container) styles and label colors
- Arrow color palette (7 flow types per style)
- Text primary/secondary/muted colors
- Title alignment, divider style, legend positioning

E.g., Style 1 (Flat Icon):

```python
{
  "background": "#ffffff",
  "node_fill": "#ffffff",
  "node_stroke": "#d1d5db",
  "arrow_colors": {
    "control": "#7c3aed",
    "write": "#10b981",
    "read": "#2563eb",
    "data": "#f97316",
    "async": "#7c3aed",
    "feedback": "#ef4444",
    "neutral": "#6b7280"
  }
}
```

### Workflow (10 steps from SKILL.md)

1. Classify diagram type (architecture, flowchart, sequence, agent, etc.)
2. Extract structure from natural language (identify layers, nodes, edges, semantic groups)
3. Plan layout (apply diagram-type-specific rules)
4. Load style reference (fetch color tokens, SVG patterns from `references/style-N-*.md`)
5. Map nodes to shapes (use Shape Vocabulary)
6. Check icon needs (load product icons from `references/icons.md`)
7. Emit JSON payload (nodes with x, y, width, height, kind, label, fill, stroke; arrows with source, target, flow, label)
8. Invoke render engine (`python3 generate-from-template.py <type> <output> <json>`)
9. Validate SVG (`rsvg-convert file.svg -o /dev/null`)
10. Export PNG (`rsvg-convert -w 1920 file.svg -o file.png`)

### Layout rules and validation
- Spacing: 80px horizontal, 120px vertical between same-layer nodes
- Canvas margins: 40px minimum
- Grid snap: 120px intervals
- **Arrow label backgrounds (CRITICAL):** must have `<rect fill="canvas_bg" opacity="0.95"/>` with padding
- **Line overlap prevention:** jump-over arcs (5px radius) for crossing arrows
- **Text overflow:** estimate max 7px per character; validate `text.length * 7px ≤ shape_width - 16px`

### JSON input format (fixture example: `mem0-style1.json`)

```json
{
  "template_type": "memory",
  "style": 1,
  "width": 1080,
  "height": 760,
  "title": "Mem0 Memory Architecture",
  "containers": [ /* swim lanes */ ],
  "nodes": [
    {
      "id": "user",
      "kind": "user_avatar",
      "x": 54, "y": 108, "width": 90, "height": 46,
      "label": "User",
      "fill": "#eff6ff",
      "stroke": "#2563eb"
    }
  ],
  "arrows": [
    {
      "source": "user",
      "target": "app",
      "source_port": "right",
      "target_port": "left",
      "flow": "read",
      "label": "query"
    }
  ],
  "legend": [ /* arrow type legend */ ]
}
```

### Prompt recipes (regression-tested)

**Style 1 — Flat Icon:**

```
Draw a Mem0 memory architecture diagram in style 1 (Flat Icon).
Use four horizontal sections: Input Layer, Memory Manager, Storage Layer, Output / Retrieval.
Include User, AI App / Agent, LLM, mem0 Client, Memory Manager, Vector Store, Graph DB, Key-Value Store, History Store, Context Builder, Ranked Results, Personalized Response.
Use semantic arrows for read, write, control, and data flow. Keep the layout clean and product-doc friendly.
```

**Style 2 — Dark Terminal:**

```
Draw a tool call flow diagram in style 2 (Dark Terminal).
Show User query, Retrieve chunks, Generate answer, Knowledge base, Agent, Terminal, Source documents, and Grounded answer.
Use terminal chrome, neon accents, monospace typography, and semantic arrows for retrieval, synthesis, and embedding update.
```

### Built-in domain patterns

```
RAG Pipeline        → Query → Embed → VectorSearch → Retrieve → LLM → Response
Agentic RAG         → adds Agent loop + Tool use
Agentic Search      → Query → Planner → [Search/Calc/Code] → Synthesizer
Mem0 Memory Layer   → Input → Memory Manager → [VectorDB + GraphDB] → Context
Agent Memory Types  → Sensory → Working → Episodic → Semantic → Procedural
Multi-Agent         → Orchestrator → [SubAgent×N] → Aggregator → Output
Tool Call Flow      → LLM → Tool Selector → Execution → Parser → LLM (loop)
```

## Runtime stack

**Language:** Python 3 (1556-line generator engine) + Bash (helper scripts) + SVG/XML output.

**Dependencies:**
- `librsvg` (macOS: `brew install librsvg`, Ubuntu: `apt install librsvg2-bin`) — `rsvg-convert` tool for PNG export
- Python standard library: `json`, `math`, `os`, `sys`, `dataclasses`, `typing`, `xml.sax.saxutils`

**Invocation:**
1. User triggers skill in Claude Code via natural language
2. Claude Code routes to `SKILL.md` skill definition
3. Claude processes the request, extracts diagram semantics, generates JSON payload
4. Claude invokes: `python3 /path/to/generate-from-template.py <type> <output.svg> '<json>'`
5. Generator creates SVG, writes to disk
6. Claude validates: `rsvg-convert output.svg -o /dev/null 2>&1`
7. Claude exports PNG: `rsvg-convert -w 1920 output.svg -o output.png`
8. Claude reports output file paths to user

**File convention:**
- SVG output: `[diagram-name].svg` (1080–1200px viewBox width, varies by type)
- PNG output: `[diagram-name].png` (1920px width, 2x retina)

## Reusable artifacts (prompts, templates, skill definitions)

### Skill definition (SKILL.md front matter)

```yaml
---
name: fireworks-tech-graph
description: >-
  Use when the user wants to create any technical diagram - architecture, data
  flow, flowchart, sequence, agent/memory, or concept map - and export as
  SVG+PNG. Trigger on: "generate diagram", "draw diagram", "visualize", etc.
---
```

### SVG template skeleton (from `templates/architecture.svg`)

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 700">
  <defs>
    <!-- markers, gradients, filters -->
  </defs>
  <style>
    text { font-family: ...; }
  </style>
  <rect width="960" height="700" fill="#ffffff"/>
  <text x="480" y="60" class="title">{{TITLE}}</text>
  <!-- NODES -->
  <!-- ARROWS -->
  <!-- LEGEND -->
</svg>
```

### Diagram type checklist (14 types)

- Architecture: horizontal layers
- Data Flow: label every arrow with data type
- Flowchart: diamond = decision, top-to-bottom
- Agent Architecture: 5-layer model (Input/Agent/Memory/Tool/Output)
- Memory Architecture: separate read/write paths
- Sequence: lifelines + messages top-to-bottom
- Comparison Matrix: column = system, row = attribute
- Timeline: x-axis = time, bars with labels
- Mind Map: central node + radial branches (bezier curves)
- UML Class: 3-compartment boxes, visibility notation
- UML Use Case: actors + ellipses + system boundary
- UML State Machine: states + transitions + guards/actions
- UML ER Diagram: entities, relationships, cardinality
- Network Topology: tiered devices, IP labels

### Shape vocabulary reference (`icons.md`)

50+ inline SVG shapes + 40+ product icons with brand colors:
- Semantic shapes (LLM, Agent, Memory, Vector Store, etc.)
- UML shapes (class box, use case ellipse, decision diamond)
- Product icons: OpenAI, Anthropic, Pinecone, Weaviate, Kafka, PostgreSQL, AWS, GCP, Azure, Datadog, etc.

### Style reference files (7 markdown files, ~100 lines each)

Each `references/style-N-*.md` contains:
- Exact hex color palette
- Font family declaration
- SVG snippets (markers, gradients, shadow filters)
- Box/shape SVG templates
- Arrow definitions
- Legend template
- Typography scale

### Arrow semantics reference (SKILL.md)

| Flow Type | Color | Stroke | Dash | Meaning |
| --- | --- | --- | --- | --- |
| Primary data | blue | 2px solid | — | Request/response |
| Control / trigger | orange | 1.5px solid | — | Triggering |
| Memory read | green | 1.5px solid | — | Retrieval |
| Memory write | green | 1.5px | `5,3` | Writing |
| Async / event | gray | 1.5px | `4,2` | Non-blocking |
| Embedding / transform | purple | 1px solid | — | Data xform |
| Feedback / loop | purple | 1.5px curved | — | Iterative |

### Fixture JSON examples (7 test cases)

- `mem0-style1.json` — Memory architecture, Flat Icon style
- `tool-call-style2.json` — Tool Call Flow, Dark Terminal style
- `multiagent-style5.json` — Multi-Agent, Glassmorphism style
- `agent-memory-types-style4.json` — Memory types, Notion Clean style
- `microservices-style3.json` — Microservices, Blueprint style
- `system-architecture-style6.json` — System Architecture, Claude Official style
- `api-flow-style7.json` — API Integration, OpenAI Official style

## Claude Code nativeness

**Yes, fully Claude-native.**

**Skill definition:**
- Registered as a Claude Code skill (not an agent, hook, or MCP tool)
- Declared in `SKILL.md` with front-matter metadata (name, description, trigger phrases)
- Trigger phrases enable auto-activation on user language patterns
- Related `agents/openai.yaml` provides agent interface metadata

**Skill metadata (`agents/openai.yaml`):**

```yaml
interface:
  display_name: "Fireworks Tech Graph"
  short_description: "Generate polished SVG and PNG technical diagrams"
  default_prompt: "Turn the user's system or workflow description into a polished SVG diagram and export a PNG."
```

**No slash commands:** This project does NOT use `/command` structure. It's a passive skill that responds to natural language triggers, not active CLI-style invocation.

**No hooks or agents:** No lifecycle hooks (setup, teardown, before, after, error). No managed agents. No secondary agent spinning. Pure single-turn skill execution.

**Installation method:** Native Claude Code skill distribution (`npx skills add yizhiyanhua-ai/fireworks-tech-graph`).

**Integration points:**
- Relies on `rsvg-convert` CLI tool (external, not bundled)
- Reads/writes files to user's working directory
- No MCP tools, no external API calls (all processing is local)

## Recommendation: skills to extract for the-forge-flow

### Tier 1 (highest reuse value)

1. **`/generate-architecture-diagram`** — convert service descriptions into layered architecture SVGs. Common pattern in tech documentation.
2. **`/generate-sequence-diagram`** — time-ordered API/message flow. Useful for API docs, OAuth flows, distributed system traces.
3. **`/generate-agent-architecture`** — specialized LLM agent visualization (5-layer model). High value if the-forge-flow is agent-centric.
4. **`/generate-memory-architecture`** — Mem0-style memory tier visualization. Specialized, powerful for AI projects.

### Tier 2 (moderate reuse)

5. **`/generate-uml-class-diagram`** — backend system design, API contract documentation.
6. **`/generate-erd`** — database schema documentation.
7. **`/generate-comparison-matrix`** — feature parity docs, tech decision matrices.
8. **`/apply-diagram-style`** — re-render any diagram in a different visual style (1–7). Multiplier on all diagram skills.

### Tier 3 (enabling utilities)

9. **`/validate-svg`** and **`/export-png`** — standalone SVG quality assurance, batch PNG export.
10. **`/diagram-from-json`** — programmatic diagram generation (APIs, config files).

### Design recommendation: layered

- **Option A (modular):** extract each diagram type as a separate skill. Pros: granular, discoverable. Cons: duplication of style logic.
- **Option B (unified):** single `/generate-diagram` mega-skill that dispatches by type. Pros: shared style engine. Cons: less discoverable.
- **Option C (layered, recommended):** wrap `generate-from-template.py` as a low-level `/diagram-render` skill that other high-level skills call. Decouples description parsing (Claude's job) from rendering (deterministic Python). Then create `*-from-description` skills for each major diagram type (agent, sequence, architecture, erd, flowchart) that extract intent, build JSON, and call the renderer.

## Summary

**fireworks-tech-graph** is a Claude Code skill for generating publication-ready technical diagrams from natural language descriptions. It transforms user text into SVG diagrams (then PNG) using a deterministic Python template engine (1556 lines) paired with 7 hardcoded visual styles and semantic shape/arrow vocabularies.

Key strengths: 14 diagram types including full UML; 7 visual styles; AI/Agent domain expertise (RAG, Agentic Search, Mem0, Multi-Agent patterns built-in); semantic meaning encoding via shapes and arrow flow types; regression-tested prompts and fixtures.

Runtime: Python 3 + librsvg (rsvg-convert for PNG export). No external APIs, file-based I/O.

For the-forge-flow, the highest-value extractions are: agent architecture diagram generation, sequence diagram generation, architecture diagram generation, and a unified style-adaptation layer.
