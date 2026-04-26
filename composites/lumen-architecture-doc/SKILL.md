---
name: lumen-architecture-doc
description: Produce a multi-tab, fact-checked HTML architecture document for a codebase by orchestrating lumen-diagram, lumen-guide, and lumen-fact-check in a fixed sequence. Invoke when user asks for an architecture doc, design doc, or to "document this architecture".
version: 0.1.7 # x-release-please-version
---

# lumen-architecture-doc

Composite skill. Produces a multi-tab HTML architecture document with embedded diagrams and a fact-check verification summary.

**Tier:** composite (molecular) — orchestrates 3 capabilities in a fixed pipeline. The agent has no runtime discretion over which skills to call or in what order.

## When to invoke

Triggers: `architecture doc`, `architecture document`, `design doc`, `document this architecture`, `arch doc`, `produce architecture documentation`, `multi-tab architecture overview`.

When triggered, **execute the pipeline immediately**. Do not ask the user to choose between this composite and a lighter-weight alternative (markdown, single diagram, etc.). Trust the trigger.

Do NOT invoke when the user explicitly asks for:
- A single diagram → `lumen-diagram` directly.
- A project state recap → `lumen-recap`.
- Verifying an existing doc → `lumen-fact-check` directly.
- A slide deck → `lumen-slides`.

## Pipeline (fixed, sequential — do not skip, reorder, or substitute)

The agent must execute these three steps in order. Each step's output feeds the next. If a step fails, surface the error with the step number and the failing capability's name; do not ship a partial document.

### Step 1 — Subsystem identification + diagrams

1. Survey the target codebase. Identify **2–6 major subsystems** — boundaries that already have a name in the code or docs (services, packages, hexagonal layers, top-level modules). Stop at 6; if more, group.
2. For each subsystem, generate a diagram via **one** of these paths:
   - **Skill path** — invoke the `lumen-diagram` capability. Use this when the topology requires LLM-authored layout judgement.
   - **Renderer path (preferred when applicable)** — write a small bun script to `/tmp/` that imports `generateDiagramTemplate` from `src/templates/diagram/index.ts` and emits one HTML file per subsystem. Output is deterministic and matches `docs/examples/`. Use this when the subsystem maps cleanly to one of the supported topologies.
3. Pick topology per subsystem:
   - hub-spoke / message bus → `radial-hub`
   - 2–4 stage pipeline → `linear-flow`
   - cross-cutting layers → `layered`
   - peer cluster → `radial-ring`
   - See `skills/lumen-diagram/SKILL.md` for the full topology table.
4. Save each output; record `(subsystem name → diagram html path)` mappings.

**Output:** N diagram HTML files (one per subsystem) and the mapping table.

### Step 2 — Assemble multi-tab guide (`lumen-guide`)

1. Invoke `lumen-guide` in **single-file mode** (`shells/single.html`).
2. Use the **Architecture overview** tab set (declared in lumen-guide's content-type table): `Overview / Components / Flows / Decisions`.
3. Tab content rules:
   - **Overview** — system purpose (one paragraph), subsystem index with anchor links to the Components tab, key external dependencies.
   - **Components** — one section per subsystem from Step 1. Each section: 1–3 paragraph narrative (purpose, key types, key flows), then the subsystem's diagram embedded inline.
     - **Embed via `<iframe srcdoc="...">`**, not by extracting `<svg>` blocks. fgraph topologies ship topology-specific `.fgraph-wrap` CSS rules (different aspect ratios per topology) that collide when multiple diagrams share a single document. The iframe boundary preserves each diagram's intended layout.
     - Set iframe `height` to match the diagram's intrinsic aspect (typically 360–540px). Add `loading="lazy"` for non-default tabs.
     - HTML-escape the diagram source (`&` → `&amp;`, `"` → `&quot;`) before placing into `srcdoc`.
   - **Flows** — 1–3 cross-subsystem flows (request lifecycle, data flow). Use `lumen-diagram` again with `linear-flow` or `lane-swim` topology if a new diagram helps; otherwise prose with anchor links to Components diagrams.
   - **Decisions** — 3–8 architectural decisions in `card.accent` components, each with: decision, alternatives considered, why this one. Skip if codebase has no inferable decisions.
4. Aesthetic: default `editorial`. Match the project's existing docs aesthetic if discoverable.

**Output:** one assembled HTML file.

### Step 3 — Fact-check (`lumen-fact-check`)

1. Invoke `lumen-fact-check` on the Step 2 output file.
2. Apply corrections in place (lumen-fact-check does this).
3. The verification summary appended by lumen-fact-check stays as the final tab or final section of the Components tab.

**Output:** the corrected guide HTML, ready to ship.

## Reliability contract

This composite is reliable IFF:
- Each constituent capability is invoked verbatim per its own SKILL.md — no parameter improvisation.
- Steps run to completion in order. No skipping Step 3 to save time.
- Diagram embedding in Step 2 lifts SVG only — never the full HTML wrapper.

## Output

Single HTML file: a 4-tab architecture guide with embedded subsystem diagrams and a fact-check verification summary.

## Quality checks

- Every diagram embedded in the guide came from a Step 1 invocation (no hand-drawn SVG).
- Every Components-tab section corresponds to a subsystem identified in Step 1.
- Fact-check verification summary present.
- No claims silently passed (per lumen-fact-check's own quality contract).
- File opens offline (`file://`), no broken asset references.

## Execution model

This composite is always invoked via the LLM-authored skill path. There is no single deterministic tool route — by design — because the composite *orchestrates* other skills and renderers. Step 1 may delegate to either the `lumen-diagram` skill or the deterministic `generateDiagramTemplate` renderer; Step 2 is LLM-authored HTML assembly; Step 3 invokes `lumen-fact-check`.

When the trigger fires, execute the pipeline. Do not propose a markdown alternative or ask the user to confirm — the composite's purpose is to remove that decision.

## Sources

This composite is novel orchestration. Each constituent capability has its own NOTICE.md attribution:
- `skills/lumen-diagram/NOTICE.md`
- `skills/lumen-guide/NOTICE.md`
- `skills/lumen-fact-check/NOTICE.md`
