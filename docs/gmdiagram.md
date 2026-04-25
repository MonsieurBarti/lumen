# gmdiagram

## What it does

gmdiagram is a Claude Code and Codex plugin marketplace that generates publication-quality diagrams and data visualization charts directly from natural language descriptions. It produces single-file, browser-ready HTML and SVG outputs with inline styling and embedded assets, requiring zero JavaScript or external dependencies. The system supports 9 distinct diagram types (architecture, flowchart, mind map, ER diagram, sequence diagram, Gantt chart, UML class, network topology, social card) and 9 chart types (bar, pie/donut, line, area, scatter, radar, funnel, bubble, table), each renderable in 12 different visual styles (dark-professional, hand-drawn, light-corporate, cyberpunk-neon, blueprint, warm-cozy, minimalist, terminal-retro, pastel-dream, notion, material, glassmorphism) and 4 output formats (HTML, SVG, Mermaid text, PNG/PDF via export script).

## Interface (how a user invokes it)

### User-Facing Entry Points

**In Claude Code:**
```bash
/plugin marketplace add ZeroZ-lab/gmdiagram
/plugin install gm-architecture@gmdiagram-marketplace
/plugin install gm-data-chart@gmdiagram-marketplace
```

Then users invoke either skill naturally in conversation:
```
Draw an architecture diagram of Chrome's multi-process system
Create a flowchart for a CI/CD pipeline
画一个微服务架构图
Generate a bar chart comparing Q1-Q4 revenue
```

**In Codex:**
- Repository root points to `.agents/plugins/marketplace.json` for local plugin discovery
- Same natural language requests trigger skill detection

### Skills Exposed

Two primary Claude Code skills are packaged as plugins:

1. **`gm-architecture`** — Architecture diagram skill
   - Trigger: Natural language mentioning diagram type keywords (architecture, flowchart, mindmap, ER, sequence, Gantt, UML, network, card, etc.)
   - SKILL.md location: `gm-architecture/skills/gm-architecture/SKILL.md` (19.5 KB, comprehensive 478-line instruction manual)

2. **`gm-data-chart`** — Data visualization chart skill
   - Trigger: Natural language mentioning chart/graph keywords (bar, pie, line, area, scatter, radar, funnel, bubble, table, data)
   - SKILL.md location: `gm-data-chart/skills/gm-data-chart/SKILL.md` (18.7 KB, comprehensive instruction manual)

### Interaction Model

Both skills use an **interactive selection pattern** when user request is ambiguous:
- **Interactive selection via AskUserQuestion tool**: When user doesn't specify all three dimensions (type, style, format), the skill asks clarifying questions (max 4 options per question to respect UI constraints)
- **Two-step generation pipeline**:
  1. **Step 1**: Extract natural language into typed JSON schema (e.g., `schema-architecture.json`, `schema-bar.json`)
  2. **Step 2**: Render from JSON using template + layout rules to produce final HTML/SVG

### Output Delivery

- **Default**: Single-file HTML with inline SVG + embedded CSS (opens in any browser, zero setup)
- **Alternative formats**: Standalone SVG, Mermaid text syntax, PNG/PDF (via bash export script)
- **File structure**: User receives one file or command to run for multi-step export

## Capabilities (extractable as skills)

### GM Architecture Skill Capabilities

1. **Architecture Diagram Generation** — Extract system layers, services, and infrastructure from user description; render with connection arrows, component types, tech badges
2. **Flowchart Generation** — Extract process flows with decision nodes, branching logic, input/output symbols; render with layout routing
3. **Mind Map Generation** — Extract hierarchical topic structure; render as radial or tree-based layout with nested relationships
4. **Entity-Relationship (ER) Diagram Generation** — Extract database tables, fields, relationships; render with cardinality notations
5. **Sequence Diagram Generation** — Extract message flows, actor interactions, protocol sequences; render with lifelines and interaction arrows
6. **Gantt Chart Generation** — Extract project timeline, tasks, milestones, dependencies; render as horizontal bars with temporal positioning
7. **UML Class Diagram Generation** — Extract OOP class structure, inheritance, interfaces, methods; render with UML notation
8. **Network Topology Diagram Generation** — Extract servers, routers, subnets, connections; render with topology layout rules
9. **Social Card / Knowledge Card Generation** — Extract knowledge, comparison, quote, or ranked-list card data; render as shareable card format
10. **Multi-Style Rendering** — Apply 12 distinct visual styles to any diagram without re-extracting data (style templates)
11. **Multi-Format Export** — Convert diagram to HTML, SVG, Mermaid text, or PNG/PDF (latter via Node.js/librsvg)
12. **Directional Layout Control** — Support TB (top-to-bottom, default) and LR (left-to-right) layout modes for architecture/flowchart
13. **Density Adjustment** — Apply compact, normal, or spacious spacing modes to same diagram
14. **Icon Integration** — Embed 24x24 Tabler icons into components with automatic color inheritance
15. **Custom Font/Color Overrides** — Replace design system colors/fonts with user brand colors (via JSON overrides)

### GM Data Chart Skill Capabilities

1. **Bar / Column Chart Generation** — Extract categories and numeric values; render as vertical or horizontal bars with grouped/stacked variants
2. **Pie / Donut Chart Generation** — Extract categories and proportional values; render with percentage labels and legend
3. **Line Chart Generation** — Extract time-series or continuous data; render with smooth/linear interpolation, data point markers
4. **Area Chart Generation** — Extract multi-series data; render as overlaid or stacked filled areas
5. **Scatter Plot Generation** — Extract x,y coordinate pairs; render with point markers, trend lines, axis scaling
6. **Radar / Spider Chart Generation** — Extract multi-dimensional values across axes; render as concentric polygon grid
7. **Funnel Chart Generation** — Extract pipeline/conversion stages; render with proportional tapering and conversion rate labels
8. **Bubble Chart Generation** — Extract x,y,size 3D data; render with area-scaled circles and dual-axis scaling
9. **Data Table / Comparison Table Generation** — Extract structured tabular data; render as HTML table with min/max highlighting
10. **Nice Numbers Axis Computation** — Automatically calculate "nice" axis tick values (no awkward decimals) using algorithmic rounding
11. **Multi-Style Rendering** — Apply 12 visual styles to any chart without re-extracting data
12. **Multi-Format Export** — Output as HTML (default), SVG, Mermaid (bar/pie only), or PNG/PDF
13. **Directional Control** — Render bar charts vertically or horizontally; flip axis roles accordingly
14. **Legend Management** — Auto-generate legends with color coding matching data series
15. **Axis Configuration** — Support custom axis labels, ranges, grid density, tick formatting

### Reusable Capability Clusters for The-Forge-Flow

**Diagram Generation Core**: Capabilities 1-9 (all diagram/chart types) — each type follows identical 2-step process (JSON extract → template render)

**Style System**: Capability 10 (GM Arch) + Capability 11 (GM Data Chart) — 12 reusable style templates compatible with any diagram/chart type

**Export Pipeline**: Capability 11 (GM Arch) + Capability 12 (GM Data Chart) — Unified export to HTML/SVG/Mermaid/PNG/PDF

**Layout Engine**: Capabilities 5, 6, 12 (directional control) — Coordinate-free CSS flexbox-based layout system avoiding LLM coordinate math

## Key techniques / prompts / algorithms

### Two-Step Generation Pipeline (Universal Pattern)

ALL diagram and chart generation follows exactly this sequence:

**Step 1: JSON Schema Extraction**
- Read user's natural language description
- Extract structure into typed JSON schema (specific to diagram/chart type)
- Validate JSON against schema constraints
- Store in intermediate representation format

**Step 2: Rendering**
- Load JSON
- Select style template (HTML or SVG base)
- Apply layout rules (read from per-type reference files like `layout-architecture.md`, `render-bar.md`)
- Generate SVG paths, shapes, and text
- Wrap in HTML template if output format is HTML
- Return single-file output

**Critical constraint**: Never skip Step 1 and generate output directly; always go through intermediate JSON.

### Key Algorithms

#### Nice Numbers Algorithm (Data Chart)
Located in `references/axis-and-grid.md`:
- Computes axis ticks that avoid awkward decimals (e.g., no `2.333333`)
- Used in Step 1 to pre-compute `axis.y.ticks` (and `axis.x.ticks` for scatter/bubble) before rendering
- Avoids complex floating-point math in Step 2 rendering phase
- Enables clean axis labels (10, 20, 30, 40, ... or 0, 250, 500, 750, ...)

#### CSS Layout Engine (no LLM coordinate math)
Pattern: foreignObject + HTML div flexbox
- Eliminates coordinate arithmetic errors (LLMs can't reliably compute pixels)
- Module width, height, text centering handled by CSS flexbox, not SVG transforms
- Only y-coordinates of layers need computing (stacked vertically)
- All horizontal centering, text alignment, spacing via CSS `gap`, `justify-content`, `align-items`

**Pattern**:
```svg
<g transform="translate(40, computed_y)">
  <rect width="920" height="120" rx="8" fill="#0f172a"/>  <!-- masking -->
  <foreignObject width="920" height="120">
    <div xmlns="http://www.w3.org/1999/xhtml" class="layer-card">
      <div class="layer-label">Title</div>
      <div class="modules" style="display:flex; gap:20px; justify-content:center;">
        <div class="module">Module 1</div>
        <div class="module">Module 2</div>
      </div>
    </div>
  </foreignObject>
</g>
```

#### SVG Path Routing (Architecture Diagrams)
- Connection arrows route around intermediate layers (never cross through layer cards)
- Masking rects placed behind components to hide arrow segments that should be occluded
- Arrow marker definitions (`<marker>`) for arrowheads (8x6 triangles, same color as stroke)
- Bidirectional arrows render with arrowheads on both ends

#### Component Type System
Semantic types mapped to colors (per-style):
- `process` — Processes, services (cyan stroke in dark-professional)
- `module` — Sub-modules, libraries (green stroke)
- `data` — Databases, storage (violet stroke)
- `infra` — Infrastructure, cloud (amber stroke)
- `security` — Auth, encryption (rose stroke)
- `channel` — Message buses, IPC (orange stroke)
- `external` — External systems (slate stroke)

Each style reference (e.g., `style-dark-professional.md`) defines fill + stroke RGBA values for all types.

#### Language Auto-Detection for HTML Output
Heuristic rule in SKILL.md:
1. Check `title` field for Chinese characters (`一-鿿`)
2. Check `subtitle` field for Chinese characters
3. Check if >50% of labels contain Chinese
4. Default to `en` if uncertain

Sets HTML `lang` attribute accordingly (en, zh-CN, zh-TW, ja) for screen readers + font rendering.

### Prompt Patterns

#### Interactive Selection Pattern
Used to narrow down ambiguous requests without forcing user to pre-specify all options:

```
question: "Which diagram type fits your needs?"
header: "Type"
multiSelect: false
options:
  - label: "Architecture"
    description: "System layers, services, infrastructure, platform maps"
  - label: "Flowchart"
    description: "Process flow, decision tree, branching logic"
  - ...max 4 options...
```

Constraint: Max 4 options per question, max 4 questions per `AskUserQuestion` call. If >4 options needed, nest questions (ask family first, then drill down within family).

#### Style Selection Strategy
3-family grouping to avoid overwhelming user:
1. **Dark** family → Dark Professional, Cyberpunk Neon, Terminal Retro
2. **Light/Clean** family → Light Corporate, Minimalist, Warm Cozy, Notion
3. **Creative** family → Hand-Drawn, Blueprint, Pastel Dream, Material, Glassmorphism

Ask family first, then drill down to specific style.

#### Density Inference (no user prompt)
Inferred from keywords in description, never asked:
- "compact" / "dense" / "tight" / "紧凑" → `"compact"`
- "spacious" / "spread out" / "presentation" / "宽松" → `"spacious"`
- Otherwise → `"normal"`

#### Direction Inference (no user prompt)
For architecture/flowchart only, inferred from description, never asked:
- "left to right" / "horizontal" / "LR" / "从左到右" → `"LR"`
- Otherwise → `"TB"` (top-to-bottom)

### Validation Rules

**Architecture Diagrams**:
- Layers MUST have heights exactly `LAYER_H_BADGE` (116px) or `LAYER_H_SIMPLE` (101px) — never custom heights
- Gap between adjacent layers MUST be exactly 50px
- Layer y-positions: `layer_y[i] = layer_y[i-1] + h + gap`

**Data Charts**:
- Bar/Line/Area: max 8 series, max 30 data points per series
- Scatter/Bubble: max 8 series, max 50 data points per series
- Pie/Funnel: max 12 (pie) / max 8 (funnel) items
- Table: max 12 columns, max 50 rows
- Radar: min 3 axes, max 12 axes; all series must have same # of data points as axes count
- All numeric values must be finite (no NaN, Infinity)
- All color values must match `^#[0-9a-fA-F]{6}$` (6-digit hex)

### HTML/SVG Escaping & Security

- All user text HTML-entity-escaped before inserting into SVG/HTML: `<` → `&lt;`, `>` → `&gt;`, `&` → `&amp;`, `"` → `&quot;`, `'` → `&#39;`
- No JavaScript in generated output
- No event handlers (`onerror`, `onclick`, etc.)
- No `<script>`, `<iframe>`, `<object>`, `<embed>` tags
- Every `<foreignObject>` must include `xmlns="http://www.w3.org/1999/xhtml"` on root HTML element

### File Naming Convention

Kebab-case only for all diagram/chart example files:
```
{context}-{type}[-{variant}].{ext}
```

Examples:
- `chrome-architecture.json` ✅
- `quarterly-revenue.json` ✅
- `team-skills-radar.json` ✅
- `chromeArchitecture.json` ❌ (camelCase not allowed)

## Runtime stack

**Language**: Node.js (for export script only; skill execution is pure LLM)

**Core Dependencies**:
- JSON Schema (Draft 7) for validation
- SVG 1.1 for diagram rendering
- CSS 3 (flexbox, grid) for component layout
- HTML 5 for output documents

**Export Script Dependencies** (optional, only needed for PNG/PDF):
- `@resvg/resvg-js` (Node.js library for SVG → PNG conversion)
- `rsvg-convert` (from librsvg, installed via `brew install librsvg` on macOS, for PDF export)
- Bash for orchestration

**Execution Flow**:
1. Claude processes user request → detects skill via SKILL.md trigger keywords
2. Skill extracts JSON (Step 1)
3. Skill renders output (Step 2) → writes HTML or SVG to disk
4. If user requests PNG/PDF: call `scripts/export.sh input.html --format png` (invokes Node.js or rsvg-convert)

**No External Services**: All rendering is offline, client-side, no cloud dependencies, no API calls.

## Reusable artifacts (prompts, templates, skill definitions)

### JSON Schemas (9 + 9 types)

**Architecture Diagrams** (files: `gm-architecture/skills/gm-architecture/assets/`):
- `schema-architecture.json` — System layers, modules, connections, groups
- `schema-flowchart.json` — Process nodes, decision gates, paths
- `schema-mindmap.json` — Root topic, subtopics, hierarchy levels
- `schema-er.json` — Tables, fields, relationships, cardinality
- `schema-sequence.json` — Actors, messages, lifelines, interactions
- `schema-gantt.json` — Tasks, timelines, dependencies, milestones
- `schema-uml-class.json` — Classes, methods, inheritance, interfaces
- `schema-network.json` — Nodes, connections, topology layout
- `schema-card.json` — Card type (knowledge, comparison, quote, ranked-list), content

**Data Charts** (files: `gm-data-chart/skills/gm-data-chart/assets/`):
- `schema-bar.json` — Series, categories, values, axis config, variants (grouped/stacked)
- `schema-pie.json` — Data items, values, variant (pie/donut)
- `schema-line.json` — Series, data points, smooth flag, marker config
- `schema-area.json` — Series, data points, variant (overlaid/stacked)
- `schema-scatter.json` — Series, x/y pairs, labels, axis config
- `schema-radar.json` — Axes, series, values, maxValue config
- `schema-funnel.json` — Stages, values, conversion rate display flag
- `schema-bubble.json` — Series, x/y/size triplets, axis config
- `schema-table.json` — Columns, rows, highlight rules
- `schema-shared.json` — Reusable definitions: styleEnum, formatEnum, axisConfig, legendConfig, sanitizedString

**Key Schema Patterns**:
```json
{
  "title": "string",
  "diagramType": "architecture|flowchart|mindmap|...",
  "style": "dark-professional|hand-drawn|...",  // 12 styles
  "format": "html|svg|mermaid",
  "density": "compact|normal|spacious",
  "direction": "TB|LR",  // architecture/flowchart only
  "metadata": {
    "version": "0.7.0",
    "date": "2026-04-14",
    "author": "gmdiagram"
  }
}
```

### HTML Templates (12 style templates, shared across all types)

All in `gm-architecture/skills/gm-architecture/assets/`:
- `template-dark.html` — Dark Professional style (default)
- `template-sketch.html` — Hand-Drawn style
- `template-light-corporate.html` — Light Corporate
- `template-cyberpunk-neon.html` — Cyberpunk Neon
- `template-blueprint.html` — Blueprint
- `template-warm-cozy.html` — Warm Cozy
- `template-minimalist.html` — Minimalist
- `template-terminal-retro.html` — Terminal Retro
- `template-pastel-dream.html` — Pastel Dream
- `template-notion.html` — Notion
- `template-material.html` — Material
- `template-glassmorphism.html` — Glassmorphism

**Template Structure**:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Diagram Title</title>
  <style>
    /* Embedded CSS for all styles + component colors + type colors */
    .layer-card { ... }
    .module { ... }
    .type-process { ... }
    /* etc */
  </style>
</head>
<body>
  <!-- Header with title + subtitle -->
  <div class="header">...</div>
  
  <!-- Main SVG diagram (inline, not <img src=...>) -->
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="...">
    <!-- All diagram content here -->
  </svg>
  
  <!-- Footer -->
  <div class="footer">...</div>
</body>
</html>
```

**Critical**: Each template defines CSS classes (`.layer-card`, `.module`, `.type-process`, etc.) with style-specific colors. Rendering code uses these classes, not hardcoded colors.

### Reference Documentation Files (50+ per plugin)

**Architecture Plugin References** (`gm-architecture/skills/gm-architecture/references/`):
- `design-system.md` — Color palette, typography, spacing, borders, icon system
- `diagram-type-registry.md` — Trigger keywords for each diagram type
- `diagram-{type}.md` (8 files) — Type-specific generation rules for architecture, flowchart, mindmap, er, sequence, gantt, uml-class, network, card
- `layout-{type}.md` (8 files) — Coordinate calculation algorithms per type
- `components-{type}.md` (8 files) — SVG snippet templates for type-specific component shapes
- `component-templates.md` — Reusable SVG building blocks
- `style-{name}.md` (12 files) — Per-style color palette, typography, aesthetic rules
- `icons-catalog.md` — 100+ Tabler icons with SVG paths
- `output-svg.md` — SVG format generation rules
- `output-mermaid.md` — Mermaid syntax transformation rules
- `output-png-pdf.md` — Export script invocation guide
- `schema-architecture.md` — JSON schema documentation

**Data Chart Plugin References** (`gm-data-chart/skills/gm-data-chart/references/`):
- `render-{type}.md` (9 files) — Per-chart-type rendering algorithms and SVG construction rules
- `axis-and-grid.md` — Nice Numbers algorithm, tick computation, grid rendering
- `color-palettes.md` — Color palette selection per chart type, per style

### Skill Definition Files (SKILL.md)

**`gm-architecture/skills/gm-architecture/SKILL.md`** (19.5 KB):
- Trigger keywords (natural language patterns that invoke the skill)
- Two-step generation process (Step 1: JSON extract, Step 2: render)
- Interactive selection pattern (diagram type, style, format questions)
- Inference rules (density, direction, language detection)
- Quality checklist (19 checkpoints before delivery)
- Iteration workflow (how to handle user requests for changes)
- File naming convention (kebab-case rules)
- Metadata version field (SemVer format rules)

**`gm-data-chart/skills/gm-data-chart/SKILL.md`** (18.7 KB):
- Similar structure but for chart types
- Nice Numbers algorithm invocation rules
- Chart-type-specific validation constraints
- Mermaid output limitations (bar/pie only)

### Prompt Snippets (from SKILL.md)

**Diagram Type Selection** (excerpt from gm-architecture SKILL.md):
```
question: "Which diagram type fits your needs?"
options:
  - label: "Architecture"
    description: "System layers, services, infrastructure, platform maps"
  - label: "Flowchart"
    description: "Process flow, decision tree, branching logic"
  - label: "Mind Map"
    description: "Topic hierarchy, brainstorm, feature tree"
  - label: "Other"
    description: "ER Diagram, Sequence, Gantt, UML Class, Network, or Card"
```

**Style Family Selection** (excerpt):
```
question: "Which style family?"
options:
  - label: "Dark"
    description: "Dark Professional, Cyberpunk Neon, or Terminal Retro"
  - label: "Light / Clean"
    description: "Light Corporate, Minimalist, Warm Cozy, or Notion"
  - label: "Creative"
    description: "Hand-Drawn, Blueprint, Pastel Dream, Material, or Glassmorphism"
```

**Quality Checklist** (excerpt, 19 total items for architecture):
- [ ] JSON validates against the diagram type's schema
- [ ] Every `<foreignObject>` has `xmlns="http://www.w3.org/1999/xhtml"` on the root HTML element
- [ ] Component boxes use CSS classes from the template (`.module`, `.type-X`, `.module-label`)
- [ ] **Every layer height is exactly LAYER_H_BADGE (116) or LAYER_H_SIMPLE (101) — NEVER custom heights**
- [ ] **NO overlapping layers: gap between every pair of adjacent layers = exactly 50px**
- [ ] ViewBox fits all content with no clipping and no more than 40px whitespace margin

### Codex Plugin Manifest (plugin.json)

**`.codex-plugin/plugin.json`** format:
```json
{
  "name": "gm-architecture",
  "version": "0.7.0",
  "description": "Generate diagrams from natural language as single-file HTML, SVG, Mermaid, and exportable PNG/PDF.",
  "author": { "name": "zhengjianqiao", "url": "https://github.com/ZeroZ-lab/gmdiagram" },
  "homepage": "https://github.com/ZeroZ-lab/gmdiagram",
  "repository": "https://github.com/ZeroZ-lab/gmdiagram",
  "license": "MIT",
  "keywords": ["diagram", "architecture", "flowchart", "mindmap", "er-diagram", ...],
  "skills": "./skills/",
  "interface": {
    "displayName": "GM Architecture",
    "shortDescription": "Generate polished diagrams from natural language",
    "category": "Coding",
    "capabilities": ["Read", "Write"]
  }
}
```

### Claude Code Plugin Manifest (plugin.json)

**`.claude-plugin/plugin.json`** format (same structure as Codex, version 0.7.0):
```json
{
  "name": "gm-architecture",
  "version": "0.7.0",
  "skills": "./skills/",
  "interface": {
    "displayName": "GM Architecture",
    "shortDescription": "Generate polished diagrams from natural language",
    "capabilities": ["Read", "Write"]
  }
}
```

### Marketplace Definition

**`.claude-plugin/marketplace.json`**:
```json
{
  "$schema": "https://anthropic.com/claude-code/marketplace.schema.json",
  "name": "gmdiagram-marketplace",
  "version": "0.7.0",
  "plugins": [
    {
      "name": "gm-architecture",
      "source": "./gm-architecture",
      "version": "0.7.0"
    },
    {
      "name": "gm-data-chart",
      "source": "./gm-data-chart",
      "version": "0.7.0"
    }
  ]
}
```

## Claude Code nativeness

### Is it Claude-Code-native? YES

**Architecture**:
- Two Claude Code skills (gm-architecture, gm-data-chart) packaged as plugins
- Each skill has a SKILL.md file read by Claude during skill triggering
- Trigger keywords detected by Claude's skill system
- Interactive selection via `AskUserQuestion` tool (Claude Code feature)
- File output via standard Write tool

**Plugin Installation**:
```bash
/plugin marketplace add ZeroZ-lab/gmdiagram
/plugin install gm-architecture@gmdiagram-marketplace
/plugin install gm-data-chart@gmdiagram-marketplace
```

After installation, invoking the skill is as simple as natural language:
```
Draw a microservices architecture with API Gateway and three backend services
```

### Skill Trigger Detection

Skills are triggered when user request matches keywords in SKILL.md `description` field. For gm-architecture:

```yaml
description: >
  Generate professional architecture diagrams from system descriptions.
  Use this skill whenever the user asks to create, draw, or generate:
  architecture diagrams, flowchart, mind map, ER diagram,
  sequence diagram, Gantt, UML Class, network topology,
  social card, 知识卡片, 架构图, 流程图, 思维导图, ...
```

Matching keywords: "architecture diagram", "flowchart", "draw a diagram", "create a mind map", etc.

### Tool Usage Within Skills

**AskUserQuestion**: Invoked by the skill for interactive selection (diagram/chart type, style, format)
```
User: "Create a diagram showing a microservices architecture"
→ Ambiguous type/style/format
→ Skill calls AskUserQuestion("Which style?" with 3-4 options)
→ User selects "Dark Professional"
→ Skill calls AskUserQuestion("Which output format?" with 4 options)
→ User selects "HTML"
→ Skill proceeds to generate JSON + render
```

**Write**: Final output file (HTML or SVG)
```
/write output/chrome-architecture.html
```

**Bash** (optional): For PNG/PDF export
```bash
./gm-architecture/skills/gm-architecture/scripts/export.sh input.html --format png
```

### No-Code Dependencies

- Skills execute entirely within Claude (no external services)
- All templates + schemas bundled in repository
- No JavaScript required in generated output
- No build step, no npm install (except optional PNG export)

### Integration with Claude Code Workspace

- Generated diagrams saved to project directory
- Users can iterate: "change the style to hand-drawn" → skill re-renders same JSON with different template
- All outputs are plain HTML/SVG → can be committed to git, viewed in browser, converted via export script

## Recommendation: skills to extract for the-forge-flow

### High-Priority Skills (Immediate Extract)

1. **`gm-architecture`** (Complete skill as-is)
   - 9 diagram types + 12 styles + 4 formats
   - Highly reusable, domain-agnostic
   - Rich prompt/template system already in place
   - Minimal dependencies (pure SVG + CSS)
   - Recommendation: Copy entire `gm-architecture/` plugin directory into the-forge-flow as a sub-plugin or standalone skill

2. **`gm-data-chart`** (Complete skill as-is)
   - 9 chart types + 12 styles + 4 formats
   - Complements architecture skill
   - Pre-built Nice Numbers algorithm
   - Recommendation: Copy entire `gm-data-chart/` plugin directory alongside gm-architecture

### Medium-Priority Skills (Extract as Standalone Skills)

3. **`diagram-generator-core`** (Extract common 2-step pattern)
   - Reusable workflow: JSON schema extraction → template rendering
   - Factor out from both gm-architecture and gm-data-chart
   - Use for future diagram/chart types without duplication
   - Includes: interactive selection pattern, JSON validation, template loading

4. **`style-system`** (Extract design system)
   - 12 reusable visual styles (dark-professional, hand-drawn, etc.)
   - Applicable to ANY diagram/chart type
   - Extract: template HTML files + style references + color palettes
   - Enable: "apply a different style to any diagram" as standalone skill

5. **`export-pipeline`** (Extract multi-format export)
   - Unified export: HTML → SVG / PNG / PDF
   - Bash script + Node.js setup
   - Decouple from diagram/chart skills
   - Enable: "convert any diagram to PNG" as standalone skill

### Integration Recommendations for The-Forge-Flow

**Option A: Direct Copy (Fastest)**
- Copy `gm-architecture/` and `gm-data-chart/` plugins as-is into the-forge-flow
- Register in the-forge-flow marketplace.json
- Minimal refactoring needed
- Users access via `/diagram` or `/chart` commands
- **Timeline**: 1-2 hours

**Option B: Refactor + Integrate (Recommended)**
- Extract common 2-step pattern into shared `_core` module
- Refactor gm-architecture and gm-data-chart to use shared core
- Add project-specific diagram types (e.g., "workflow", "milestone-timeline", "skill-matrix")
- Build marketplace entry for the-forge-flow
- **Timeline**: 4-6 hours

**Option C: Compose as Composite Skill (Advanced)**
- Create umbrella skill `/diagram` that dispatches to gm-architecture or gm-data-chart
- Extend with custom types (e.g., "project roadmap", "sprint burndown")
- Integrate with the-forge-flow project context (pull from milestone data, etc.)
- **Timeline**: 8-12 hours

### Code Changes Needed for Port

**Minimal (Option A)**:
- Update marketplace.json namespace (`gmdiagram-marketplace` → `the-forge-flow-marketplace`)
- Adjust file paths if directory structure differs
- No logic changes

**Small (Option B)**:
- Extract Step 1 (JSON extraction) and Step 2 (rendering) into shared functions
- Create common validation module
- Add shared schema validation dispatcher
- Decouple style templates into shared asset library

**Medium (Option C)**:
- Add routing logic for custom diagram types
- Integrate with the-forge-flow project state/metadata
- Create plugin hooks for custom diagram types
- Build feedback loop (diagram ↔ project milestones)

### Specific Assets to Extract

If building custom diagram types for the-forge-flow:

**Reusable Templates**:
- All 12 HTML templates (style-agnostic structure, just swap CSS)
- Template pattern for new styles (copy + modify color palette)

**Reusable Reference Docs**:
- `design-system.md` — Apply to custom diagram types
- `layout-rules.md` — Coordinate/spacing rules (140px heights, 50px gaps)
- `icons-catalog.md` — 100+ icons for custom component types

**Reusable Schemas**:
- `schema-shared.json` — Common field types (styleEnum, formatEnum, axisConfig)
- Component type system (process, module, data, infra, security, channel, external)
- Use as base for custom types

**Reusable Algorithms**:
- Nice Numbers axis computation (`axis-and-grid.md`)
- CSS flexbox layout pattern (foreignObject + div + flex)
- SVG escaping rules

### Long-Term Vision

**Phase 1**: Copy gm-architecture + gm-data-chart as standalone plugins
- Users can invoke `/diagram` and `/chart` naturally
- No custom types yet

**Phase 2**: Add the-forge-flow custom diagram types
- "Milestone Timeline" (like Gantt, but tied to project milestones)
- "Skill Matrix" (radar chart of team skills)
- "Sprint Burndown" (line chart with burndown trajectory)

**Phase 3**: Integrate with project state
- Diagram generator reads from project milestones, team roster, etc.
- "Show project roadmap as diagram" → auto-generates from context
- Bidirectional: diagram changes feed back to project

### Final Recommendation

**Extract `gm-architecture` and `gm-data-chart` as complete plugins into the-forge-flow immediately.** They are:
- Mature (v0.7.0, well-documented)
- Self-contained (no external API dependencies)
- Widely applicable (any diagram or chart type)
- Low-risk (pure SVG + CSS rendering, no runtime dependencies)
- Ready to use (just copy + register)

Then, in a follow-up sprint, build custom the-forge-flow diagram types (milestones, roadmaps, burndown) using the extracted design system + template system.

---

## Appendix: File Structure Summary

```
gmdiagram/
├── .claude-plugin/marketplace.json                # Claude Code marketplace
├── .agents/plugins/marketplace.json               # Codex marketplace
│
├── gm-architecture/                               # Diagram plugin
│   ├── .claude-plugin/plugin.json                 # Claude manifest
│   ├── .codex-plugin/plugin.json                  # Codex manifest
│   ├── README.md
│   └── skills/gm-architecture/
│       ├── SKILL.md                               # 19.5 KB skill instructions
│       ├── README.md                              # User documentation
│       ├── assets/
│       │   ├── schema-*.json                      # 9 JSON schemas
│       │   ├── template-*.html                    # 12 HTML templates
│       │   └── examples/                          # 30+ example diagrams
│       ├── references/                            # 50+ reference files
│       │   ├── diagram-*.md                       # Per-type rules
│       │   ├── layout-*.md                        # Per-type layout
│       │   ├── components-*.md                    # SVG snippets
│       │   ├── style-*.md                         # Per-style palettes
│       │   ├── icons-catalog.md
│       │   ├── design-system.md
│       │   └── output-*.md
│       └── scripts/export.sh                      # PNG/PDF export
│
├── gm-data-chart/                                 # Chart plugin
│   ├── .claude-plugin/plugin.json
│   ├── .codex-plugin/plugin.json
│   ├── README.md
│   └── skills/gm-data-chart/
│       ├── SKILL.md                               # 18.7 KB skill instructions
│       ├── README.md
│       ├── assets/
│       │   ├── schema-*.json                      # 10 JSON schemas
│       │   └── examples/                          # 20+ example charts
│       ├── references/                            # 11 reference files
│       │   ├── render-*.md                        # Per-chart rules
│       │   ├── axis-and-grid.md
│       │   └── color-palettes.md
│       └── scripts/export.sh                      # Symlink to gm-architecture
│
├── docs/SPEC.md                                   # Product spec (Chinese)
├── CLAUDE.md                                      # Dev guide
└── README.md
```

Total: 2 complete plugins (9 diagram types + 9 chart types), 12 visual styles, 4 output formats, 50+ reference docs, 100+ example diagrams/charts.

