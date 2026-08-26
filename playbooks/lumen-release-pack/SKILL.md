---
name: lumen-release-pack
description: Release artifacts (launch-deck + readme-pack). Invoke manually — confirms scope before running.
disable-model-invocation: true
license: MIT
compatibility: Claude Code · Pi · OMP
version: 0.1.9 # x-release-please-version
---

**Tier:** playbook (compound) — human-in-the-loop orchestrator over composites.

## Default plan

| # | Composite | Output |
|---|---|---|
| 1 | `lumen-launch-deck` | release deck HTML |
| 2 | `lumen-readme-pack` | `docs/project-page.html` |

## Steps

1. **Confirm scope** — release type (feature / bugfix / hotfix); trim or add composites. Done when user approves.
2. **Execute** — run composites sequentially; stop on first failure. Done when artifacts are delivered.

## Decisions to surface

- Hotfix → skip launch deck if user wants readme-only.
- Feature launch → include both defaults unless user excludes one.

Do not run from CI or cron.
