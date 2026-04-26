---
name: lumen-fact-check
description: Verify factual accuracy of a document against the actual codebase, then propose or apply in-place corrections. Invoke when user asks to fact-check, verify this doc, is this still accurate, audit this doc, or supplies a doc that may have drifted from code.
version: 0.1.6 # x-release-please-version
---

# lumen-fact-check

Read a document → extract every verifiable claim → check each against code + git → correct in place → append a verification summary.

📄 Rendered example: [`docs/examples/fact-check/`](../../docs/examples/fact-check/) (before/after pair, 11 cited corrections)

**Tier:** capability (atomic) — does not invoke other lumen skills. Composites and playbooks may invoke it.

## When to invoke

Triggers: `fact-check`, `verify this doc`, `is this still accurate`, `check this against the codebase`, `does this README match the code`, `audit this doc`.

## Pipeline

Follow the full recipe in `references/fact-check-recipe.md` (lifted from visual-explainer). Summary:

1. **Resolve target file** from `$1` (explicit path) or default to most recently modified `~/.agent/lumen/*.html` or `~/.agent/diagrams/*.html`.
2. **Auto-detect document type** (HTML review page vs plan/spec markdown vs other) and adjust verification strategy.
3. **Phase 1 — Extract claims:**
   - Quantitative (line counts, file counts, metrics)
   - Naming (functions, types, modules, file paths)
   - Behavioral (what code does, before/after comparisons)
   - Structural (architecture, dependencies, module boundaries)
   - Temporal (git history claims, timeline entries)
   - **Skip** subjective analysis (opinions, design judgments).
4. **Phase 2 — Verify against source:**
   - Re-read every referenced file; check signatures + behavior.
   - For git history claims: re-run `git diff --stat`, `git log`, `git diff --name-status`; compare numbers.
   - For diff-reviews: read both `git show <ref>:file` and working tree to catch before/after swaps.
   - Classify each: **Confirmed** / **Corrected** / **Unverifiable**.
5. **Phase 3 — Correct in place** via surgical `Edit` calls.
   - Preserve layout, CSS, structure.
   - For HTML: keep Mermaid diagrams unless a label is factually wrong.
   - For markdown: keep heading structure + organization.
6. **Phase 4 — Append verification summary:**
   - HTML: insert as styled banner at top or final section, matching page styling.
   - Markdown: append `## Verification Summary` at end.
   - Include: claims checked, confirmed count, corrections (with `file.ts:LN` source for each fix), unverifiable flags.
7. **Phase 5 — Report.** Tell the user what was checked, corrected, opened. If nothing needed correction, say so.

## Boundaries (lift verbatim from upstream)

This is **not** a re-review. It does not second-guess analysis, opinions, or design judgments. It does not change the document's structure or organization. It is a fact-checker — it verifies that the data presented matches reality, corrects what doesn't, and leaves everything else alone.

## Output

The corrected document, in place. Plus a verification summary section. The user sees both.

## Quality checks

- Every claim was either verified, corrected, or flagged unverifiable — none silently passed.
- Corrections cite source location (`file.ts:LN` or git command).
- Subjective analysis was untouched.
- Document structure preserved.

## PI extension route (v0.1.x)

Not wired through the `lumen-generate_visual` PI tool. Fact-check needs `Read` / `Grep` / `Bash` / `Edit` access; the LLM-authored path uses these directly. Deterministic fact-check renderer is not planned.

## Sources

- [`nicobailon/visual-explainer` `commands/fact-check.md`](https://github.com/nicobailon/visual-explainer) (MIT) — full recipe lifted to `references/fact-check-recipe.md`
