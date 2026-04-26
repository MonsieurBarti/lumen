---
name: lumen-launch-deck
description: Produce a magazine-quality scroll-snap HTML deck announcing a new feature, release, or milestone. Combines a state recap, metrics charts, a hero diagram, and an assembled slide deck. Invoke for "launch deck", "release deck", "announcement slides".
version: 0.1.4 # x-release-please-version
---

# lumen-launch-deck

Composite skill. Produces a single-file scroll-snap presentation deck announcing a release or feature launch.

**Tier:** composite (molecular) — orchestrates 4 capabilities in a fixed pipeline. The agent has no runtime discretion over which skills to call or in what order.

## When to invoke

Triggers: `launch deck`, `release deck`, `announcement deck`, `announcement slides`, `release announcement`, `create a launch deck for X`, `feature launch deck`, `milestone deck`.

When triggered, **execute the pipeline immediately**. Do not propose a plain slide deck or ask the user to confirm scope — the composite's purpose is to remove that decision.

Do NOT invoke when the user explicitly asks for:
- A generic deck on a topic → use `lumen-slides` (capability).
- A project recap (no deck) → use `lumen-recap` (capability).
- A single launch announcement chart → use `lumen-chart` (capability).
- Architecture documentation → use `lumen-architecture-doc` (composite).

## Pipeline (fixed, sequential — do not skip, reorder, or substitute)

### Step 1 — Identify what's launching (`lumen-recap`)

Invoke `lumen-recap` against the target repo, biased toward **recent activity**. Extract:
- The launch headline (the one-thing-shipping). Pick the most prominent of: latest tag / most recent merged PR / latest CHANGELOG entry / user-supplied scope.
- 3–5 supporting changes (PRs, commits, decisions).
- Before/after framing where applicable.

**Output:** structured launch summary (headline + changes + framing).

### Step 2 — Impact metrics (`lumen-chart`)

Generate 1–3 charts that quantify the launch's value or scope. Examples:
- Performance — before/after latency or bundle-size bar chart.
- Adoption — line chart of usage over time.
- Scope — table or stat-grid of what's covered (count of new features, supported envs, etc.).

If no quantifiable impact exists yet (pre-release, framework-only change), skip Step 2 and rely on qualitative framing in Step 4. Do NOT fabricate numbers.

**Output:** 0–3 chart HTMLs.

### Step 3 — Hero / system diagram

Generate one diagram showing the launched feature in context. Use **one** of:
- **Skill path** — invoke `lumen-diagram` capability.
- **Renderer path** — bun script importing `generateDiagramTemplate` from `src/templates/diagram/`.

Topology choice:
- New service / pipeline → `linear-flow`.
- New integration / hub → `radial-hub`.
- Component shape change → `layered`.

**Output:** one diagram HTML.

### Step 4 — Assemble deck (`lumen-slides`)

Invoke `lumen-slides`. Slide sequence (10–12 slides):
1. **Title** — launch headline + project + date.
2. **The problem** — 1 sentence framing what users were dealing with before.
3. **What's shipping** — single bold headline + 2–3 bullets.
4. **How it works** — Step 3 diagram embedded full-width via `<iframe srcdoc="...">` (HTML-escape).
5. **Impact 1** — Step 2's first chart, embedded full-width with caption.
6. **Impact 2** — Step 2's second chart (if present), embedded with caption.
7. **Before / after** — split layout showing the previous vs new state. Use prose if no diagram is suitable.
8. **What's next** — 2–3 bullets pulled from Step 1's `next` items.
9. **Try it** — install / use / link.
10. **Credits / thanks** — contributors, dependencies, inspiration.

Adjust slide count to fit the launch — but do not pad. Empty slides are worse than fewer slides.

Aesthetic: default `editorial`. Use `dracula` or `dark-professional` for technical / infra-focused launches.

**Output:** one single-file HTML deck.

## Reliability contract

- Step 1's recap is the source of truth for what's launching. Do not invent features.
- Step 2's charts must come from real data; never fabricate metrics.
- Step 3's diagram must reflect actual code structure as of HEAD.
- Step 4 is the only step that produces user-visible HTML. Steps 1–3 produce inputs.
- If any step fails, surface the error with the step number and the failing capability's name.

## Output

Single HTML file: a 10–12-slide scroll-snap deck announcing the launch. Offline-playable (`file://`), keyboard + touch nav.

## Quality checks

- Every "what's shipping" bullet maps to a real change identified in Step 1.
- Every chart in the deck came from Step 2 (or the slide is absent if no metric exists).
- The hero diagram in slide 4 came from Step 3 (no hand-drawn SVG).
- Total slide count is honest — no padding to hit a round number.

## Execution model

This composite is always invoked via the LLM-authored skill path. Step 1 calls `lumen-recap`; Step 2 calls `lumen-chart`; Step 3 may delegate to `lumen-diagram` or the deterministic `generateDiagramTemplate` renderer; Step 4 calls `lumen-slides`.

When the trigger fires, execute the pipeline. Do not propose a "lighter" alternative — the composite's purpose is to remove that decision.

## Sources

This composite is novel orchestration. Each constituent capability has its own NOTICE.md attribution:
- `skills/lumen-recap/NOTICE.md`
- `skills/lumen-chart/NOTICE.md`
- `skills/lumen-diagram/NOTICE.md`
- `skills/lumen-slides/NOTICE.md`
