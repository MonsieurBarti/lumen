# Platform paths (Claude Code · Pi · OMP)

Lumen ships one `SKILL.md` tree consumed by every harness. Resolve bundled assets relative to the **skill root** for your platform — never hard-code only `$CLAUDE_PLUGIN_ROOT`.

## Skill roots

| Harness | How skills are discovered | Skill root for `lumen-*` |
|---|---|---|
| **Claude Code** | `.claude-plugin/plugin.json` → `skills/`, `composites/`, `playbooks/` | `$CLAUDE_PLUGIN_ROOT/skills/lumen-<name>/` (composites/playbooks under their dirs) |
| **Pi** (`pi.dev`) | `package.json` → `"pi".skills[]` after `pi install` | `skills/lumen-<name>/` inside the installed package |
| **OMP** (`omp.sh`) | `package.json` → `"omp".skills[]` (legacy `pi` also accepted); Claude plugin layout also works | `skills/lumen-<name>/` for `omp plugin install github:…` or npm |

## Reading bundled files

When a skill says “read `references/foo.md`”, resolve from the skill directory:

```
{SKILL_ROOT}/references/foo.md
```

Where `{SKILL_ROOT}` is whichever of these resolves on your harness:

1. **Claude Code:** `$CLAUDE_PLUGIN_ROOT/skills/lumen-<name>/`
2. **Pi / OMP (npm or git install):** package-root `skills/lumen-<name>/`, `composites/…`, or `playbooks/…`
3. **Dev checkout:** same repo-relative paths

Shared aesthetics: `skills/_shared/aesthetics/*.css`.

## Deterministic renderers (Pi / OMP extension)

The extension entry is `src/index.ts` (declared in `omp.extensions` / `pi.extensions`). It exposes `lumen-generate_visual` for **mermaid**, **diagram**, and **chart** only. Slides, galleries, guides, recaps, and fact-checks are **skill-authored HTML** on every platform — invoke the matching `lumen-*` skill instead of the tool.

`dist/` is still produced for npm `main` / `bin` (CLI export). GitHub installs do **not** need `dist/` — the TypeScript entry is enough.

## Output directories (all platforms)

- Diagrams / charts / galleries → `~/.agent/diagrams/`
- Slides / guides / recaps / composites → `~/.agent/lumen/`
