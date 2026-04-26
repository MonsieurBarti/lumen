# Lumen — rendered examples

One example per LLM-authored skill, so you can see what the skill actually
produces without running it. Open the HTML files in a browser; the
markdown files in a viewer or side-by-side `diff`.

| Skill | Example | What it shows |
|---|---|---|
| `lumen-slides`     | [`slides.html`](./slides.html)              | An 8-slide scroll-snap deck (Midnight Editorial preset) covering 7 of the 10 `.slide--*` patterns. |
| `lumen-gallery`    | [`gallery.html`](./gallery.html)            | A 12-item gallery across 2 batches, with batch tabs, dimension filters, search, lightbox, starring, and theme toggle. |
| `lumen-guide`      | [`guide.html`](./guide.html)                | A 4-tab single-file guide (Editorial aesthetic) with hero, stat-grid, cards, steps, and disclosure-driven deep content. |
| `lumen-recap`      | [`recap.html`](./recap.html)                | A real recap of *this* repo over the last 14 days — identity, architecture, KPIs, decisions, mental model, debt hotspots, next steps. |
| `lumen-fact-check` | [`fact-check/`](./fact-check/)              | Before/after pair: a doc with 11 intentional inaccuracies, plus the corrected version with a verification summary citing each fix. |

## Composites

| Skill | Example | What it shows |
|---|---|---|
| `lumen-architecture-doc` | [`architecture.html`](./architecture.html) | A 5-tab architecture document for *this* repo (Overview / Components / Flows / Decisions / Verification). Produced by the validated `diagram → guide → fact-check` pipeline; embeds 4 fgraph diagrams via `<iframe srcdoc>` to preserve per-topology CSS. |

## Conventions

- All HTML examples are **self-contained, offline-safe** — open via `file://`,
  no CDN required.
- The recap example is a snapshot of repo state at **2026-04-26**. It will
  drift; regenerate by following [`skills/lumen-recap/references/recap-recipe.md`](../../skills/lumen-recap/references/recap-recipe.md).
- The fact-check example uses lumen itself as the subject so the corrections
  are independently verifiable against this codebase.
