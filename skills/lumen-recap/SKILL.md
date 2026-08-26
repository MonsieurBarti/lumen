---
name: lumen-recap
description: Recap: project-state HTML from git. User asks where we are, recap, or returns after a break.
license: MIT
compatibility: Claude Code · Pi · OMP
version: 0.1.9 # x-release-please-version
---

**Tier:** capability (atomic) — does not invoke other lumen skills.

## Steps

1. **Window** — parse `$1` (`2w`, `30d`, `3m`) → `git --since`. Default `2w`. Done when date bound is set.
2. **Gather** — README, CHANGELOG, `git log`/`shortlog`, `git status`, branches, recent TODOs. Done when verification fact sheet lists every claim with source.
3. **Author** — 8-section project recap (identity → architecture → activity → decisions → KPIs → mental model → debt → next steps). Research prompts → 6-section template in recipe. Done when every quantitative claim cites a source.
4. **Deliver** — write `~/.agent/lumen/<slug>.html`, open in browser. Done when path is returned.

Full recipe: `references/recap-recipe.md`. Example: `docs/examples/recap.html`.
