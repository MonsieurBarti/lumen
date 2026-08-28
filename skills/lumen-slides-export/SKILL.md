---
name: lumen-slides-export
description: Export an existing lumen deck HTML to editable .pptx via lumen-export-slides CLI.
disable-model-invocation: true
license: MIT
compatibility: Claude Code · Pi · OMP
version: 0.1.10 # x-release-please-version
---

**Tier:** capability (atomic) — does not invoke other lumen skills.

## Steps

1. **Confirm HTML path** — deck must exist. Done when path is valid.
2. **Run** — `lumen-export-slides <html-path>` (or `npx lumen-export-slides`). Done when CLI exits 0.
3. **Report** — return `.pptx` path (versioned if `deck.pptx` exists). Done when file is non-empty.

Validation + fidelity limits: `references/export-pipeline.md` (overflow, unwrapped text, emoji warnings; CSS scoping, pseudo-materialization).

Playwright required on first run: `npx playwright install chromium`.
