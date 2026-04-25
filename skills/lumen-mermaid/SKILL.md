---
name: lumen-mermaid
description: Render a Mermaid diagram (flowchart, sequence, ER, state, gantt, mindmap) as a self-contained HTML file with zoom, pan, fit-to-screen, and new-tab export. Use when the user asks for a "mermaid diagram" or supplies mermaid source code.
version: 0.1.0
---

# lumen-mermaid

> Status: scaffold. Implementation lands in v0.2.

## Sources to copy from (do not re-create)

- `visual-explainer` — mermaid-in-`<script type="text/plain">` escape trick (avoids HTML parser mangling), explicit `mermaid.render(id, code)` call (avoids timing races), concrete font strings (so SVG export matches), zoom/pan IIFE with constrained panning, smart fit detection (0.58 readability floor), touch pinch support, new-tab export
