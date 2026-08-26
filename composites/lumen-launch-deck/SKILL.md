---
name: lumen-launch-deck
description: Release announcement deck via recap → chart → diagram → slides. Invoke manually for launch or release deck.
disable-model-invocation: true
license: MIT
compatibility: Claude Code · Pi · OMP
version: 0.1.9 # x-release-please-version
---

**Tier:** composite (molecular) — orchestrates capabilities in a fixed pipeline.

## Pipeline

1. **Recap** — `lumen-recap` scoped to release window. Done when state narrative is captured.
2. **Chart** — `lumen-chart` for headline metric. Done when chart exists or skipped with reason.
3. **Diagram** — `lumen-diagram` for what changed architecturally. Done when diagram exists.
4. **Slides** — `lumen-slides` deck synthesizing prior outputs. Done when deck HTML passes content budgets.

## Reliability contract

Fixed sequence; stop on failure. Slides must cite sources from earlier steps, not invent metrics.
