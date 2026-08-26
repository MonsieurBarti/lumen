---
name: lumen-fact-check
description: Fact-check: verify document claims against the codebase. User asks to verify, audit, or check doc accuracy.
license: MIT
compatibility: Claude Code · Pi · OMP
version: 0.1.9 # x-release-please-version
---

**Tier:** capability (atomic) — does not invoke other lumen skills.

## Steps

1. **Target** — resolve file from `$1` or latest `~/.agent/lumen/*.html`. Done when document is loaded.
2. **Extract** — list verifiable claims (counts, names, behavior, structure, git history); skip opinions. Done when claim inventory is complete.
3. **Verify** — check each against code/git; tag Confirmed / Corrected / Unverifiable with confidence. Done when every claim has an outcome.
4. **Correct** — surgical edits in place; preserve layout. Done when corrections match sources (`file:line`).
5. **Summarize** — append verification summary section. Done when counts and fixes are visible.

Recipe + boundaries: `references/fact-check-recipe.md`. Example: `docs/examples/fact-check/`.
