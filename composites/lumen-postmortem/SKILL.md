---
name: lumen-postmortem
description: Incident review HTML via recap → mermaid → chart → guide. Invoke manually for postmortem or RCA.
disable-model-invocation: true
license: MIT
compatibility: Claude Code · Pi · OMP
version: 0.1.9 # x-release-please-version
---

**Tier:** composite (molecular) — orchestrates capabilities in a fixed pipeline.

## Pipeline

1. **Recap** — `lumen-recap` for incident timeline window. Done when timeline narrative exists.
2. **Mermaid** — `lumen-mermaid` for failure/cascade flow. Done when flow diagram exists.
3. **Chart** — `lumen-chart` for impact metrics (if data exists). Done when chart exists or skipped with reason.
4. **Guide** — `lumen-guide` postmortem tabs (Summary / Timeline / Root cause / Actions). Done when guide HTML exists.

## Reliability contract

Fixed sequence; stop on failure. Distinguish confirmed facts from hypotheses in the guide.
