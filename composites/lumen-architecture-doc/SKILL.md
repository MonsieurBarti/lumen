---
name: lumen-architecture-doc
description: Multi-tab architecture HTML via diagram → guide → fact-check. Invoke manually for architecture or design doc.
disable-model-invocation: true
license: MIT
compatibility: Claude Code · Pi · OMP
version: 0.1.10 # x-release-please-version
---

**Tier:** composite (molecular) — orchestrates capabilities in a fixed pipeline.

## Pipeline

Execute in order; stop on first failure with step number + skill name.

1. **Diagrams** — identify 2–6 subsystems; one `lumen-diagram` (or PI `type: diagram`) per subsystem. Done when `(name → html path)` map exists.
2. **Guide** — `lumen-guide` multi-tab doc embedding diagrams in tabs. Done when `docs/architecture.html` (or agreed path) exists.
3. **Fact-check** — `lumen-fact-check` on the guide output; apply corrections. Done when verification summary is appended.

Do not substitute markdown or single-diagram output when this composite was invoked.

## Reliability contract

Fixed sequence only — no reordering, no skipping, no partial ship.
