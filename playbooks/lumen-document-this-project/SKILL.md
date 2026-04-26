---
name: lumen-document-this-project
description: Generate a complete documentation set for a project by orchestrating multiple lumen composites (architecture-doc + readme-pack). Higher-altitude than a single composite — produces 2+ HTML artifacts that together rebuild a reader's mental model of the project. Invoke for "document this project", "full docs pack", "doc dump for X".
version: 0.1.5 # x-release-please-version
---

# lumen-document-this-project

Playbook. Orchestrates 2+ composites to produce a complete documentation set for a project: an architecture doc plus a project landing/showcase page.

**Tier:** playbook (compound) — orchestrates composites with **agent discretion**. Less deterministic than capabilities or composites; expect human-in-the-loop.

> **Note for the agent:** at this tier you have judgement. You decide which composites to run based on what the project actually needs. The fixed-pipeline contract that applied to composites does NOT apply here. But surface every decision to the user before spending real work.

## When to invoke

Triggers: `document this project`, `full docs pack`, `complete docs for X`, `doc dump`, `bootstrap project docs`, `produce documentation for this repo`.

When triggered:
1. **Pause and confirm scope with the user.** Playbooks consume real time and produce multiple files — do not run silently. Surface the planned set of composites and ask for green light.
2. After green light, execute the chosen composites one by one. Stop on first failure; do not partial-ship.

## Default plan

For an unfamiliar repo with no existing docs:

| # | Composite | Produces |
|---|---|---|
| 1 | `lumen-readme-pack` | `docs/project-page.html` — landing showcase, state + top-level diagram + metrics |
| 2 | `lumen-architecture-doc` | `docs/architecture.html` — multi-tab architecture deep-dive with subsystem diagrams |

The agent may **add** any of the following composites if the project signals warrant it:
- `lumen-launch-deck` — only if the user is preparing a release (recent tag, "launch" in prompt).
- `lumen-postmortem` — only if the user has linked an incident.

The agent may **skip** a default-plan composite if:
- The artifact already exists and is current (verify via `lumen-fact-check` if uncertain).
- The user explicitly excludes it.

## Decisions to surface to the user before executing

Always ask, in this order:
1. **Output destination** — `docs/`? `docs/2026-04/`? somewhere else?
2. **Scope** — confirm the proposed composite list. Default plan above is a starting point.
3. **Aesthetic** — `editorial` (default) / `dark-professional` / `blueprint` / `terminal` / etc. Match existing docs if discoverable.
4. **Audience** — internal (frank language, links to internal systems OK) or public (avoid internal references)? This affects the recap step's tone in each composite.

If any of these is unclear, **ask once** with concrete options. Do not run partial sequences silently.

## Reliability contract

- Each composite is a fixed pipeline; this playbook is a fixed list of composites the agent has chosen and the user has approved.
- One composite's output should not depend on another's — produce independent artifacts. (If a future iteration introduces cross-references, that's a deliberate composite-level change, not a playbook hack.)
- If a composite fails, stop. Do not advance to the next; surface the failure with the composite name.

## Output

2+ HTML files in the chosen destination directory. Each is independently shareable. A short index file (`docs/index.md` or similar) listing them is OPTIONAL and only produced if the user requests it.

## Quality checks

- The user approved the composite list before execution started.
- Every composite that ran produced its expected artifact.
- No silent skips — every "skipped X because Y" decision is in the final report to the user.

## Execution model

Playbooks are explicitly human-in-the-loop. Do not run unattended (e.g., from CI or a cron). The agent's role is to plan, surface decisions, and execute composites the user has approved.

When the trigger fires, the agent's first action is to surface the plan, NOT to execute. Surface the composite list, ask for approval, then execute on green light.

## Sources

This playbook is novel orchestration. It composes existing composites:
- `composites/lumen-readme-pack/`
- `composites/lumen-architecture-doc/`
- `composites/lumen-launch-deck/` (conditional)
- `composites/lumen-postmortem/` (conditional)
