---
name: lumen-recap
description: Generate an HTML project recap that rebuilds the mental model of a project's current state, recent decisions, and cognitive debt hotspots. Use when the user asks to "recap", "summarize the project", "show me where we are", or returns to a project after a break.
version: 0.1.0
---

# lumen-recap

> Status: scaffold. Implementation lands in v0.2.

## Sources to copy from (do not re-create)

- `visual-explainer` (project-recap) — recap generation prompt, codebase scan strategy, output template
- `roxabi-forge` — hero + stat-grid composition, finding severity badges (`.finding--high/medium/low`), progressive disclosure for detail
