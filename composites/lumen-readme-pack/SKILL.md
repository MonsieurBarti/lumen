---
name: lumen-readme-pack
description: Produce a multi-tab HTML "project page" combining a project recap, an architecture diagram, 1–2 key-metrics charts, and a narrative guide. Use to showcase a project's current state, architecture, and metrics in one shareable artifact.
version: 0.1.6 # x-release-please-version
---

# lumen-readme-pack

Composite skill. Produces a multi-tab HTML project showcase: state recap + architecture diagram + key metrics + narrative.

**Tier:** composite (molecular) — orchestrates 4 capabilities in a fixed pipeline. The agent has no runtime discretion over which skills to call or in what order.

## When to invoke

Triggers: `readme pack`, `project page`, `landing doc`, `visual readme`, `showcase the project`, `project page for X`, `landing for X`, `project showcase`.

When triggered, **execute the pipeline immediately**. Do not propose a markdown README alternative or ask the user to confirm — the composite's purpose is to remove that decision.

Do NOT invoke when the user explicitly asks for:
- A plain markdown README → write that directly, do not run this composite.
- An architecture-only doc → use `lumen-architecture-doc` (composite).
- A project state recap only → use `lumen-recap` (capability).
- A metrics dashboard only → use `lumen-chart` (capability).

## Pipeline (fixed, sequential — do not skip, reorder, or substitute)

### Step 1 — Project state (`lumen-recap`)

Invoke `lumen-recap` against the target repo. Capture: one-line purpose, 3–5 KPI tiles, recent activity narrative (last 1–4 weeks), debt hotspots, next steps.

**Output:** the recap HTML (used as source for Step 4 tab content).

### Step 2 — Top-level architecture diagram

Generate one architecture diagram showing the project's top-level structure (services, layers, or top-level packages). Use **one** of:
- **Skill path** — invoke `lumen-diagram` capability.
- **Renderer path** — bun script importing `generateDiagramTemplate` from `src/templates/diagram/`.

Pick a topology that fits the project shape (`linear-flow` for pipelines, `radial-hub` for hub-spoke, `layered` for tiered systems). One diagram only — readme-pack is a high-level showcase, not a deep dive.

**Output:** one diagram HTML.

### Step 3 — Key metrics charts (`lumen-chart`)

Identify 1–2 metrics worth visualizing. Examples by project type:
- Library — bundle size over time, test count, supported runtimes table.
- Service — request volume, latency p50/p95, error rate.
- Tool / CLI — command usage distribution, version adoption.

If the codebase has no clear metrics, skip Step 3 and note in Step 4 that metrics were not surfaced. Do NOT fabricate numbers.

**Output:** 0–2 chart HTMLs.

### Step 4 — Assemble multi-tab guide (`lumen-guide`)

Invoke `lumen-guide` in **single-file mode**. Tab structure:
- **Overview** — project purpose (one paragraph), KPI strip from Step 1's recap, quick-start snippet (lifted from existing README if present).
- **Architecture** — one paragraph orienting the reader, then the Step 2 diagram embedded via `<iframe srcdoc="...">` (HTML-escape the source). Set iframe height 360–540px.
- **Metrics** — embed Step 3 charts as inline SVG or `<iframe srcdoc>` per chart-renderer guidance. Prose context for each chart. Skip this tab if Step 3 was skipped.
- **Recent** — recent-activity narrative + decision log from Step 1's recap. Lift the structure, not the styling.

Aesthetic: default `editorial`. Match the project's existing docs aesthetic if discoverable (`docs/examples/`, `forge.yml`, etc.).

**Output:** one assembled HTML file.

## Reliability contract

- Step 1's recap is the source of truth for project state. Do not invent state in Step 4.
- Step 3 is skippable only when no metrics exist; never fabricate metrics to fill the tab.
- Step 4 is the only step that produces user-visible HTML. Steps 1–3 produce inputs.
- If any step fails, surface the error with the step number and the failing capability's name. Do not ship a partial pack.

## Output

Single HTML file: a 3–4-tab project showcase (Overview / Architecture / [Metrics] / Recent), suitable for sharing as a landing or "project page."

## Quality checks

- Every claim about project state in the Overview / Recent tabs traces back to Step 1's recap.
- Architecture tab embeds the Step 2 diagram (no hand-drawn SVG).
- Metrics tab is either present with real data or absent (no placeholder charts).
- File opens offline (`file://`).

## Execution model

This composite is always invoked via the LLM-authored skill path. Step 1 calls `lumen-recap`; Step 2 may delegate to `lumen-diagram` or the deterministic `generateDiagramTemplate` renderer; Step 3 calls `lumen-chart`; Step 4 calls `lumen-guide`.

When the trigger fires, execute the pipeline. Do not propose a markdown alternative or ask the user to confirm — the composite's purpose is to remove that decision.

## Sources

This composite is novel orchestration. Each constituent capability has its own NOTICE.md attribution:
- `skills/lumen-recap/NOTICE.md`
- `skills/lumen-diagram/NOTICE.md`
- `skills/lumen-chart/NOTICE.md`
- `skills/lumen-guide/NOTICE.md`
