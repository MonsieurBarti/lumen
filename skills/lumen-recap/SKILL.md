---
name: lumen-recap
description: Generate single-file HTML project recap that rebuilds mental model of project's current state, recent decisions, and cognitive debt hotspots. Invoke when user asks to recap, summarize the project, show me where we are, or returns to project after break.
version: 0.1.8 # x-release-please-version
---

# lumen-recap

Single-file HTML recap. Hero image (optional) + architecture diagram + activity narrative + decision log + state KPIs + mental model + debt hotspots + next steps.

📄 Rendered example: [`docs/examples/recap.html`](../../docs/examples/recap.html) (a real recap of this repo)

**Tier:** capability (atomic) — does not invoke other lumen skills. Composites and playbooks may invoke it.

## When to invoke

Triggers: `recap`, `summarize the project`, `where are we`, `rebuild mental model`, `project state`, `coming back to this project`, `what changed since last week`.

## Pipeline

Follow the full recipe in `references/recap-recipe.md` (lifted from visual-explainer). Summary:

1. **Parse time window** from `$1` shorthand (`2w`, `30d`, `3m`) → git `--since` format. Default `2w`.
2. **Gather data:**
   - **Identity** — `README.md`, `CHANGELOG.md`, `package.json`, dep manifests, top-level structure.
   - **Activity** — `git log --oneline --since=…`, `git log --stat`, `git shortlog -sn`.
   - **Current state** — `git status`, `git branch --no-merged`, TODO/FIXME in recently changed files, progress docs.
   - **Decisions** — recent commit messages, plan docs, RFCs, ADRs.
   - **Architecture** — read entry points + most-changed files in window.
3. **Verification fact sheet** — list every quantitative claim and every named symbol with its source. This is the source of truth during HTML generation.
4. **Author HTML** with these 8 sections in order:
   - Project identity (current-state summary, version, elevator pitch)
   - Architecture snapshot (Mermaid with zoom/pan — see `lumen-mermaid` for the shell)
   - Recent activity (themed narrative, not raw log)
   - Decision log (highest-value: reasoning that evaporates first)
   - State KPIs (working / in-progress / broken / blocked)
   - Mental model essentials (5–10 invariants, gotchas, conventions)
   - Cognitive debt hotspots (severity badges; concrete suggestions)
   - Next steps (inferred momentum, not prescriptive)

## Research recap template

In addition to the 8-section project recap above, `lumen-recap` supports a 6-section research template for summarizing investigations, competitive analysis, or decision-support material:

1. **Executive Summary** — one-paragraph TL;DR of the research scope, question, and bottom-line answer.
2. **Key Findings** — 3–7 bulleted findings, each with an inline citation pointing to the source (URL, document, or `file:line`). Minimum 3 distinct sources per major claim.
3. **Evidence** — detailed excerpts, data tables, or screenshots that support the findings. Organized by finding, not by source.
4. **Options Considered** — alternatives evaluated, with pros/cons and cost/trade-off notes.
5. **Recommendation** — the preferred path with rationale tied back to findings.
6. **Risks & Open Questions** — what could invalidate the recommendation, what remains unverified, and what follow-up research is needed.

When triggered for research-oriented prompts (`research this`, `compare options`, `should we use X`), default to the 6-section template. When triggered for project-state prompts (`recap`, `where are we`), default to the 8-section project recap.

## Output

Single HTML written to `~/.agent/lumen/`. Open in browser.

## Visual treatment

- Architecture diagram is the visual anchor: hero depth, elevated container, larger padding, accent-tinted background.
- State KPIs as large hero numbers with color-coded trend indicators.
- Debt hotspots: amber-tinted cards with severity colored left border (red=high, amber=medium, blue=low).
- Warm editorial palette: muted blues + greens for architecture, amber callouts for debt, green/blue/amber/red for state.
- Vary fonts and palette from previous diagrams in the same session.

## Quality checks

- Every quantitative figure traced to a git command or `file:line`.
- Architecture diagram labels what modules *do*, not just file names.
- Decision log entries each have *what / why / what was considered*.
- Debt hotspots each carry a concrete suggestion, not just a flag.
- `min-width: 0` on grid/flex children; `overflow-wrap: break-word`.
- Never `display: flex` on `<li>` for marker characters — use absolute positioning.
- Every quantitative figure traces to a git command or `file:line` source (per shared validation-first convention).
- Research template outputs cite 3–5 distinct sources per major factual claim with inline references.
- Follow `skills/_shared/instructions.md` for aesthetics, file-handling, browser-launch, and citation conventions.

## PI extension route (v0.1.x)

Permanently skill-path only by design. `lumen-recap` is a multi-step CC skill that needs `Read` / `Grep` / `Bash` (`git log`) tool access to introspect project state. A deterministic PI tool cannot gather this data without the caller serializing the entire project into `content`, which defeats the skill's purpose.

## Sources

- [`nicobailon/visual-explainer` `commands/project-recap.md`](https://github.com/nicobailon/visual-explainer) (MIT) — full recipe lifted to `references/recap-recipe.md`
- `lumen-mermaid` (this package) — for the architecture-snapshot Mermaid shell with zoom/pan
- `lumen-diagram` (this package) — fgraph alternative when Mermaid would be too dense (>15 components)
