# roxabi-forge

Source: https://github.com/Roxabi/roxabi-forge

## What it does

Roxabi Forge is a Claude Code plugin that generates publication-grade HTML visual artifacts for developers and product teams. It transforms prompts, GitHub issues, markdown, and media batches into self-contained diagrams, galleries, slide decks, guides, presentations, and epic analyses. All outputs are brand-aware, manifest-indexed for gallery discovery, and deployable to Cloudflare Pages. Single-file artifacts work offline with `file://`. The system combines a 4-phase decision methodology (Frame → Structure → Style → Deliver) with a reusable CSS component library and 14+ pre-built diagram topologies, enabling rapid generation of publication-quality visuals without leaving the Claude Code terminal.

## Interface (how a user invokes it)

Claude Code slash commands (natural-language triggers mapped to 8 skills):

- `"draw"` / `"diagram"` / `"visualize"` / `"quick visual"` → forge-chart (single-file diagram)
- `"create deck"` / `"slide deck"` / `"pitch deck"` / `"slides from #N"` → forge-slides (scroll-snap deck)
- `"create presentation"` / `"scroll presentation"` / `"visual article"` → forge-presentation (long-form scroll)
- `"write a guide"` / `"architecture doc"` / `"recap"` → forge-guide (multi-tab doc)
- `"visualize #N"` / `"epic preview"` / `"illustrate issue"` → forge-epic (issue-linked analysis)
- `"gallery"` / `"showcase"` / `"compare visually"` / `"sprite gallery"` → forge-gallery (image/audio gallery)
- `"render md"` / `"md to html"` / `"tabbed docs"` → forge-md (markdown to HTML)
- `"init forge"` / `"setup forge"` → forge-init (initialize runtime)

Each skill accepts `$ARGUMENTS` (project name, issue number, file path, aesthetic override, etc.) and outputs to `~/.roxabi/forge/<project>/` with standardized directory structure.

## Capabilities (extractable as skills)

### Visualization

1. **forge-chart** — single-file native fgraph diagrams (14+ topologies: hub-spoke, linear, swimlane, layered, machine-clusters, gantt, pie, ER, sequence, state, dep-graph, system-architecture) or CSS Grid explainers. All CSS/JS inline, works with `file://`. Output: `~/.roxabi/forge/<project>/visuals/{slug}.html`.
2. **forge-epic** — issue-linked visual analysis from GitHub issues. Generates split-file HTML with 4 tabs: Overview (hero + scope cards), Breakdown (task table), Dependencies (dep-graph), Acceptance Criteria (checklist). Filename always includes issue number.
3. **forge-gallery** — image/audio galleries with 5 templates (pivot matrix, simple batches, comparison cards, audio players, multi-mode). Features: dynamic pivot grouping, score filtering, lightbox, search, size controls, lazy loading, starring, downloads.

### Documentation

4. **forge-guide** — multi-tab HTML document (shell + CSS + JS + tab fragments). For user guides, architecture overviews, project recaps, comparison matrices, roadmaps. Variable tab set per content.
5. **forge-md** — render markdown files as-is to themed HTML. Single-file (`render-md.py`) or multi-tab tabbed doc (`render-md-tabs.py`). No rewriting/restructuring.

### Presentation

6. **forge-slides** — magazine-quality scroll-snap presentation deck. 10 slide types (title, section, content, quote, image, code, comparison, table, diagram, closing), 6 aesthetic presets, keyboard + touch nav, reveal animations. Single-file, fully offline.
7. **forge-presentation** — long-form scroll document with hero + numbered sections (§01, §02, ...), continuous scroll, reveal animations. Single-file, offline.

### Setup

8. **forge-init** — bootstrap `~/.roxabi/forge/` runtime. Creates directory structure, copies `serve.py` (dev server with SSE live-reload), `index.html` (gallery UI), and shared assets (`gallery-base.css/js`, `fgraph-base.css`). Idempotent.

## Key techniques / prompts / algorithms

### Phase-overlay design methodology

All skills follow a 4-phase judgment flow overlaid on procedural generation:

1. **Phase 1 — Frame (Context):** Silently infer purpose from prompt:
   - **Signal 1 (reader-action):** who reads this, and what do they do next?
   - **Signal 2 (takeaway):** one sentence — the core message the reader should remember
   - **Signal 3 (tone):** four tone axes inferred from reader + content: formal/casual, precise/loose, optimistic/cautious, urgent/patient
   - No questions asked — inference is silent; user can interrupt with one-line Frame Trace output if wrong.
2. **Phase 2 — Structure (Decision):** Choose topology/template/tab set based on content type and Signal 1. Each skill has a decision matrix.
3. **Phase 3 — Style (Generate):** Select component variants from `base/components.css`. Maps to Frame Signal 3 (tone). Heavy generation delegates to sub-agents.
4. **Phase 4 — Deliver (Verify):** Run QC checklists (14-item pre-flight for diagrams) + brand book rules if `forge.yml` present. Do not write file until all checks pass or user explicitly overrides.

### Brand-aware two-track mode

- **Track A (branded):** `forge.yml` found at `~/.roxabi/forge/<project>/brand/`. Aesthetic/palette/typography/component pre-fills locked. Signals 1 and 2 inferred; tone pre-constrained by brand voice rules. Full `deliver_must_match` QC enforcement.
- **Track B (exploration):** No brand book. Full Frame inference (all four signals). Aesthetic falls through precedence chain.

**Aesthetic detection precedence:**

1. Explicit `--aesthetic` CLI arg
2. `forge.yml` structured brand book (full schema)
3. Legacy `BRAND-BOOK.md` (palette-only)
4. Project name heuristic (lyra → lyra.css, roxabi → roxabi.css)
5. Frame content-type fallback (table maps reader + tone to fallback aesthetic)
6. Default (`editorial.css`)

### Native fgraph diagram system

No external diagram library. 14 pre-built topologies with semantic node shapes and edge semantics.

**Node shapes (class modifiers on `.fgraph-node`):**

- `.cylinder` → database/store
- `.hexagon` → agent/worker/process
- `.pill` → message broker/bus/queue
- `.folded` → file/config/document
- `.diamond` → decision gate
- `.circle` → event/trigger
- default `rect` → service/microservice

**Edge semantics (class modifiers on `.fg-edge` `<path>`):**

- `.data` (purple) → payloads, results
- `.control` (accent) → invocation, routing
- `.write` (green, dashed) → writes to store
- `.feedback` (amber) → loss signal, rewards
- `.async` (muted, dashed) → pub/sub, queues
- `.thick` → critical path (one per diagram)

**Diagram topologies:**
Radial hub (≤6 peers + center), radial ring (peer circle, no center), linear flow (2–4 stages), swimlane (N lanes × N rows), layered (3–4 tiers), machine-clusters (multi-host), sequence (API lifelines + messages), state, gantt, pie, ER, dep-graph, system-architecture (≥15 nodes across user → API → adapter → bus → hub → store layers with 3-card info row).

**Layout primitives:**
All layout in 0–100 coordinate space via CSS custom props (`--x`, `--y`, `--w`, `--h`). Seven critical layout rules:

- R1. Even-stride: card centers at `(100/2N) × (2i+1)` for N cards
- R2. Min 2% gap between cards
- R3. Row clearance: first row inside frame ≥2% below frame label
- R4. Straight arrows: vertical flow has `start.x == end.x`; horizontal has `start.y == end.y`
- R5. Edge color reservation: each semantic color reserved for one purpose
- R6. Solid nodes: cards overlapping edge paths must have `.solid` class or explicit `.fg-edge-mask` rect
- R7. Overlay labels: max 20 chars (no ellipsis truncation)

### HTML distribution rule (Mode A vs Mode B)

- **Mode A (single-file):** all CSS/JS inline (`<style>` + `<script>` blocks). Enables `file://` offline safety. Used by forge-chart, forge-slides, forge-presentation, forge-md.
- **Mode B (multi-file with external assets):** shell HTML links to shared assets in `~/.roxabi/forge/_shared/`. Used by forge-guide, forge-epic, forge-gallery.
  - `gallery-base.css` / `gallery-base.js` → shared once, linked from all gallery HTMLs
  - `fgraph-base.css` → inlined into each chart (Mode A) OR linked from shell `<head>` once when ≥2 tabs use fgraph (Mode B)
  - Per-skill CSS (e.g., `{slug}.css` for guides) → separate file linked from shell

### Output UX schema (3-layer information architecture)

Every output follows three layers:

- **Glance (≤5 sec):** Hero section (`.hero` variant) + `.stat-grid` or `.summary-card`
- **Scan (≤30 sec):** Section labels (`.section-label` variants), tables, diagrams
- **Deep (reference):** Progressive disclosure (`details.disclosure`), metadata strips (`.kv-strip`), inline callouts (`.card.info/warning/critical`)

### Sub-agent delegation pattern

When output > ~300 lines, delegate Phase 3 (file generation) to sub-agent:

1. Main thread completes Phase 1 (Frame) + Phase 2 (Structure decisions)
2. Main thread spawns sub-agent with self-contained prompt: decisions, file paths, content to render, rules
3. Sub-agent reads all reference files and generates output files independently
4. Main thread runs Phase 4 (report + verify) with returned paths

### Canonical AI/infra topologies

Pre-recommended node shapes and edge flows for common patterns:

- **RAG:** linear-flow (query → retriever `.cylinder` → augmented prompt → LLM → answer) with data reads (purple edges)
- **Agentic Search:** radial-hub around planner `.hexagon` with spokes to {search, scrape, summarize, synthesize} tools, control outward + data inward
- **Memory Tiers (Mem0-style):** layered with working (cyan) → episodic (green) → semantic (violet) → archive (slate)
- **Multi-Agent:** dual-cluster or radial-ring around shared blackboard/message bus `.pill`, async pub/sub edges
- **Tool Call:** linear-flow (LLM → tool-router → {tools} → results → LLM) with control down + data back up
- **5-Layer Agent Arch:** layered (perception → memory → planning → action → feedback), feedback arrow closes loop bottom-to-top

### Brand book schema (`forge.yml`)

```yaml
aesthetic: lyra-v2              # locks CSS aesthetic
palette:
  accent: '#ffa500'             # override default
  dark: '#1a1a1a'
  surface: '#2d2d2d'
typography:
  fontStack: 'Inter, sans-serif'
  sizes:
    h1: '2.5rem'
components:
  hero: '.hero.elevated'        # pre-fill variant
  section_label: '.section-label.square'
  card_default: '.card.accent'
deliver_must_match:
  - rule: 'No emoji in headers'
    applies_to: ['guide', 'chart']
  - rule: 'Color contrast ≥ WCAG AAA'
examples:
  - 'examples/guide-v1.html'
  - 'examples/epic-v2.html'
```

### Slide patterns (10 types)

Each `.slide--{type}` selector maps to exact HTML structure recognized by `SlideEngine`:

1. `.slide--title` — hero slide (heading + subtitle)
2. `.slide--section` — section header (thin heading + color bar)
3. `.slide--content` — text-heavy (heading + paragraphs + optional bullet list)
4. `.slide--quote` — full-bleed quote + attribution
5. `.slide--image` — full-bleed image with optional caption
6. `.slide--code` — code block with syntax highlighting
7. `.slide--comparison` — side-by-side columns (vs. table)
8. `.slide--table` — HTML table with sticky header
9. `.slide--diagram` — inline fgraph template (hub-spoke, linear, etc.) + inlined `fgraph-base.css`
10. `.slide--closing` — final slide (call-to-action, contact, etc.)

All slides support `.reveal` child elements for stagger-in animations on scroll. `SlideEngine` wires scroll-snap, keyboard nav (↑/↓, PgUp/PgDn, Home/End), touch swipe.

### Layout rule formulas

**R1 — Even-Stride Horizontal Distribution:**

```
For N cards in a row, card center x = (100 / 2N) × (2i + 1), where i = 0..N-1

N=2: x = [25, 75]
N=3: x = [16.67, 50, 83.33]
N=4: x = [12.5, 37.5, 62.5, 87.5]
N=5: x = [10, 30, 50, 70, 90]
```

**R2 — Minimum Inter-Card Gap:** `stride − width ≥ 2%`.

**R3 — Row Clearance:** first node row ≥2% below frame label.

**R4 — Straight-Arrow Invariant:** vertical flow has `start.x == end.x`; horizontal flow has `start.y == end.y`. All diagonal paths must be intentional cubic beziers.

**R5 — Semantic Edge Color Reservation:**

```
cyan   → only network ingress (user → service)
orange → only message bus (NATS, Kafka, events)
purple → only storage read/write (to .cylinder)
red    → SECURITY ONLY (auth flows, guard boundaries)
amber  → only cloud-API outbound (to .amber node)
dim    → phase-2 / planned / informational (no live flows)
```

**R6 — Node Opacity & Arrow Masking:** if node sits over an edge path, add `.solid` class or `<rect class="fg-edge-mask">` before `<path>`.

**R7 — Overlay Label Length:** max 20 chars for `.fgraph-group__label`.

### Anti-patterns (14 forbidden patterns)

| Pattern | Fix |
| --- | --- |
| Linking to CDN diagram library | Use native `graph-templates/*.html` — inline CSS per Mode A |
| ASCII art in `<pre class="arch">` | Convert to matching fgraph template |
| Emoji in section headers | Remove — use text only |
| Inline `style="color:#..."` on fgraph nodes/edges | Use `.fgraph-base.css` tone classes |
| Hard-coded px coords on `.fgraph-node` | Use `--x/--y` custom props (0..100 space) |
| Plain `<h2>` for section titles | Use `.section-title` or `.section-label` class |
| No hero section (multi-section chart) | Add hero with variant + accent |
| Custom CSS for diagrams with fgraph equivalents | Use template + components.css instead |
| `<title>` and hero `<h1>` mismatch | Keep Signal 2 takeaway consistent across both |
| Unclosed SVG tags or stray `<`/`>` in text nodes | Run SVG validator |
| `url(#id)` arrow marker without matching `<marker id="id">` | Define all markers in `<defs>` |
| Visibility without `:focus-visible` styling | Add visible focus ring |
| No contrast checking on dark backgrounds | Use `var(--text)` (AA min, AAA preferred) |
| Large empty regions in SVG viewBox | Tighten viewBox to 80–95% fill |

## Runtime stack

**Language & entry point:**

- Skill system: JavaScript/TypeScript for skill orchestration (SKILL.md frontmatter-driven)
- Output generation: HTML (templates), CSS (inlined or linked), ES6 JavaScript (module scripts)
- Build scripts: Python 3 (uv run shebangs for zero-config venv)

**Build & generation scripts:**

- `scripts/build.sh` — main build orchestrator
- `scripts/gen-manifest.py` — scans HTML files, extracts `diagram:*` meta tags, generates `manifest.json`
- `scripts/gen-deps.py` — GitHub issue dependency analysis → feeds `dep-graph.html` template
- `scripts/gen-image-manifests.py` — generates `img-manifest.json` for image discovery
- `scripts/render-md.py` — single markdown → themed HTML
- `scripts/render-md-tabs.py` — multiple markdown files → tabbed HTML with URL-hash deep links
- `scripts/gen-plugin-manifest.py` — parses SKILL.md frontmatter, generates `.claude-plugin/plugin.json` + `marketplace.json`
- `scripts/update-meta.py` — refreshes diagram meta tags in-place
- `scripts/seed-meta.py` — bulk-seed meta tags into existing HTML
- `scripts/gen-og-tags.py` — generates Open Graph meta tags for social sharing

**Serving & deployment:**

- Dev server: `references/server/serve.py` (Python, SSE live-reload, watches `~/.roxabi/forge/` for changes, auto-regenerates `manifest.json`)
- Static serving: `python3 -m http.server`
- Persistent daemon: supervisord (optional)
- Cloud: Cloudflare Pages (`make -C ~/.roxabi/forge deploy` pushes `_dist/`)

**Package management:**

- Repo: Bun (main package manager, `bun.lock`)
- Scripts: uv (Python script runner, zero-venv setup)
- Development: biome, vitest, commitlint, lefthook

**Dependencies (`package.json`):**

```json
{
  "devDependencies": {
    "@biomejs/biome": "^2.4.5",
    "@commitlint/cli": "^20.4.3",
    "@commitlint/config-conventional": "^20.4.3",
    "happy-dom": "^20.8.9",
    "lefthook": "^2.1.4",
    "vitest": "^4.1.4"
  }
}
```

## Reusable artifacts (prompts, templates, skill definitions)

### Core methodology prompts

**Frame phase inference (from `frame-phase.md`):**

```
Given this prompt/content, infer three signals silently (do not ask):
1. Signal 1 (reader-action): Who reads this, and what do they do next?
2. Signal 2 (takeaway): One sentence — what should the reader remember?
3. Signal 3 (tone): Four axes — formal/casual, precise/loose, optimistic/cautious, urgent/patient

Example: "explain the three-process NATS topology"
→ Signal 1 (reader=new contributor, action=onboarding)
→ Signal 2 (takeaway=message bus centralizes three async processes)
→ Signal 3 (tone=warm+technical+optimistic+patient)
→ Aesthetic fallback: lyra.css (warm narrative + agent tone)
```

**Track A vs Track B decision (from `design-phase-two-track.md`):**

```
Track A (branded): forge.yml found
  → Signals 1 & 2 inferred; tone pre-constrained by brand voice rules
  → Components pre-filled from brand.components.*
  → deliver_must_match rules enforced at Phase 4

Track B (exploration): no forge.yml
  → All signals inferred (full Frame judgment)
  → Components chosen per Frame tone
  → deliver_must_match skipped
```

### CSS component library (`base/components.css` + `explainer-base.css`)

**Hero variants** (`.hero`):
- `.hero` — plain
- `.hero.left-border` — accent left edge (user guides, architecture, analysis)
- `.hero.elevated` — shadowed / 3D (architecture overviews, audits)
- `.hero.top-border` — accent top edge (timelines, gantt)

**Section labels** (`.section-label`):
- `.section-label.dot` — circular indicator (most common, neutral)
- `.section-label.square` — square indicator (architecture, structure)
- `.section-label.triangle` — triangular indicator (timeline, sequence)

**Card variants** (`.card`):
- `.card` — plain
- `.card.accent` — left border in accent color
- `.card.info` — info callout (blue-tinted)
- `.card.warning` — warning callout (amber-tinted)
- `.card.critical` — critical callout (red-tinted)

**Structured components:**
- `.stat-grid` + `.stat` — at-a-glance numbers
- `.steps` + `.step` + `.step-num` — ordered timeline
- `.phases` + `.phase-card.p1/p2/p3/p4` — milestone phases
- `.table-wrap > table` — scrollable tables with sticky header
- `.cards` → grid of `.card` elements
- `.kv-strip` — inline key-value pairs
- `.summary-card` — glance-layer intro per tab/section
- `.finding.finding--high/medium/low` — audit findings (severity badges)
- `.io-strip` + `.io-box` + `.io-arrow` — input/output explainer flows
- `details.disclosure` — collapsible sections
- `.has-tip` — hover tooltip on term definitions

**Text color tokens (enforced):**
- `var(--text)` → body copy (max readability, AAA contrast)
- `var(--text-muted)` → subtitles, label rows (intermediate emphasis)
- `var(--text-dim)` → metadata, timestamps (lowest emphasis)

### Aesthetic CSS files (`references/aesthetics/`)

Six pre-built aesthetic CSS files with coordinated palettes + typography + component tweaks:

1. **lyra.css** — warm amber, human tone (personal AI, agents, narrative voice)
2. **roxabi.css** — gold, professional (brand, company messaging, pitches)
3. **blueprint.css** — clean lines, monospace (technical, architecture, code)
4. **editorial.css** — serif titles, magazine feel (long-form content, browsing)
5. **caveman.css** — minimalist, high-contrast (stripped-down, accessibility-focused)
6. **terminal.css** — monospace-heavy, CLI reference

Plus variants: `lyra-v2.css`, `cool-dark.css`.

Each aesthetic file provides:
- `:root` CSS variables (palette, typography, spacing, shadows)
- Component overrides (hero, section-label, card variants)
- Dark/light mode support via `data-theme="dark"` / `data-theme="light"`

### Graph templates (`references/graph-templates/`)

14 HTML template fragments, each a self-contained `.fgraph-wrap` with inlined `fgraph-base.css`:

| Template | Topology | Use case | Node count |
| --- | --- | --- | --- |
| `radial-hub.html` | Hub + spokes | Central broker, ≤6 peers | 7 |
| `radial-ring.html` | Peer circle, no center | Cluster, equal nodes | N |
| `linear-flow.html` | Source → middle → sink | Data pipeline, 2–4 stages | 2–4 |
| `lane-swim.html` | N lanes × M rows | Message-flow pipeline, swimlanes | N×M |
| `layered.html` | Stacked tiers | Tiered architecture, 3–4 layers | per layer |
| `deployment-tiers.html` | Same as layered, different styling | Multi-tier deployment | per tier |
| `machine-clusters.html` | Multi-host frames | Cross-machine deployment | N hosts |
| `sequence.html` | Participant lifelines + messages | API/message sequence | N participants |
| `state.html` | State nodes + transitions | State machine, FSM | ≤10 states |
| `gantt.html` | Date axis + bars | Timeline, schedule, roadmap | N bars |
| `pie.html` | SVG arc paths + legend | Proportion, share, composition | N slices |
| `er.html` | Entity boxes + crow's foot | Entity-relationship schema | N entities |
| `dep-graph.html` | Layered DAG | Issue dependencies (fed by gen-deps.py) | N issues |
| `system-architecture.html` | Users → APIs → adapters → bus → hub → stores | Full-system architecture, ≥15 components | ≥15 |

Each template has:
- `.fgraph-wrap` container (SVG for edges, foreignObject nodes)
- Semantic node shapes (`.cylinder`, `.hexagon`, `.pill`, `.folded`, `.diamond`, `.circle`)
- Edge semantics (`.data`, `.control`, `.write`, `.feedback`, `.async`, `.thick`)
- `{{PLACEHOLDER}}` variables for title, nodes, edges
- Inlined `fgraph-base.css`
- Fully responsive (aspect-ratio + custom props maintain layout at any viewport)

### Gallery templates (`references/gallery-templates/`)

Five ready-to-use HTML files:

1. **pivot-gallery.html** — matrix view with col×row grouping. Features: dynamic pivot segs, dynamic filters from DIMS, score sorting, search, size +/−, lightbox, stats counter. Best for comparing variants with scoring/clustering data.
2. **simple-gallery.html** — batch tabs + starring. Best for iterative exploration (V1 → V2 → V3 batches).
3. **comparison-gallery.html** — cards with spec tables + verdict badges. Best for pipeline comparison.
4. **audio-gallery.html** — audio players + engine grouping. Best for TTS engine comparison, voice cloning A/B tests.
5. **multi-mode-gallery.html** — mode tabs + per-mode DIMS + downloads dropdown. Best for multi-dataset visualizations where each mode has different dimensions.

All templates link `../../_shared/gallery-base.css` + `.js` for runtime functionality.

### `gallery-base.css` + `gallery-base.js` (shared gallery runtime)

**JavaScript:**
- `buildDimFilters(DIMS, container)` → discovers unique values, creates filter buttons
- `applyDimFilters(items, DIMS, activeFilters)` → filters visible items
- `buildPivotSegsFromDims(DIMS, colId, rowId, onChange, initial?)` → auto-builds col/row seg buttons
- Lightbox logic (click → overlay, Escape to close, prev/next nav)
- Lazy loading (Intersection Observer on images)
- Starring (localStorage persistence)
- Search filtering (text input, instant filtering)
- Size controls (+/− buttons for thumbnail width)
- Toast notifications

### Slide patterns (10 types, exact HTML)

```html
<!-- slide--title: Hero landing slide -->
<section class="slide slide--title">
  <h1>Deck Title</h1>
  <p class="subtitle">Tagline</p>
</section>

<!-- slide--content: Text + bullet list -->
<section class="slide slide--content">
  <h2>Title</h2>
  <p>Paragraph</p>
  <ul>
    <li class="reveal">Bullet 1</li>
    <li class="reveal">Bullet 2</li>
  </ul>
</section>

<!-- slide--diagram: Inline fgraph -->
<section class="slide slide--diagram">
  <div class="fgraph-wrap">
    <!-- radial-hub.html body here, inlined -->
  </div>
</section>
```

`SlideEngine` wires scroll-snap navigation, keyboard nav, touch swipe, `.reveal` stagger animations, progress dots, slide counter, and `prefers-reduced-motion` support.

## Claude Code nativeness

**Plugin standard format:**

- `.claude-plugin/plugin.json` with version, author, description (v0.7.0)
- `.claude-plugin/marketplace.json` with 8 skills enumerated
- Installation: `claude plugin marketplace add Roxabi/roxabi-forge` → `claude plugin install forge`

**Skill-based architecture:**

8 discrete skills in `plugins/forge/skills/{forge-init,forge-chart,forge-epic,forge-gallery,forge-guide,forge-md,forge-presentation,forge-slides}/`:

- Each skill is a `SKILL.md` file with YAML frontmatter (name, description, summary, version, allowed-tools)
- Slash command triggers (natural-language phrases)
- Allowed-tools declarations (Read, Write, Edit, Bash, Glob, Grep, ToolSearch, Agent)

**Slash command triggers (examples):**

- forge-chart: `"draw"`, `"diagram"`, `"visualize"`, `"sketch"`, `"map"`, `"show the flow"`, `"quick visual"`
- forge-slides: `"create deck"`, `"make a deck"`, `"slides from #N"`, `"slide deck"`, `"presentation deck"`, `"pitch deck"`
- forge-guide: `"write a guide"`, `"create a guide"`, `"multi-tab doc"`, `"recap"`, `"architecture doc"`, `"create a doc"`, `"make a recap"`, `"illustrate architecture"`
- forge-epic: `"visualize #N"`, `"epic preview"`, `"illustrate issue"`, `"map issue"`, `"show epic"`
- forge-gallery: `"gallery"`, `"showcase"`, `"compare visually"`, `"sprite gallery"`, `"side by side"`, `"create a gallery"`, `"show iterations"`, `"multi-mode gallery"`
- forge-md: `"render md"`, `"render markdown"`, `"md to html"`, `"tabbed docs"`, `"combine markdown"`, `"preview md"`, `"render this folder"`
- forge-presentation: `"create presentation"`, `"long-form presentation"`, `"scroll presentation"`, `"visual article"`
- forge-init: `"init forge"`, `"setup forge"`, `"forge init"`, `"forge setup"`, `"initialize forge"`

**Sub-agent delegation:** Uses Claude Code's Agent system for heavy generation. Main thread handles Phases 1–2 (decisions); sub-agent generates files (Phase 3) independently.

**Project metadata (`CLAUDE.md`):** roxabi-forge ships with structured project docs covering repository layout, plugin manifests, distribution rules, edit/sync workflow, style guide, and development process.

## Recommendation: skills to extract for the-forge-flow

### Tier 1 (directly extractable, minimal adaptation)

1. **forge-chart → `generate-diagram` skill** — extract chart generation logic (14 fgraph templates, shape vocab, layout rules); adapt output path + brand config.
2. **forge-slides → `create-slides` skill** — extract 10 slide types + SlideEngine; adapt output path + aesthetic detection.
3. **forge-guide → `write-guide` skill** — extract multi-tab shell + CSS/JS runtime; adapt output path + aesthetic detection.

### Tier 2 (requires decision framework extraction)

4. **Design Methodology Library → reusable `@design-phase` reference** — export Frame → Structure → Style → Deliver as a documented pattern.
5. **Brand Book System → reusable `@brand-aware` reference** — extract `forge.yml` schema + brand loader logic.

### Tier 3 (supporting infrastructure)

6. **CSS Component Library → shared `@ui-components` package** — `base/components.css`, `explainer-base.css`.
7. **Aesthetic System → shared `@aesthetics` package** — all 6 aesthetic CSS files + token system.
8. **Gallery Framework → reusable `generate-gallery` skill** — 5 templates + `gallery-base.css/js`.

### Not extractable (domain-specific to Roxabi)

- `forge-epic` — tied to GitHub issue ingestion + dependency graph.
- `forge-md` — thin wrapper around render-md.py scripts. Lower value.
- `forge-init` — tied to `~/.roxabi/forge/` structure. Not portable without rewrite.

### Repackaging strategy recommendation

Start with **Tier 1.1: extract forge-chart as `generate-diagram`** (lowest risk, highest ROI; 14 templates reusable as-is; only adaptation needed is output paths + brand config; ships in 1–2 weeks; proves design system reusability).

Then add **Tier 1.2 + 1.3**: `create-slides` + `write-guide` (extends same methodology, reuses CSS component library + aesthetics, enables multi-artifact composition).

Parallel track: extract **Tier 2** as reusable libraries (`@design-phase`, `@brand-aware`) — these become the IP reusable across all future skills.

Long-term: build **`generate-gallery`** as Tier 3.

## Summary

Roxabi Forge is a Claude Code plugin that generates publication-grade HTML visual artifacts (diagrams, galleries, guides, slides, presentations) into `~/.roxabi/forge/` with a unified design methodology (Frame → Structure → Style → Deliver). It ships 8 skills: forge-init (setup), forge-chart (single-file diagrams), forge-slides (scroll-snap decks), forge-guide (multi-tab docs), forge-epic (issue analysis), forge-gallery (image galleries), forge-md (markdown rendering), and forge-presentation (long-form scroll).

Core strengths: 14 native fgraph diagram topologies with semantic shapes/edges, 10 slide patterns with reveal animations, 5 gallery templates with dynamic filtering, brand-aware aesthetics (6 presets), CSS component library, and critical layout rules preventing overlap. All outputs are single-file (inline CSS/JS, works with `file://`) or multi-file (split shell + assets).

For the-forge-flow: directly extract forge-chart (diagram generation) as the quickest win. Then reuse the design methodology library, CSS components, and aesthetics system across other skills. The entire system is Claude Code-native with SKILL.md frontmatter, slash command triggers, sub-agent delegation, and brand-book integration.
