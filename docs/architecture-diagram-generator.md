# architecture-diagram-generator

Source: https://github.com/Cocoon-AI/architecture-diagram-generator

## What it does

The Architecture Diagram Generator is a Claude-native skill that converts plain-text descriptions of system architectures into professional, interactive SVG-based HTML diagrams. Users describe their system architecture in natural language, and Claude uses this skill to render a dark-themed, semantic-color-coded diagram as a single self-contained HTML file. The project is designed specifically for Claude.ai integration, targeting Pro, Max, Team, and Enterprise users.

## Interface (how a user invokes it)

**Installation:**
- Download `architecture-diagram.zip` from repository
- Upload to Claude.ai Settings → Capabilities → Skills
- Toggle on

**User invocation pattern:**
```
Use your architecture diagram skill to create an architecture diagram from this description:

[USER PASTES ARCHITECTURE DESCRIPTION HERE]
```

The interface is conversation-based — users ask Claude directly within the chat, iterating with natural language prompts like "Please update XYZ" or "Fix issue with...".

**Alternative installations:**
- Claude Code CLI: `unzip architecture-diagram.zip -d ~/.claude/skills/`
- Claude.ai Projects: Upload to project knowledge
- Manual: Access `SKILL.md` and `template.html` directly

## Capabilities (extractable as skills)

1. **Architecture Diagram Generation** — Convert text descriptions → SVG diagrams with semantic coloring.
2. **Multi-component Visualization** — Display frontend, backend, database, cloud, security, message bus components.
3. **Cloud Infrastructure Mapping** — AWS-specific styling for Lambda, API Gateway, DynamoDB, S3, CloudFront, regions.
4. **Microservices Topology** — Support for Kubernetes clusters, API gateways, multiple service types.
5. **Security Group Visualization** — Render dashed boundaries with rose color for security groups.
6. **Data Flow Diagramming** — Arrows with labels showing REST API, GraphQL, message queues, data flow.
7. **Legend Generation** — Auto-populate semantic legend below components.
8. **Responsive HTML Export** — Generate single-file output (no dependencies).
9. **Real-time Iteration** — Update diagrams via follow-up chat prompts.
10. **Diagram Styling Customization** — Colors, spacing, layout adjustment via natural language.

## Key techniques / prompts / algorithms

### SVG rendering approach
- **Z-order management:** Arrows rendered first in document order, then components rendered on top to mask arrows cleanly.
- **Masking strategy:** For semi-transparent fills, uses opaque background rect (`#0f172a`) under colored rect to prevent arrow bleed-through.
- **Grid background:** 40px pattern with `#1e293b` stroke for technical aesthetic.

### Color semantics

```
Frontend:        rgba(8, 51, 68, 0.4) fill, #22d3ee (cyan-400) stroke
Backend:         rgba(6, 78, 59, 0.4) fill, #34d399 (emerald-400) stroke
Database:        rgba(76, 29, 149, 0.4) fill, #a78bfa (violet-400) stroke
AWS/Cloud:       rgba(120, 53, 15, 0.3) fill, #fbbf24 (amber-400) stroke
Security:        rgba(136, 19, 55, 0.4) fill, #fb7185 (rose-400) stroke
Message Bus:     rgba(251, 146, 60, 0.3) fill, #fb923c (orange-400) stroke
External/Generic: rgba(30, 41, 59, 0.5) fill, #94a3b8 (slate-400) stroke
```

### Spacing rules (critical for overlap prevention)
- Standard component height: 60–120px
- Minimum vertical gap: 40px
- Message buses placed mid-gap (20px into gap)
- Region/cluster boundaries: `stroke-dasharray="8,4"`, extend 20px below all contained elements

### Layout conventions
- **Header:** Title + animated pulse dot (2s cycle) + subtitle
- **Diagram container:** Rounded border card (`1rem` radius, `1px border #1e293b`)
- **SVG viewBox:** Default 1000x680px, scales responsively
- **Info cards:** 3-column grid of summary cards with color-coded dots
- **Footer:** Minimal metadata line

### Component box pattern

```svg
<!-- Opaque mask -->
<rect x="X" y="Y" width="W" height="H" rx="6" fill="#0f172a"/>
<!-- Colored overlay -->
<rect x="X" y="Y" width="W" height="H" rx="6" fill="FILL_RGBA" stroke="STROKE_COLOR" stroke-width="1.5"/>
<!-- Title -->
<text x="CENTER_X" y="Y+20" fill="white" font-size="11" font-weight="600" text-anchor="middle">LABEL</text>
<!-- Subtitle(s) -->
<text x="CENTER_X" y="Y+36" fill="#94a3b8" font-size="9" text-anchor="middle">sublabel</text>
```

### Arrow / connection rendering
- Standard: `<line>` with `marker-end="url(#arrowhead)"`
- Dashed (auth flows): `stroke-dasharray="5,5"` with rose color
- Curved paths: Bezier `<path>` for complex flows
- Labels: Positioned 10px above/beside midpoint, `font-size="9"`, slate color

### Arrowhead definition

```svg
<marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
  <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
</marker>
```

### Typography stack
- Font: JetBrains Mono (Google Fonts, weights 400–700)
- Sizes: 12px component names, 11px titles, 9px subtitles, 8px annotations, 7px tiny labels

## Runtime stack

**No runtime required** — entirely Claude-powered prompt execution.

**Project structure:**
- `architecture-diagram/` — Skill root directory
  - `SKILL.md` — Skill definition + comprehensive design guidelines
  - `assets/template.html` — HTML/CSS/SVG template Claude populates
- `examples/` — Pre-generated example diagrams
  - `web-app.html`, `aws-serverless.html`, `microservices.html` — Full examples

**Distribution:**
- Packaged as `architecture-diagram.zip` for Claude.ai upload
- No dependencies (pure HTML/CSS/SVG)
- No JavaScript required
- Renders in any modern browser (ES6 CSS animations only)

**Language:**
- Template: HTML5 + embedded CSS3 + inline SVG
- Skill instructions: Markdown (SKILL.md)
- Claude interaction: Natural language prompts

## Reusable artifacts (prompts, templates, skill definitions)

### Template structure (assets/template.html)
Complete 320-line self-contained template with:
- Embedded CSS (no external except Google Fonts)
- SVG defs with marker and grid pattern
- Component examples (Frontend, Backend, Database, AWS, Security)
- Arrow examples (straight, dashed, curved)
- Legend section
- Info cards section
- Fully responsive structure

### Color palette table

| Component Type | Fill (rgba) | Stroke |
| --- | --- | --- |
| Frontend | `rgba(8, 51, 68, 0.4)` | `#22d3ee` |
| Backend | `rgba(6, 78, 59, 0.4)` | `#34d399` |
| Database | `rgba(76, 29, 149, 0.4)` | `#a78bfa` |
| AWS/Cloud | `rgba(120, 53, 15, 0.3)` | `#fbbf24` |
| Security | `rgba(136, 19, 55, 0.4)` | `#fb7185` |
| Message Bus | `rgba(251, 146, 60, 0.3)` | `#fb923c` |
| External | `rgba(30, 41, 59, 0.5)` | `#94a3b8` |

### Direct quotes from SKILL.md

**Masking pattern:**
> "Masking arrows behind transparent fills: Since component boxes use semi-transparent fills (rgba(..., 0.4)), arrows behind them will show through. To fully mask arrows, draw an opaque background rect (e.g., fill='#0f172a') at the same position before drawing the semi-transparent styled rect on top."

**Spacing rules:**
> "CRITICAL: When stacking components vertically, ensure proper spacing to avoid overlaps:
> - Standard component height: 60px for services, 80–120px for larger components
> - Minimum vertical gap between components: 40px
> - Inline connectors (message buses): Place IN the gap between components, not overlapping."

**Legend placement:**
> "CRITICAL: Place legends OUTSIDE all boundary boxes (region boundaries, cluster boundaries, security groups). Calculate where all boundaries end (y position + height). Place legend at least 20px below the lowest boundary. Expand SVG viewBox height if needed to accommodate."

### Implicit prompt patterns

The skill drives Claude through these implicit steps:
1. **Architecture description ingestion:** ask the user for a structured component list with connections
2. **Component classification:** infer component type from keywords (React → Frontend/cyan, Node.js → Backend/emerald, PostgreSQL → Database/violet, CloudFront → AWS/amber)
3. **Layout logic:** organize components horizontally or vertically based on data flow narrative
4. **Arrow annotation:** label arrows with protocol/connection type from description
5. **Legend generation:** auto-generate 3-card summary from key components

### Examples shipped

1. **web-app.html** — Users → React frontend (cyan) → Node.js backend (emerald) → PostgreSQL (violet). Demonstrates: 3-tier layout, REST API arrows, port labels.
2. **aws-serverless.html** — CloudFront → API Gateway → Lambda → DynamoDB + S3. Demonstrates: cloud component styling, region boundary, security groups.
3. **microservices.html** — Multiple services, Kong API Gateway, Kubernetes cluster, Kafka bus. Demonstrates: complex topology, message bus rendering, cluster boundary, legend.

## Claude Code nativeness

**Yes, fully Claude-native.**

1. **Skill format:** Packaged as `/SKILL.md` + `/assets/` — Claude.ai native format.
2. **Activation:** User requests "architecture diagram" → Claude routes to skill automatically.
3. **Prompt-driven:** Entire flow is conversational (no CLI, no API, no external services).
4. **No dependencies:** Pure HTML/SVG generation, no package managers.
5. **Iterative workflow:** Claude remembers context, updates diagram on follow-up requests.
6. **Integration:** Explicitly documented for Claude Code CLI (`~/.claude/skills/`).

**Not an Agent/Hook/MCP:** Simple skill, not a managed agent or MCP server. No custom language bindings.

**Skill metadata from SKILL.md:**

```yaml
name: architecture-diagram
description: Create professional, dark-themed architecture diagrams as standalone HTML files with SVG graphics. Use when the user asks for system architecture diagrams, infrastructure diagrams, cloud architecture visualizations, security diagrams, network topology diagrams, or any technical diagram showing system components and their relationships.
license: MIT
metadata:
  version: "1.0"
  author: Cocoon AI (hello@cocoon-ai.com)
```

## Recommendation: skills to extract for the-forge-flow

### High-priority reusable skills

1. **`architecture-diagram-generator`** (as-is)
   - Direct extraction: already Claude-native.
   - Minimal refactoring: unzip into `.claude/skills/` or `~/.claude/skills/`.
   - Value: users get professional architecture visualization without learning design.

2. **`component-type-classifier`** (new, extracted from implicit logic)
   - Purpose: given text description, classify each component and assign semantic colors.
   - Input: "React frontend, Node.js API, PostgreSQL database".
   - Output: JSON with component names, types (Frontend/Backend/Database/Cloud/Security), colors.

3. **`svg-spacing-validator`** (new, extracted from layout rules)
   - Purpose: validate SVG component positions to prevent overlaps.
   - Input: SVG viewBox dimensions, component coordinates/dimensions.
   - Output: warnings if spacing violations detected (gap < 40px, legend inside boundary).

4. **`diagram-card-generator`** (new, extracted from info card pattern)
   - Purpose: generate 3-column summary card grid from architecture description.
   - Input: architecture description text.
   - Output: HTML cards (color-coded by component type) with key insights.

### Medium-priority enhancement skills

5. **`cloud-architecture-analyzer`** (new, builds on AWS-specific logic) — detect AWS-specific components, suggest region boundaries / security groups, output CloudFormation-compatible architecture.
6. **`microservices-topology-generator`** (new, extends to k8s / service mesh) — render Kubernetes topology with service mesh overlays, network policies, ingress configurations.
7. **`diagram-iteration-handler`** (new, exploit conversational flow) — track architecture state across chat turns, apply incremental updates, version diagram evolution.

### Low-priority specialty skills

8. **`diagram-to-documentation`** — parse generated SVG → extract components/connections; generate Markdown/AsciiDoc documentation; create deployment scripts from diagram topology.
9. **`security-diagram-generator`** — emphasize security components (rose color), add threat vectors, render auth flows prominently.
10. **`diagram-pdf-exporter`** — convert HTML diagrams → PDF with preserved styling, multi-page layouts.

### Implementation approach for the-forge-flow

- **Phase 1 (minimal):** extract skill as-is into `.claude/skills/architecture-diagram/`. Expose as `/architecture-diagram` or `/diagram` command in main system.
- **Phase 2 (extended):** create component classifier as separate skill; create diagram validator skill; create iterative updater skill; build skill composition for "architect" persona.
- **Phase 3 (full integration):** MCP-wrap the skill for non-Claude tools; add batch diagram generation from codebase analysis; integrate with TFF milestone/architecture planning workflow.

### Extractable skill template boilerplate

From `SKILL.md`, the repeatable pattern for any diagram component:

```svg
<!-- Opaque background to mask arrows -->
<rect x="X" y="Y" width="W" height="H" rx="6" fill="#0f172a"/>
<!-- Styled component on top -->
<rect x="X" y="Y" width="W" height="H" rx="6" fill="FILL_RGBA" stroke="STROKE_COLOR" stroke-width="1.5"/>
<!-- Title text -->
<text x="CENTER_X" y="Y+20" fill="white" font-size="11" font-weight="600" text-anchor="middle">LABEL</text>
<!-- Subtitle -->
<text x="CENTER_X" y="Y+36" fill="#94a3b8" font-size="9" text-anchor="middle">sublabel</text>
```

This pattern is directly reusable in any SVG diagram generator skill.

## Summary

The Architecture Diagram Generator is a polished, Claude.ai-native skill for converting text descriptions into professional dark-themed SVG architecture diagrams. It comprises two core artifacts: a detailed design system guide (`SKILL.md`, 164 lines) and an HTML template with embedded CSS and SVG examples (`template.html`, 320 lines). The design system enforces strict color semantics (Frontend=cyan, Backend=emerald, Database=violet, Cloud=amber, Security=rose), z-order rendering rules for clean arrow masking, and critical spacing constraints (40px min gap between components, 20px legend offset from boundaries).

The project is production-ready for Claude.ai integration and distributes as a single zip file. Key extractable capabilities include: component type classification, SVG spacing validation, info card generation, cloud architecture detection, and iterative diagram updating. The skill requires no runtime dependencies, generating self-contained HTML files that render in any modern browser.
