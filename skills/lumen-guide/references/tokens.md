# Brand Tokens & Dark Mode Rules

This file covers two token systems. Choose based on the output type:

| Output type | Token system | Font pair | Used by |
|-------------|-------------|-----------|---------|
| Split-file docs, charts, epics | **Baseline** (below) | IBM Plex Sans + IBM Plex Mono | forge-guide, forge-epic, forge-chart |
| Gallery templates | **Gallery extended** (see `gallery-base.css`) | Plus Jakarta Sans + JetBrains Mono | forge-gallery |

The gallery system extends the baseline with extra surface tiers (`--surface2`, `--card`), a dimmer text tier (`--text-xdim`), and a semantic color palette (`--green`, `--blue`, `--purple`, `--orange`, `--cyan`, `--amber`, `--red` each with `*-dim` variants). Gallery tokens are defined in `gallery-base.css` — do not duplicate them here.

---

## Baseline Tokens (Split-File / Chart / Epic)

### Which Theme to Use

1. Check `~/.roxabi/forge/<project>/brand/BRAND-BOOK.md`
2. Brand book found → derive tokens from its palette
3. No brand book, project is `lyra` / `voicecli` → **Lyra theme** (Forge Orange)
4. No brand book, project is `roxabi*` / `2ndBrain` → **Roxabi theme** (Gold)
5. Unknown project → **Lyra theme** (default)

---

## Theme CSS Files

Full token definitions live in dedicated aesthetic files:

| Project | Aesthetic file | Accent |
|---------|---------------|--------|
| lyra, voicecli | `aesthetics/lyra.css` | Forge Orange `#e85d04` |
| roxabi*, 2ndBrain | `aesthetics/roxabi.css` | Gold `#f0b429` |
| default (unknown) | `aesthetics/editorial.css` | Slate `#64748b` |
| stark / caveman style | `aesthetics/caveman.css` | Orange-red `#ff3300` |
| terminal / CLI style | `aesthetics/terminal.css` | Cyan `#00d4ff` |

**Usage in skills:** Copy brand token blocks (`--bg`, `--surface`, `--border`, `--text*`, `--accent*`) from the aesthetic file. Semantic colors (`--success*`, `--warning*`, `--error*`, `--info*`) come from `base/components.css`. Typography comes from `base/typography.css`.

---

## Three-Tier Dark Mode Hierarchy

| Token | Value | Contrast on `#0a0a0f` | Used for |
|-------|-------|----------------------|----------|
| `--text` | `#fafafa` | ~18:1 | Headings, nav labels, primary UI |
| `--text-muted` | `#9ca3af` | ~8:1 ✓ AA | Body paragraphs, descriptions, card content |
| `--text-dim` | `#6b7280` | ~4.3:1 | Timestamps, file paths, column headers, metadata |

**Rule:** Any element where the user reads more than one sentence → `--text-muted` (`#9ca3af`) or brighter. **Never `--text-dim` for body text.**

## Forbidden Colors for Body Text in Dark Mode

- `#1c1917` — light-mode text (near-black), invisible on dark bg
- `#374151`, `#2a2a35`, `#18181f` — surface/border colors, not text
- `#57534e` — light-mode secondary, too dark on dark backgrounds
- `#6b7280` — only for metadata/labels (4.3:1), **never for body paragraphs**

Common trap: setting `--text-muted` and `--text-dim` to the same value (`#6b7280`) makes all body text fail AA. Always differentiate them.

---

## Typography (Default)

Use IBM Plex Sans + IBM Plex Mono (loaded via Google Fonts in the shell templates).

Typography rules are defined in `base/typography.css` — skills should read and inline that file.

Other acceptable pairs: DM Sans + Fira Code, Plus Jakarta Sans + Azeret Mono.
**Forbidden as primary fonts:** Inter, Roboto, Arial, bare `system-ui`.

---

## Caveman Aesthetic

Ultra-stark dark theme inspired by [juliusbrussee.github.io/caveman](https://juliusbrussee.github.io/caveman/).

**Identity:** Pure black base, single orange-red accent, grid background, cursor spotlight, glassmorphism cards.

| Token | Dark | Light |
|-------|------|-------|
| `--bg` | `#000000` | `#fafafa` |
| `--border` | `#1a1a1a` | `#e5e5e5` |
| `--text` | `#ffffff` | `#0a0a0a` |
| `--text-muted` | `#888888` | `#525252` |
| `--accent` | `#ff3300` | `#dc2626` |

**Key features:**
- Grid background: 40px grid with radial mask fade (adapts to light)
- Cursor spotlight: `mousemove` glow that follows cursor
- Breathing aura: 15s ambient pulse in hero sections
- Glassmorphism: `backdrop-filter: blur(10px)` + `rgba(5,5,5,0.9)` cards

**Dark is canonical.** Original caveman style is dark-only. Light mode added for forge gallery theme-toggle compatibility, but dark is the intended aesthetic.

**When to use:**
- Landing pages, product showcases
- CLI tool documentation
- Galleries with stark, minimal vibe
- Projects wanting a bold, high-contrast dark theme

**Integration with galleries** (note: `caveman.css` must be manually copied to `_shared/` — `forge-init` does not install it):
```html
<link rel="stylesheet" href="../../_shared/gallery-base.css">
<link rel="stylesheet" href="../../_shared/caveman.css">
<div class="caveman-grid"></div>
<div class="caveman-spotlight"></div>
```

---

## Diagram Semantic Tokens (`--diag-*`)

> **Scope:** Apply on a `.diag-*` wrapper class or within SVG `<style>` blocks only — not globally. These tokens do not conflict with forge aesthetic tokens (`--text`, `--surface`, `--accent`, `--bg`, `--border`, `--green`, `--blue`, etc.).
>
> **Note:** Fill values are designed for dark backgrounds (dark-professional aesthetic).

### Stroke / Label Colors

| Token | Hex | Semantic meaning |
|---|---|---|
| `--diag-process` | `#22d3ee` | Processes, services, daemons |
| `--diag-module` | `#34d399` | Sub-components, libraries, modules |
| `--diag-data` | `#a78bfa` | Databases, storage, caches |
| `--diag-infra` | `#fbbf24` | Infrastructure, cloud, containers |
| `--diag-security` | `#fb7185` | Auth, encryption, security boundaries |
| `--diag-channel` | `#fb923c` | Message buses, queues, IPC, channels |
| `--diag-external` | `#94a3b8` | External systems, third-party APIs |

### Fill Colors (node box backgrounds)

| Token | Value | Usage |
|---|---|---|
| `--diag-process-fill` | `rgba(8, 51, 68, 0.4)` | Node box background |
| `--diag-module-fill` | `rgba(6, 78, 59, 0.4)` | Node box background |
| `--diag-data-fill` | `rgba(76, 29, 149, 0.4)` | Node box background |
| `--diag-infra-fill` | `rgba(120, 53, 15, 0.3)` | Node box background |
| `--diag-security-fill` | `rgba(136, 19, 55, 0.4)` | Node box background |
| `--diag-channel-fill` | `rgba(251, 146, 60, 0.3)` | Node box background |
| `--diag-external-fill` | `rgba(30, 41, 59, 0.5)` | Node box background |

---

## Architecture Palette (`--arch-*`)

> **Scope:** Semantic tokens for architecture diagrams — one color per logical tier.
> Use these when the diagram is tier-oriented (frontend vs backend vs database etc.)
> rather than flow-oriented (where `--diag-*` applies).
>
> Complements `--diag-*`: `--diag-*` classifies node roles (process / module / data /
> infra / security / channel / external); `--arch-*` classifies architectural tiers.
> Pick one system per diagram and stay consistent.
>
> Source: architecture-diagram-generator skill.

| Token | Hex | Use |
|---|---|---|
| `--arch-frontend` | `#06b6d4` | UI tier — browser, SPA, mobile client |
| `--arch-backend` | `#10b981` | API tier — services, controllers, handlers |
| `--arch-database` | `#8b5cf6` | Persistence tier — SQL, NoSQL, search, cache |
| `--arch-cloud` | `#f59e0b` | Infrastructure tier — platform, IaaS, PaaS |
| `--arch-security` | `#f43f5e` | Security tier — IAM, WAF, KMS, secrets |
| `--arch-external` | `#64748b` | Third-party / out-of-boundary services |

### Usage example

```css
.arch-frontend { color: var(--arch-frontend); border-color: var(--arch-frontend); }
.arch-backend  { color: var(--arch-backend);  border-color: var(--arch-backend);  }
```

```html
<div class="fgraph-node arch-backend">
  <div class="fgraph-title">API Gateway</div>
</div>
```
