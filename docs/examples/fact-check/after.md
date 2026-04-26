# Lumen — quick overview (DRAFT, may have drifted)

Lumen is a skill bundle for visual generation, currently at version **0.1.3**.
It ships **8 skills** for generating diagrams, charts, slides, and other
single-file HTML artifacts.

## Skills

The 8 skills are:

- `lumen-diagram`
- `lumen-chart`
- `lumen-mermaid`
- `lumen-slides`
- `lumen-gallery`
- `lumen-guide`
- `lumen-recap`
- `lumen-fact-check`

## PI extension entry point

The PI coding agent loads lumen via `src/index.ts`, which exports a default
function `lumenExtension(pi)`. The tool registered with PI is named
`lumen-generate_visual`.

## Type schemas

Lumen's tool parameter schemas are built with the unscoped `typebox` 1.x
package. The `Type` builder is imported from `typebox`; `StringEnum` is
imported from `@mariozechner/pi-ai` (re-exported there for convenience).

## Wired routes (v0.2)

The PI route currently supports:

- mermaid types (flowchart, sequence, er, state, mermaid_custom)
- fgraph diagram (`type:"diagram"`)
- chart (`type:"chart"`)

Other types throw a `NotImplementedError`.

## Repository

Recent activity: the most recent merged PR was **#12**, which bumped
`@mariozechner/pi-*` to `^0.70.2` and switched from `@sinclair/typebox` to
the unscoped `typebox` 1.x package.

---

## Verification Summary

Fact-checked against the lumen repo at `main` after PR #12.

| Claim | Verdict | Source |
|---|---|---|
| Version is `0.0.5` | ❌ Corrected → `0.1.3` | `package.json:3` |
| Ships 6 skills | ❌ Corrected → 8 skills | `src/index.ts:44-53` (`LUMEN_SKILLS`); `skills/` dir |
| Skill list omits `lumen-mermaid` and `lumen-fact-check` | ❌ Corrected | `skills/lumen-{mermaid,fact-check}/SKILL.md` |
| Entry point is `src/main.ts` | ❌ Corrected → `src/index.ts` | `package.json:6` (`"main": "./dist/index.js"`); file exists at `src/index.ts` |
| Tool name is `tff-generate_visual` | ❌ Corrected → `lumen-generate_visual` | `src/index.ts:197` |
| Default export `lumenExtension(pi)` | ✅ Confirmed | `src/index.ts:178` |
| Schemas use `@sinclair/typebox` 0.34 | ❌ Corrected → unscoped `typebox` 1.x | `package.json:84,93`; `src/index.ts:18`; PR #12 |
| `Type` and `StringEnum` both imported from `@sinclair/typebox` | ❌ Corrected — `Type` from `typebox`, `StringEnum` from `@mariozechner/pi-ai` | `src/index.ts:15,18` |
| Mermaid types: flowchart, sequence, er, state | ❌ Corrected — list omits `mermaid_custom` (5 total, not 4) | `src/index.ts:57-63` (`MERMAID_TYPES`) |
| Other types throw `NotSupportedError` | ❌ Corrected → `NotImplementedError` | `src/index.ts:69-77` |
| Most recent merged PR is #7 (chart route) | ❌ Corrected → #12 (pi/typebox bump); chart route was #10 | `git log --merges` |

**Totals**: 12 claims checked → 1 confirmed, 11 corrected, 0 unverifiable.
