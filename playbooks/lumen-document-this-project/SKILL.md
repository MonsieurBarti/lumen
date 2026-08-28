---
name: lumen-document-this-project
description: Full docs pack (readme-pack + architecture-doc). Invoke manually — confirms scope before running.
disable-model-invocation: true
license: MIT
compatibility: Claude Code · Pi · OMP
version: 0.1.10 # x-release-please-version
---

**Tier:** playbook (compound) — human-in-the-loop orchestrator over composites.

## Default plan

| # | Composite | Output |
|---|---|---|
| 1 | `lumen-readme-pack` | `docs/project-page.html` |
| 2 | `lumen-architecture-doc` | `docs/architecture.html` |

Optional: `lumen-launch-deck` (release), `lumen-postmortem` (incident).

## Steps

1. **Confirm scope** — show planned composites; wait for user green light. Done when user approves.
2. **Execute** — run composites sequentially; stop on first failure. Done when all approved composites shipped.

## Decisions to surface

- Skip composite if artifact exists and is current (fact-check if unsure).
- Add launch/postmortem only when prompt signals release or incident.

Do not run from CI or cron.
