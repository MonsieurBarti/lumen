---
name: lumen-mermaid
description: Mermaid: self-contained HTML with zoom/pan shell. User supplies or requests mermaid source (flowchart, sequence, ER, state).
license: MIT
compatibility: Claude Code · Pi · OMP. Pi tool: flowchart, sequence, er, state, mermaid_custom.
version: 0.1.10 # x-release-please-version
---

**Tier:** capability (atomic) — does not invoke other lumen skills.

## Steps

1. **Source** — produce valid mermaid syntax. Done when fenced source parses mentally.
2. **Embed** — put source in `<script type="text/plain" class="diagram-source">`; escape `</script>` as `<\/script`. Done when embed cannot break the HTML parser.
3. **Render** — call `generateMermaidTemplate` from `src/templates/mermaid.ts` (or author equivalent shell): `startOnLoad: false`, explicit `mermaid.render` after DOM ready, `data-bg` set. Palette: `blueprint` default; 8 mermaid palettes in `src/templates/shared.ts`. Done when controls (+/−/fit/expand) work.
4. **Deliver** — write `~/.agent/diagrams/<slug>.html`, open in browser. Done when path is returned.

Shell CSS/JS reference: `src/templates/shared.ts` (`MERMAID_SHELL_CSS`, `MERMAID_SHELL_JS`).

For deterministic fgraph sequence (not mermaid text), use `lumen-diagram` with topology `sequence`.
