---
name: lumen-guide
description: Guide: multi-tab HTML document. User asks for guide, architecture overview, or tabbed reference doc.
license: MIT
compatibility: Claude Code · Pi · OMP
version: 0.1.10 # x-release-please-version
---

**Tier:** capability (atomic) — does not invoke other lumen skills.

## Steps

1. **Frame** — infer reader-action, takeaway, tone (`references/frame-phase.md`). Done when tab set is chosen for content type.
2. **Structure** — pick tabs (architecture → Overview/Components/Flows/Decisions; migration → Why/Before/After/Steps/Rollback; etc.). Done when each tab has a glance/scan/deep layer (`references/output-ux.md`).
3. **Style** — one aesthetic from `_shared/aesthetics/` (default `editorial`); components from `components/components.css`. Done when tokens are consistent.
4. **Deliver** — single-file (`shells/single.html`) or split-file (`shells/split.html` + `references/phase-3-generate.md`). Write `~/.agent/lumen/<slug>.html`, open in browser. Done when path is returned.

Example: `docs/examples/guide.html`. Harness paths: `_shared/platform-paths.md`.
