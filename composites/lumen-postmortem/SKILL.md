---
name: lumen-postmortem
description: Produce a multi-tab HTML postmortem for a production incident. Combines a scoped recap, a mermaid sequence-diagram timeline, impact charts, and a structured write-up (Summary / Timeline / Impact / Root Cause / Action Items). Invoke for "postmortem", "post-mortem", "incident review".
version: 0.1.6 # x-release-please-version
---

# lumen-postmortem

Composite skill. Produces a single-file multi-tab HTML postmortem document for a production incident.

**Tier:** composite (molecular) — orchestrates 4 capabilities in a fixed pipeline. The agent has no runtime discretion over which skills to call or in what order.

## When to invoke

Triggers: `postmortem`, `post-mortem`, `incident review`, `incident retrospective`, `write a postmortem for X`, `incident write-up`, `RCA document`, `root cause analysis doc`.

When triggered, **execute the pipeline immediately**. Do not ask the user whether they want markdown vs HTML — the composite is the HTML path; markdown is the user's plain-`Write` path and they would not have triggered this composite if that's what they wanted.

Do NOT invoke when the user explicitly asks for:
- A markdown postmortem (no diagrams, no tabs) → write that directly with plain `Edit`/`Write`.
- A timeline diagram only → use `lumen-mermaid` (capability).
- An incident metrics chart only → use `lumen-chart` (capability).
- Architecture documentation → use `lumen-architecture-doc` (composite).

## Pipeline (fixed, sequential — do not skip, reorder, or substitute)

The composite assumes the user has provided incident context (which service, when, what happened) — either in the prompt, a linked issue, a Slack thread, or a logfile. If context is missing, ASK ONCE for: service name, incident window (start/end), and a one-line summary. Then run the pipeline.

### Step 1 — Scoped recap (`lumen-recap`)

Invoke `lumen-recap` against the affected repo, **scoped to the incident window**. Extract:
- Commits / merges in the window.
- Deploys in the window (from CI logs or release tags).
- Recent decisions touching the affected subsystem.

**Output:** scoped recap (the "what was changing around the time" picture).

### Step 2 — Incident timeline (`lumen-mermaid`)

Invoke `lumen-mermaid` with **`sequenceDiagram` syntax**. Actors:
- `Detection` — alert / user report.
- `Pager` — oncall.
- `Mitigation` — partial / full mitigation steps.
- `Resolution` — full restore.
- Add additional actors (services, dashboards, vendors) only if they took action.

Each event has a timestamp and an actor → actor message. Aim for 8–20 events. Use mermaid `Note over` for context lines that aren't messages.

**Output:** one mermaid HTML (timeline).

### Step 3 — Impact metrics (`lumen-chart`)

Generate 1–3 charts quantifying impact during the incident window:
- **Error rate** — line chart, requests/sec or % errors over time, incident window highlighted.
- **Latency** — line chart, p50/p95/p99, incident window highlighted.
- **Traffic / users affected** — bar or line chart.

If metrics are unavailable, skip Step 3 and note "metrics not available at writing" in the Impact tab. Do NOT fabricate.

**Output:** 0–3 chart HTMLs.

### Step 4 — Assemble write-up (`lumen-guide`)

Invoke `lumen-guide` in **single-file mode**. Tabs:
- **Summary** — 1-paragraph TL;DR, KPI strip (`duration`, `users affected`, `severity`, `services affected`), one-line root cause.
- **Timeline** — Step 2's mermaid timeline embedded full-width via `<iframe srcdoc="...">` (HTML-escape). Below the diagram: bullet list of major timestamps.
- **Impact** — Step 3's charts embedded with prose context. If Step 3 was skipped, plain-text impact estimate.
- **Root cause** — narrative (3–8 paragraphs). Use `card.accent` components for the "why didn't we catch this earlier" sub-points. Reference Step 1's commits/deploys where they contributed.
- **Action items** — `card.warning` per item, with: action, owner, target date. Use `finding--high` / `finding--medium` / `finding--low` severity to indicate priority.

Aesthetic: default `editorial`. Use `dark-professional` for sev-1 / customer-impacting incidents (signals seriousness).

**Output:** one assembled HTML file.

## Reliability contract

- Step 1's scoped recap is the source of truth for what was changing in the incident window.
- Step 2's timeline must reflect actual events (logs, alerts, slack timestamps); do not paraphrase or compress beyond clarity.
- Step 3's charts must come from real metrics; never fabricate.
- Action items in Step 4 must have an owner. Drop items without owners — they're not commitments.
- If any step fails, surface the error with the step number and the failing capability's name.

## Output

Single HTML file: a 5-tab postmortem (Summary / Timeline / Impact / Root Cause / Action Items). Offline-readable (`file://`), shareable as one attachment.

## Quality checks

- Summary tab's TL;DR matches the timeline's narrative.
- Every action item has an owner.
- Timeline events have timestamps.
- No fabricated metrics.
- Severity (`sev-1` / `sev-2` / `sev-3`) is stated explicitly in the Summary.

## Execution model

This composite is always invoked via the LLM-authored skill path. Step 1 calls `lumen-recap`; Step 2 calls `lumen-mermaid`; Step 3 calls `lumen-chart`; Step 4 calls `lumen-guide`.

When the trigger fires, execute the pipeline. Do not propose a markdown alternative — the user's plain-`Write` is their markdown path; they triggered this composite for the HTML path.

## Sources

This composite is novel orchestration. Each constituent capability has its own NOTICE.md attribution:
- `skills/lumen-recap/NOTICE.md`
- `skills/lumen-mermaid/SKILL.md` (NOTICE inline in `src/templates/shared.ts`)
- `skills/lumen-chart/NOTICE.md`
- `skills/lumen-guide/NOTICE.md`
