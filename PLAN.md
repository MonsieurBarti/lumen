# Lumen Integration Plan

**Version:** v0.2.0 target
**Status:** Draft for review (plannotator)
**Owner:** Lumen scaffold landed; this plan describes how to fill it.

---

## 1. Goal

Ship a single npm package `@the-forge-flow/lumen` that, from the **same `skills/` tree**, exposes:

1. **A Claude Code plugin** — 8 skills via `.claude-plugin/plugin.json` + `marketplace.json`.
2. **A PI coding-agent extension** — runtime tool(s) registered via `package.json::pi.extensions` *and* the same skills exposed via `pi.skills`.

Hard rule (user constraint): **copy what works from upstreams, do not re-create**. Improve only by making them work together.

The 8 skills:

| Skill | Purpose | Primary upstream |
|---|---|---|
| `lumen-diagram` | Architecture / flow / sequence / UML / agent-pattern diagrams | roxabi-forge (14 fgraph topologies), gmdiagram (pipeline), ADG (palette+masking), fireworks (AI templates) |
| `lumen-chart` | Bar / pie / line / scatter / radar / funnel / table / etc. | gmdiagram (`gm-data-chart` pipeline + Nice Numbers) |
| `lumen-mermaid` | Mermaid diagrams with zoom / pan / fit / export | visual-explainer (`mermaid.ts` + `MERMAID_SHELL_JS`) |
| `lumen-slides` | Magazine-quality scroll-snap deck | roxabi-forge (SlideEngine + 10 patterns) |
| `lumen-gallery` | Image / audio / pivot galleries | roxabi-forge (5 templates + DIMS runtime) |
| `lumen-guide` | Multi-tab guide shell + component library | roxabi-forge (`forge-guide`) |
| `lumen-recap` | Project recap (state + recent decisions + debt hotspots) | visual-explainer (`project-recap`) + roxabi |
| `lumen-fact-check` | Verify document claims against codebase, correct in place | visual-explainer (`fact-check`) |

---

## 2. Architectural Decisions

### 2.1 One repo, two manifests, shared `skills/`

```
lumen/
├── package.json                       # name, pi.extensions, pi.skills, scripts
├── .claude-plugin/
│   ├── plugin.json                    # CC: declares skills/ subdirs
│   └── marketplace.json               # CC: marketplace listing
├── skills/                            # SOURCE OF TRUTH — both CC and PI read this
│   ├── _shared/                       # cross-cutting assets (NEW; created in Phase 1)
│   ├── lumen-diagram/   …             # 8 skill dirs, SKILL.md each
│   └── …
├── src/                               # TypeScript PI extension
│   ├── index.ts                       # PI entry: registers tool + lifecycle hooks
│   ├── templates/                     # JSON → HTML renderers (lifted from visual-explainer)
│   ├── utils/                         # validators, file-writer, browser-open
│   └── types.ts                       # VisualType, Aesthetic, Theme, Palette
└── dist/                              # built; prebuild copies skills/ → dist/skills/
```

`prebuild` already copies `skills/` → `dist/skills/`. Both manifests then point at:
- CC: `skills/lumen-…` (repo-relative, used at install time)
- PI: `./dist/skills` (built artifact, used at runtime)

### 2.2 Two output paths to the same visual

| Path | Audience | Mechanism | When used |
|---|---|---|---|
| **(A) Claude-authored** | Both CC and PI's *skill system* | LLM reads `SKILL.md` + `_shared/templates/*.html` + `_shared/aesthetics/*.css`, **authors the HTML directly**, writes via `Write`/equivalent | Default. Maximum flexibility, handles edge cases. |
| **(B) Deterministic renderer** | PI runtime tool | TS function `render({type, data, aesthetic}) → string`, called via `lumen.generate_visual` tool | When the LLM prefers JSON-in/HTML-out (validated input, repeatable output). Mirrors visual-explainer's current model. |

Both paths consume the **same `_shared/templates/*.html`** scaffolds and the **same `_shared/aesthetics/*.css`** so the visual identity stays coherent. TS functions inline shared scaffolds at build time (read-as-text via `import "*.html?raw"` or a small build-time codegen step — decided in Phase 1).

### 2.3 No Python, no librsvg

Fireworks-tech-graph ships a 1556-line Python SVG renderer + librsvg dependency for PNG export. We **drop both**:
- Diagram layout that fireworks does in Python (orthogonal routing, jump-over arcs) is solved equivalently in roxabi-forge by **CSS Grid + flexbox in 0–100 coordinate space with custom props** (`--x`, `--y`, `--w`, `--h`). LLMs do not do coordinate math — CSS does.
- PNG/PDF export is **out of scope for v0.2**. If needed later, use `@resvg/resvg-js` (Node-native, no system deps).

We keep the **prompt recipes** from fireworks (RAG / Mem0 / Multi-Agent / Tool Call / Agent Memory Types) and re-implement them as JSON fixtures + `_shared/templates/*.html` topologies.

### 2.4 ADG palette as the default aesthetic

ADG's dark-themed semantic palette (cyan-frontend, emerald-backend, violet-database, amber-cloud, rose-security, orange-bus, slate-external) becomes one of the aesthetics in `_shared/aesthetics/dark-professional.css`, and is the default for `lumen-diagram`. ADG's z-order arrow masking (opaque backing rect + transparent fill rect, arrows rendered first in document order) becomes a documented technique in `_shared/references/arrow-masking.md`.

### 2.5 Frame → Structure → Style → Deliver as the shared methodology

Lifted from roxabi-forge to `_shared/references/methodology.md`. Each `lumen-*` SKILL.md links to it rather than restating it. Two-track mode (branded / exploration) ported as-is; brand-book lookup adapted from `~/.roxabi/forge/forge.yml` to project-relative `./forge.yml` or `./brand.yml` (TBD in Phase 1).

---

## 3. Shared Assets (`skills/_shared/`)

**Created in Phase 1, before any individual skill is wired up.**

```
skills/_shared/
├── templates/
│   ├── fgraph/                        # 14 topologies, copied verbatim from roxabi-forge/references/graph-templates/
│   │   ├── radial-hub.html            ├── lane-swim.html      ├── sequence.html
│   │   ├── radial-ring.html           ├── layered.html        ├── state.html
│   │   ├── linear-flow.html           ├── deployment-tiers.html ├── gantt.html
│   │   ├── machine-clusters.html      ├── pie.html            ├── er.html
│   │   └── dep-graph.html             └── system-architecture.html
│   ├── chart/                         # 9 chart types (gmdiagram template-*.html; CSS-only, no SVG math)
│   │   └── bar/pie/line/area/scatter/radar/funnel/bubble/table
│   ├── slide-patterns/                # 10 slide patterns (roxabi)
│   │   └── title/section/content/quote/image/code/comparison/table/diagram/closing
│   ├── gallery/                       # 5 templates (roxabi)
│   │   └── pivot/simple/comparison/audio/multi-mode
│   ├── guide-shell.html               # roxabi multi-tab shell
│   ├── mermaid-shell.html             # visual-explainer mermaid scaffold
│   └── ai-patterns/                   # fireworks recipes ported to fgraph topologies
│       └── rag.html / mem0.html / multi-agent.html / tool-call.html / agent-memory.html
├── aesthetics/                        # CSS files; each defines :root vars + component overrides
│   ├── dark-professional.css          # default; ADG palette + roxabi tokens fused
│   ├── hand-drawn.css
│   ├── light-corporate.css
│   ├── cyberpunk-neon.css
│   ├── blueprint.css                  # roxabi blueprint
│   ├── warm-cozy.css
│   ├── minimalist.css
│   ├── terminal-retro.css             # roxabi terminal fused with gmdiagram terminal-retro
│   ├── pastel-dream.css
│   ├── notion.css
│   ├── material.css
│   ├── glassmorphism.css
│   ├── editorial.css                  # roxabi
│   ├── lyra.css                       # roxabi
│   └── roxabi.css                     # roxabi
├── components/
│   ├── components.css                 # hero, section-label, card variants, stat-grid (roxabi)
│   ├── fgraph-base.css                # node shapes (.cylinder/.hexagon/.pill/.folded/.diamond/.circle), edge semantics (.data/.control/.write/.feedback/.async/.thick)
│   ├── gallery-base.css               # roxabi shared
│   ├── gallery-base.js                # buildDimFilters, applyDimFilters, buildPivotSegs, lightbox, lazy-load, starring
│   ├── slide-engine.js                # roxabi SlideEngine (scroll-snap, kbd nav, touch, reveal anim)
│   └── mermaid-shell.js               # visual-explainer zoom/pan/fit/export IIFE
├── schemas/                           # JSON Schema Draft-7; both validators (TS) and skill prompts ref these
│   ├── shared.json                    # styleEnum, formatEnum, axisConfig, legendConfig
│   ├── diagram/                       # 9 diagram type schemas (gmdiagram)
│   └── chart/                         # 9 chart type schemas (gmdiagram)
└── references/                        # Markdown; loaded on demand by SKILL.md links
    ├── methodology.md                 # Frame → Structure → Style → Deliver (roxabi, lifted)
    ├── two-track-mode.md              # branded vs exploration (roxabi)
    ├── arrow-masking.md               # ADG z-order technique
    ├── nice-numbers.md                # gmdiagram axis algorithm
    ├── layout-rules.md                # roxabi R1–R7 anti-overlap rules
    ├── shape-vocab.md                 # roxabi node shape semantic mapping
    ├── edge-semantics.md              # roxabi edge color/dash mapping
    ├── ai-pattern-recipes.md          # fireworks RAG/Mem0/Multi-Agent/Tool-Call/Memory-Types prompts
    ├── icons-catalog.md               # gmdiagram 100+ Tabler icons
    └── design-system.md               # gmdiagram color/typography/spacing
```

**Provenance traceability:** every file in `_shared/` carries a top-of-file comment `/* lifted from <upstream-repo>:<path>@<commit> */` so we can re-pull on upstream updates.

---

## 4. PI Extension (TypeScript, `src/`)

Lift verbatim from visual-explainer; extend the registered tool to handle all visual types.

### 4.1 Files to lift

| visual-explainer source | → lumen target | Modification |
|---|---|---|
| `src/index.ts` | `src/index.ts` | Rename tool `tff-generate_visual` → `lumen-generate_visual`; extend `type` enum to 12 values |
| `src/types.ts` | `src/types.ts` | Add new types: `Slides`, `Gallery`, `Guide`, `Recap`, `FactCheck` |
| `src/templates/architecture.ts` | `src/templates/architecture.ts` | Replace inline scaffold with `_shared/templates/fgraph/system-architecture.html` |
| `src/templates/mermaid.ts` | `src/templates/mermaid.ts` | Verbatim; pulls from `_shared/components/mermaid-shell.js` + `templates/mermaid-shell.html` |
| `src/templates/data-table.ts` | `src/templates/chart-table.ts` | Generalize to all 9 chart types via `_shared/templates/chart/*` |
| `src/templates/shared.ts` | `src/templates/shared.ts` | Replace `PALETTES` constant with loader that reads `_shared/aesthetics/*.css` at build time |
| `src/utils/validators.ts` | `src/utils/validators.ts` | Verbatim; add JSON-Schema validation against `_shared/schemas/*.json` |
| `src/utils/file-writer.ts` | `src/utils/file-writer.ts` | Verbatim; default output dir configurable (PI: `~/.agent/diagrams/`, CC: `./dist/lumen/`) |
| `src/utils/browser-open.ts` | `src/utils/browser-open.ts` | Verbatim |

### 4.2 Tool surface

```ts
// Single tool, 12 types:
lumen-generate_visual({
  type: "diagram" | "chart" | "mermaid" | "architecture"
      | "flowchart" | "sequence" | "er" | "state" | "table" | "diff"
      | "slides" | "gallery" | "guide" | "recap" | "fact-check",
  content: string,                  // natural-language input OR JSON for deterministic types
  title: string,
  aesthetic?: AestheticId,          // 15 options; default "dark-professional"
  theme?: "dark" | "light",
  filename?: string,
})
```

PI also gets the slash commands lifted from visual-explainer:
- `/visual-reopen <n>` — reopen recent file
- `/visual-list` — list last 10

Renamed to `/lumen-reopen` and `/lumen-list` for namespacing.

### 4.3 Lifecycle

- `session_start`: non-blocking npm-update check (lifted from v-e), display "Lumen ready".
- `session_shutdown`: cleanup tempDirs.

### 4.4 Build pipeline

`prebuild` (existing) already copies `skills/` → `dist/skills/`. Add:

```
"build": "bun run scripts/inline-shared-assets.ts && tsc -p tsconfig.build.json"
```

`scripts/inline-shared-assets.ts` reads each TS template's referenced `_shared/templates/*.html` + `_shared/aesthetics/*.css` and inlines them as TypeScript string constants. This avoids runtime `fs` and keeps the published package tree-shakable.

---

## 5. Per-Skill Plan

For each skill: **what we lift, from where, what shape ships in `skills/lumen-X/`**.

Common shape:
```
skills/lumen-X/
├── SKILL.md                # frontmatter + body; links into _shared/
├── examples/               # 3–5 example outputs (HTML files)
└── (no per-skill assets — all shared in _shared/)
```

### 5.1 `lumen-diagram` ⟵ roxabi-forge + ADG + gmdiagram + fireworks

**Lifts:**
- `_shared/templates/fgraph/*.html` ← `roxabi-forge/references/graph-templates/*.html` (14 files, verbatim)
- `_shared/templates/ai-patterns/*.html` ← fireworks prompt recipes ported to fgraph topologies (rag → linear-flow + radial-hub composite, mem0 → layered + radial-hub, multi-agent → radial-hub with sub-spokes, tool-call → state with self-loop, agent-memory-types → layered)
- `_shared/components/fgraph-base.css` ← `roxabi-forge/references/fgraph-base.css`
- `_shared/aesthetics/dark-professional.css` ← ADG palette (cyan/emerald/violet/amber/rose/orange/slate) merged with roxabi tokens
- `_shared/references/{arrow-masking,layout-rules,shape-vocab,edge-semantics,ai-pattern-recipes}.md`
- `_shared/schemas/diagram/*.json` ← `gm-architecture/skills/gm-architecture/assets/schema-*.json` (9 files)

**`SKILL.md` body:**
1. When to trigger (keywords from roxabi: "draw", "diagram", "visualize", "sketch", "map", "show the flow")
2. Two-step pipeline (gmdiagram): **Step 1** — extract JSON conforming to `_shared/schemas/diagram/<type>.json`. **Step 2** — render by selecting topology from `_shared/templates/fgraph/`, applying aesthetic from `_shared/aesthetics/`, following layout rules from `_shared/references/layout-rules.md`.
3. Frame → Structure → Style → Deliver checklist
4. AI-pattern shortcuts: if user mentions "RAG", "Mem0", "multi-agent", etc., use the matching `_shared/templates/ai-patterns/*.html` directly.
5. QC: 14-item pre-flight from roxabi (R1–R7 + arrow-masking + label length + color contrast + responsive + offline-safe)

**PI tool route:** `lumen-generate_visual({type: "diagram", ...})` → `src/templates/architecture.ts` deterministic renderer.

### 5.2 `lumen-chart` ⟵ gmdiagram

**Lifts:**
- `_shared/templates/chart/*.html` ← `gm-data-chart/skills/gm-data-chart/assets/template-*.html` (9 files)
- `_shared/schemas/chart/*.json` ← `gm-data-chart/skills/gm-data-chart/assets/schema-*.json` (9 files)
- `_shared/references/nice-numbers.md` ← `gm-data-chart/skills/gm-data-chart/references/axis-and-grid.md`

**Nice Numbers algorithm:** spec lifted to `_shared/references/nice-numbers.md`; **also** implemented in `src/utils/nice-numbers.ts` (used by deterministic chart renderers when input is JSON values + `desiredTickCount`).

**`SKILL.md` body:**
1. Trigger keywords: "chart", "graph", "plot", "compare", "show data", "bar/pie/line/etc."
2. Two-step pipeline (Step 1 always): extract JSON values + axis config; Step 2 picks template + applies Nice Numbers for ticks.
3. Format: HTML/SVG default (PNG/PDF deferred).

### 5.3 `lumen-mermaid` ⟵ visual-explainer

**Lifts (verbatim, this is the smallest, lowest-risk skill):**
- `_shared/templates/mermaid-shell.html` ← `visual-explainer/src/templates/mermaid.ts` (the HTML scaffold portion)
- `_shared/components/mermaid-shell.js` ← `MERMAID_SHELL_JS` (zoom/pan/fit/expand-to-tab IIFE)
- `_shared/components/mermaid-shell.css` ← `MERMAID_SHELL_CSS`

**`SKILL.md` body:**
1. Trigger: "mermaid", "draw diagram with mermaid", or when CC/PI knows mermaid syntax fits better.
2. Output: single HTML file with `<script type="text/plain" class="diagram-source">` containing escaped mermaid syntax + Mermaid CDN load + explicit `mermaid.render()` call.
3. Zoom/pan/fit semantics documented (min 0.08, max 6.5, readability floor 0.58, smart fit on load).

### 5.4 `lumen-slides` ⟵ roxabi-forge + visual-explainer

**Lifts:**
- `_shared/templates/slide-patterns/*.html` ← roxabi 10 patterns (`.slide--{title,section,content,quote,image,code,comparison,table,diagram,closing}`)
- `_shared/components/slide-engine.js` ← roxabi SlideEngine (scroll-snap, ↑/↓/PgUp/PgDn/Home/End, touch swipe, prefers-reduced-motion, `.reveal` stagger)
- `_shared/aesthetics/{lyra,roxabi,blueprint,editorial,caveman,terminal}.css` ← roxabi aesthetic files

**`SKILL.md` body:**
1. Trigger: "create deck", "slides", "presentation", "pitch deck"
2. Single-file mode (Mode A): all CSS/JS inlined for offline `file://` safety
3. Aesthetic detection chain (roxabi two-track mode): CLI arg → `forge.yml` → `BRAND-BOOK.md` → project name heuristic → content-type fallback → `editorial.css`
4. Per-slide pattern selection table (matches Frame Signal 1: reader-action)

### 5.5 `lumen-gallery` ⟵ roxabi-forge

**Lifts:**
- `_shared/templates/gallery/*.html` ← roxabi 5 templates (pivot, simple, comparison, audio, multi-mode)
- `_shared/components/gallery-base.{css,js}` ← roxabi runtime (`buildDimFilters`, `applyDimFilters`, `buildPivotSegsFromDims`, lightbox, lazy-load, star, search, size controls, toast)

**`SKILL.md` body:**
1. Trigger: "gallery", "showcase", "compare visually", "side by side", "show iterations", "multi-mode"
2. DIMS pattern: each gallery item exposes `data-*` attributes; runtime auto-discovers filterable dimensions
3. Mode B (split files): `_shared/components/gallery-base.{css,js}` linked rather than inlined — galleries can be many MB so size matters

### 5.6 `lumen-guide` ⟵ roxabi-forge

**Lifts:**
- `_shared/templates/guide-shell.html` ← roxabi multi-tab shell
- `_shared/components/components.css` ← roxabi component library (hero variants, section-label dot/square/triangle, card.accent/info/warning/critical, stat-grid, steps, phases, table-wrap, kv-strip, summary-card, finding--{high/medium/low}, io-strip, details.disclosure, has-tip)
- 3-layer information architecture reference (Glance ≤5s / Scan ≤30s / Deep) ← `_shared/references/methodology.md`

**`SKILL.md` body:**
1. Trigger: "write a guide", "multi-tab doc", "architecture doc"
2. Mode B (split shell + per-tab fragments)
3. Tab-set decision matrix from Frame Signal 1

### 5.7 `lumen-recap` ⟵ visual-explainer + roxabi

**Lifts:**
- Recap prompt + flow ← `visual-explainer:project-recap` skill
- `_shared/templates/fgraph/system-architecture.html` (used as recap visual)
- Hero + stat-grid components (roxabi)

**`SKILL.md` body:**
1. Trigger: "recap", "project state", "where are we", "rebuild mental model"
2. Steps: (a) scan codebase for current state, (b) read recent git log + open files, (c) identify cognitive-debt hotspots, (d) compose into a hero + stat-grid + sections + system-architecture diagram, (e) output single HTML file.

### 5.8 `lumen-fact-check` ⟵ visual-explainer

**Lifts:**
- Fact-check prompt + flow ← `visual-explainer:fact-check` skill (claim extraction, codebase grep/read loop, in-place correction)

**`SKILL.md` body:**
1. Trigger: "fact-check this doc", "verify this against the codebase"
2. Steps: (a) extract testable claims (file paths, function names, version numbers, behavioral assertions), (b) for each: grep/read codebase, (c) classify as VERIFIED / WRONG / UNCERTAIN, (d) for WRONG, propose in-place edit using `Edit`.
3. Output: edited document + summary table of corrections.

---

## 6. Manifest Updates

### 6.1 `.claude-plugin/plugin.json` (already exists)

No structural change needed; current 8-skill flat array is fine. Verify each skill path matches the actual directory after Phase 1.

### 6.2 `.claude-plugin/marketplace.json`

Add author/repo/license fields per gmdiagram convention. Single-plugin marketplace (no sub-plugins).

### 6.3 `package.json`

Already has:
```json
"pi": {
  "extensions": ["./dist/index.js"],
  "skills": ["./dist/skills"]
}
```

Add `keywords`, `repository`, `homepage`, `bugs`. Ensure `files` includes `dist/` and `skills/` (skills as fallback if PI/CC reads source directly).

---

## 7. Testing Strategy

Vitest already configured (85/80 thresholds).

| Layer | What | Examples |
|---|---|---|
| **Unit (`tests/utils/`)** | Validators, Nice Numbers, file-writer, browser-open | `nice-numbers.spec.ts` covers Wilkinson edge cases (range 0.0001–1e9, negative ranges, single-value series) |
| **Snapshot (`tests/templates/`)** | TS template renderers — exact HTML output for canned JSON inputs | One snapshot per (type × aesthetic) — guards against accidental visual drift |
| **Asset integrity (`tests/_shared/`)** | Every `_shared/templates/*.html` parses as valid HTML; every `_shared/aesthetics/*.css` parses as valid CSS; every `_shared/schemas/*.json` is valid JSON-Schema-Draft-7 | Run on CI |
| **Skill manifest** | Each `skills/lumen-*/SKILL.md` has required frontmatter (`name`, `description`, `version`); `plugin.json` skill list matches actual directories | `tests/skills.spec.ts` |
| **End-to-end (manual)** | Generate one example per skill, open in browser, verify offline-safe (`file://`) | `examples/` per skill, generated in CI build job |

CI workflow already present (lint → typecheck → test, coverage on main). Add a `verify-examples` job that builds and inspects each `skills/*/examples/*.html` for bad references and missing offline-safety.

---

## 8. Phased Rollout

Each phase ends with green CI + a working demo of one or more skills. **No phase-internal partial work.**

### Phase 1 — Foundation (1–2 days)

**Blocks all other phases.**

1. Clone the 5 upstream repos under `lumen/upstreams/` (gitignored). One-shot reference for lifting; **not** committed.
2. Create `skills/_shared/` tree (Section 3); copy each artifact verbatim with provenance comment header.
3. Write `_shared/references/methodology.md`, `arrow-masking.md`, `nice-numbers.md`, `layout-rules.md`, `shape-vocab.md`, `edge-semantics.md`, `ai-pattern-recipes.md`, `icons-catalog.md`, `design-system.md`, `two-track-mode.md`.
4. Decide and implement asset-inlining strategy (build-time codegen vs. `import "*.html?raw"` — pick whichever is simpler with bun + tsc).
5. Asset-integrity tests pass.

**Done = `bun run build && bun test` green; `_shared/` complete; example diagram generated by hand from a template renders.**

### Phase 2 — `lumen-mermaid` first (smallest, isolated) (½ day)

1. Lift `mermaid.ts` + `MERMAID_SHELL_JS/CSS` from visual-explainer to `src/templates/mermaid.ts` + `_shared/components/`.
2. Write `skills/lumen-mermaid/SKILL.md`.
3. Add 3 `examples/*.html`.
4. Add snapshot test.
5. Wire into `lumen-generate_visual` tool with `type: "mermaid"`.

**Done = both paths (LLM-authored from CC skill, deterministic via PI tool) produce identical visual on a sample mermaid graph.**

### Phase 3 — PI extension end-to-end (1 day)

1. Lift `src/index.ts`, `types.ts`, `utils/{validators,file-writer,browser-open}.ts` from visual-explainer.
2. Rename tool / commands to `lumen-*`.
3. Wire `mermaid` type only (others stub-throw "not yet implemented").
4. `bun run build` produces a valid PI extension; manual test in PI confirms tool registration + browser launch.

**Done = PI invocation generates a mermaid HTML file, opens it, recent-file list works.**

### Phase 4 — `lumen-diagram` (1–2 days)

1. SKILL.md (Section 5.1).
2. `src/templates/architecture.ts` deterministic renderer for the 14 fgraph topologies.
3. `examples/*.html` covering: simple architecture, microservices, RAG pattern, sequence diagram, state machine.
4. Snapshot tests per topology × dark-professional aesthetic.
5. Wire `type: "diagram"` in PI tool.

**Done = "draw the architecture of [system X]" produces a clean dark-pro diagram in both CC and PI.**

### Phase 5 — `lumen-chart` (1 day)

1. SKILL.md (Section 5.2).
2. `src/utils/nice-numbers.ts` + tests.
3. `src/templates/chart-*.ts` for the 9 chart types.
4. `examples/*.html`.
5. Wire `type: "chart"` in PI tool.

**Done = "show me a bar chart of these values" works, axis ticks are nice, both paths agree.**

### Phase 6 — `lumen-slides` (1–2 days)

Roxabi SlideEngine port + 10 patterns + 6 aesthetics. Examples cover one full deck.

### Phase 7 — `lumen-guide` (1 day)

Multi-tab shell + component library. Example: a 3-tab guide for lumen itself ("intro / how-to / reference") — dogfood.

### Phase 8 — `lumen-gallery` (1 day)

5 templates + DIMS runtime. Example: a comparison gallery of the 14 fgraph topologies (eats own dogfood).

### Phase 9 — `lumen-recap` + `lumen-fact-check` (1–2 days)

Lift visual-explainer prompts + flow. Recap example: lumen's own state. Fact-check example: this PLAN.md against the codebase.

### Phase 10 — Release (½ day)

1. Bump to v0.2.0.
2. Release-please PR; npm publish via existing workflow.
3. Update README with install + usage for both CC and PI.
4. Submit to Claude Code marketplace + PI extension index.

**Total estimate: 10–13 working days.**

---

## 9. Open Decisions

These need user input before committing to specifics. Listed in priority order.

1. **Asset inlining (Phase 1, blocking).** Two viable approaches:
   - (a) Build-time codegen: `scripts/inline-shared-assets.ts` reads `_shared/` files and emits `src/templates/_inlined.ts` with string constants.
   - (b) `import scaffold from "./scaffold.html?raw"` — relies on bun's loader; doesn't survive `tsc` cleanly without a bundler step.
   - **Recommendation: (a).** Simpler, works with plain `tsc`, no bundler required.

2. **Brand-book location.** Roxabi reads `~/.roxabi/forge/forge.yml` (user-global). For lumen, prefer **project-relative**: search `./forge.yml` → `./brand.yml` → `./.lumen/brand.yml`, falling back to defaults. Confirms?

3. **Scope of `lumen-fact-check`.** Visual-explainer's fact-check writes corrections in place via `Edit`. In PI extension context, should it also write, or only *propose* corrections and let the user apply? **Recommendation: propose-only in v0.2; in-place writes in v0.3 once we have confidence.**

4. **Whether to keep `examples/` in published npm package.** Adds ~1–2 MB to install. **Recommendation: yes** — they double as documentation and integration test fixtures. Gate via `files` field if size becomes a concern.

5. **Codex (`.codex-plugin/`) support.** gmdiagram ships both `.claude-plugin/` and `.codex-plugin/`. Lumen has only the former. **Recommendation: defer to v0.3** unless user wants Codex-day-one.

6. **PI deterministic-renderer fallback when CC.** Should the CC skills *also* be able to call `lumen-generate_visual` (via PI tool wrapping in CC), or only the LLM-authored path? **Recommendation: LLM-authored only in CC.** Avoids cross-host coupling. The deterministic path is a PI affordance.

---

## 10. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Upstream HTML scaffolds don't compose cleanly when CSS classes overlap | Medium | High | Phase 1 includes a "render every template under every aesthetic" smoke test — catches conflicts before any skill ships |
| Snapshot tests churn on every visual tweak | High | Low | Tolerate it; visual changes should require explicit snapshot updates as a review gate |
| PI / CC behavior diverges per skill | Medium | Medium | Section 5 explicitly names both paths; each skill's `examples/` includes one per host |
| LLM authoring drifts from deterministic renderer output | Medium | Low | Acceptable — they target different audiences. Document differences in `_shared/references/two-paths.md`. |
| ADG palette + roxabi tokens conflict in `dark-professional.css` | Low | Medium | Phase 1: explicitly merge with ADG semantic vars taking precedence for diagram-type fills/strokes; roxabi tokens for layout/typography |
| Mermaid CDN unavailable offline | Low | Medium | `_shared/components/mermaid-shell.js` already loads via CDN; visual-explainer's pattern is `file://`-safe because the CDN is fetched on first browser open. Document this; offer an opt-in "vendored mermaid" build later |
| Fireworks AI patterns lose info in CSS port (no orthogonal routing) | Medium | Low | The 5 patterns we port are all expressible as composite fgraph topologies. If a specific pattern's clarity suffers, fall back to mermaid for that one case |
| Sub-agent delegation (roxabi pattern) doesn't apply uniformly to PI | Low | Low | Document as CC-only optimization in `_shared/references/methodology.md`; PI uses single-pass generation |

---

## 11. Out of Scope (v0.2)

- PNG/PDF export (defer to v0.3 with `@resvg/resvg-js`)
- Codex plugin manifest
- `forge-init`, `forge-md`, `forge-presentation`, `forge-epic` skills (low ROI / not portable)
- Live-reload SSE server (roxabi has one; lumen users open files manually)
- TypeScript Nice-Numbers as separate published library
- i18n / RTL layouts
- Print stylesheets

---

## 12. Definition of Done (v0.2.0)

- [ ] All 8 skills land with SKILL.md + 3+ examples each
- [ ] PI extension registers `lumen-generate_visual` + `/lumen-reopen` + `/lumen-list`
- [ ] CC plugin installs and all 8 skills are discoverable
- [ ] All 15 aesthetics render correctly across all applicable visual types (smoke matrix in CI)
- [ ] Snapshot tests cover each (type × aesthetic) pair for deterministic renderers
- [ ] Test coverage ≥ 85% lines / 80% branches (existing thresholds)
- [ ] README documents install + usage for both CC and PI with a side-by-side example
- [ ] Published to npm; release-please tagged v0.2.0
- [ ] No file in `_shared/` lacks a provenance comment
