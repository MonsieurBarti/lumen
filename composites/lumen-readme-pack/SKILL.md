---
name: lumen-readme-pack
description: Project landing HTML via recap → diagram → chart → guide. Invoke manually for visual readme or project page.
disable-model-invocation: true
license: MIT
compatibility: Claude Code · Pi · OMP
version: 0.1.9 # x-release-please-version
---

**Tier:** composite (molecular) — orchestrates capabilities in a fixed pipeline.

## Pipeline

1. **Recap** — `lumen-recap` for current state narrative. Done when recap HTML exists.
2. **Diagram** — one top-level `lumen-diagram` of system shape. Done when diagram HTML exists.
3. **Chart** — one `lumen-chart` for a key metric (if data available). Done when chart exists or step is skipped with reason.
4. **Guide** — `lumen-guide` landing page weaving recap + diagram + chart. Done when `docs/project-page.html` (or agreed path) exists.

## Reliability contract

Fixed sequence; stop on failure. Chart step may skip only when no numeric story exists — state why.
