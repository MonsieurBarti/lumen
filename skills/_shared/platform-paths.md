# Platform paths (Claude Code · Pi · OMP)

Lumen ships one `SKILL.md` tree consumed by every harness. Resolve bundled assets relative to the **skill root** for your platform — never hard-code only `$CLAUDE_PLUGIN_ROOT`.

## Skill roots

| Harness | How skills are discovered | Skill root for `lumen-*` |
|---|---|---|
| **Claude Code** | `.claude-plugin/plugin.json` → `skills/`, `composites/`, `playbooks/` | `$CLAUDE_PLUGIN_ROOT/skills/lumen-<name>/` (composites/playbooks under their dirs) |
| **Pi** (`pi.dev`) | `package.json` → `"pi".skills[]` after `pi install` | `dist/skills/lumen-<name>/` inside the installed package (source: repo `skills/`) |
| **OMP** (`omp.sh`) | Inherits `.claude/` plugin + marketplace installs; native `omp-plugins` provider | Same as Claude Code when installed via `omp plugin install github:MonsieurBarti/lumen` |

## Reading bundled files

When a skill says “read `references/foo.md`”, resolve from the skill directory:

```
{SKILL_ROOT}/references/foo.md
```

Where `{SKILL_ROOT}` is whichever of these resolves on your harness:

1. **Claude Code / OMP (plugin install):** `$CLAUDE_PLUGIN_ROOT/skills/lumen-<name>/`
2. **Pi (npm/git install):** path to `lumen-<name>` under the package’s `dist/skills/`, `dist/composites/`, or `dist/playbooks/`
3. **Dev checkout:** repo-relative `skills/lumen-<name>/`, `composites/…`, `playbooks/…`

Shared aesthetics: `skills/_shared/aesthetics/*.css` (or `dist/skills/_shared/aesthetics/` on Pi).

## Deterministic renderers (Pi only)

Pi loads the compiled extension (`dist/index.js`) and exposes `lumen-generate_visual` for **mermaid**, **diagram**, and **chart** only. Slides, galleries, guides, recaps, and fact-checks are **skill-authored HTML** on every platform — invoke the matching `lumen-*` skill instead of the tool.

## Output directories (all platforms)

- Diagrams / charts / galleries → `~/.agent/diagrams/`
- Slides / guides / recaps / composites → `~/.agent/lumen/`
