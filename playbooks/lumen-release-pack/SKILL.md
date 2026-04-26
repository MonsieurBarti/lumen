---
name: lumen-release-pack
description: Bundle release artifacts for a tagged release by orchestrating lumen-launch-deck + lumen-readme-pack and producing a "what shipped" archive. Higher-altitude than a single composite — produces multiple HTML artifacts plus a release index. Invoke for "release pack", "release artifacts", "package the release".
version: 0.1.4 # x-release-please-version
---

# lumen-release-pack

Playbook. Bundles the artifacts you'd want for a release announcement: a launch deck, an updated project page, and a release index linking them.

**Tier:** playbook (compound) — orchestrates composites with **agent discretion**. Less deterministic than capabilities or composites; expect human-in-the-loop.

> **Note for the agent:** at this tier you have judgement. You decide which composites to run for this specific release based on what actually shipped. The fixed-pipeline contract that applied to composites does NOT apply here. But surface every decision to the user before spending real work.

## When to invoke

Triggers: `release pack`, `release artifacts`, `package the release`, `bundle release artifacts`, `release announcement pack`, `produce launch artifacts for X`.

When triggered:
1. **Pause and confirm scope with the user.** Playbooks consume real time and produce multiple files — do not run silently. Surface the planned set of composites and ask for green light.
2. After green light, execute the chosen composites one by one. Stop on first failure.

## Default plan

For a tagged release (or a recent feature merge):

| # | Composite | Produces |
|---|---|---|
| 1 | `lumen-launch-deck` | `docs/releases/<tag>/deck.html` — announcement deck with hero diagram + impact charts |
| 2 | `lumen-readme-pack` | `docs/releases/<tag>/project-page.html` — refreshed project page reflecting the release state |

The agent may **add**:
- `lumen-postmortem` — only if the release was a hotfix for a customer-impacting incident.
- A `lumen-fact-check` pass on existing release notes — if `CHANGELOG.md` or release-notes drift is suspected.

The agent may **skip** the readme-pack if it was produced recently (< 7 days) and the project state hasn't materially changed.

## Decisions to surface to the user before executing

Always ask, in this order:
1. **Release identifier** — tag (`v0.2.0`), branch (`release/foo`), or "the most recent merge"? This drives all date/scope inputs to the composites.
2. **Output destination** — `docs/releases/<tag>/`? somewhere else?
3. **Scope** — confirm the proposed composite list. Trim or add per the release type (feature launch / bugfix / infra / hotfix).
4. **Aesthetic** — `editorial` (default) / `dark-professional` (technical / infra) / `blueprint` / etc. Match the existing release-notes aesthetic if discoverable.
5. **Audience** — internal release (changelog-style, links to PRs / Linear) or public (marketing language, no internal links)?

If any of these is unclear, **ask once** with concrete options. Do not run partial sequences silently.

## Reliability contract

- Each composite is a fixed pipeline; this playbook is a fixed list of composites the agent has chosen and the user has approved.
- The release identifier is the SINGLE source of truth for "what shipped" across all composites. Do not let composites disagree about the scope window.
- If a composite fails, stop. Do not advance; surface the failure with the composite name.

## Output

2+ HTML files in `docs/releases/<tag>/` (or user-chosen destination), plus an OPTIONAL `index.html` linking them. The index is only produced if the user requests it.

## Quality checks

- The user approved the composite list and release identifier before execution started.
- Every composite that ran used the same release identifier as scope input.
- No silent skips — every "skipped X because Y" decision is in the final report to the user.
- Output destination contains the expected files.

## Execution model

Playbooks are explicitly human-in-the-loop. Do not run unattended (e.g., from CI hooks or cron) — release packaging requires human judgment about what actually shipped, what the audience needs, and how the release should be framed.

When the trigger fires, the agent's first action is to surface the plan, NOT to execute. Surface the composite list, ask for approval, then execute on green light.

## Sources

This playbook is novel orchestration. It composes existing composites:
- `composites/lumen-launch-deck/`
- `composites/lumen-readme-pack/`
- `composites/lumen-postmortem/` (conditional)
- `skills/lumen-fact-check/` (conditional, capability not composite)
