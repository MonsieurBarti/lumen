---
description: Shared conventions for all lumen skills. Read only when a skill points here.
---

# Lumen conventions

Paths: `_shared/platform-paths.md`.

## Defaults

| Output | Aesthetic | Directory |
|---|---|---|
| Slides / external deck | `aurora` | `~/.agent/lumen/` |
| Guide / recap | `editorial` | `~/.agent/lumen/` |
| Diagram / chart | `dark-professional` | `~/.agent/diagrams/` |
| Mermaid | `blueprint` | `~/.agent/diagrams/` |

## Rules

- **Single-file** HTML; `file://` safe; embed images as base64.
- **Open** in browser after write.
- **Version** outputs (`_v2`, `_v3`) instead of overwrite when regenerating.
- **Motion** — honor `prefers-reduced-motion`.
- **Fact-check** composites: run `lumen-fact-check` on final HTML when the pipeline includes it.

Evidence/citation detail: only for `lumen-recap` and `lumen-fact-check` recipes.
