# Modern slide presets — design language reference

Per-preset specs for the **modern family** declared in `../SKILL.md`:

| Preset | File | Mood |
|---|---|---|
| `glassmorphism` | `skills/_shared/aesthetics/glassmorphism.css` | Frosted glass / soft field |
| `cyberpunk-neon` | `skills/_shared/aesthetics/cyberpunk-neon.css` | Void + neon |
| `hand-drawn` | `skills/_shared/aesthetics/hand-drawn.css` | Sketchbook / marker |
| `aurora` | `skills/_shared/aesthetics/aurora.css` | Luminous gradients |

These complement the typographic family (`slide-patterns.md`) and the illustrated family (`slide-illustrated-presets.md`). Pick **one** preset per deck.

## When to pick modern

| Audience / job | Prefer |
|---|---|
| SaaS product launch, AI demo, polished keynote | `glassmorphism` or `aurora` |
| Hacker conference, infra/security talk, night energy | `cyberpunk-neon` |
| Workshop, offsite, teaching, internal kickoff | `hand-drawn` |
| Investor day / brand vision / 2025+ trend look | `aurora` |
| Dense technical brief, board numbers | typographic (`swiss-clean`, `midnight-editorial`) |
| AI-generated character / comic imagery | illustrated family |

## Shared authoring rules

1. **Load the CSS via theme resolution** — `resolveTheme({ preset: "aurora" })` or paste the file into the deck `<style>` block.
2. **Load the fonts** named in each file's header comment (Google Fonts links). Offline decks should self-host or fall back to system stacks already listed.
3. **Do not mix families** mid-deck. A glass title slide + hand-drawn content slide reads as unfinished.
4. **Respect `prefers-reduced-motion`** — every modern preset disables glow/blur/rotation flourishes under reduced motion.
5. **Content budgets still apply** — modern styles are louder; keep ≤4 bullets and assertive titles so the chrome doesn't drown the message.

---

## glassmorphism

**Tokens to know**

| Token | Role |
|---|---|
| `--surface` / `--surface-elevated` | Translucent white-on-indigo panels |
| `--glass-blur` | Backdrop blur radius (disabled under reduced motion) |
| `--glass-shine` | Inset top highlight on cards |
| `--field-a/b/c` | Ambient gradient field stops |

**Layout rules**

- Prefer cards (KPI, code, table, mermaid-wrap) — the frosted treatment is the identity.
- Title display uses gradient text (text → accent). Don't put a photo behind the title unless it stays low-contrast.
- Avoid pure black fills; the ambient field is part of the look.

**Do**

- Large single claim on title slides
- KPI grids (glass cards stack beautifully)
- Soft diagrams with muted strokes

**Don't**

- Dense 6-column tables (glass borders dissolve hierarchy)
- Hot neon accents (that's cyberpunk)

**Font pair:** Sora (display/body) + IBM Plex Mono (code)

---

## cyberpunk-neon

**Tokens to know**

| Token | Role |
|---|---|
| `--accent` | Hot cyan neon (`#00ffc8`) |
| `--neon-magenta` | Secondary neon for labels / section numbers |
| `--neon-yellow` / `--neon-blue` | Sparse tertiary accents |
| `--accent-glow` | Text-shadow / box-shadow bloom |

**Layout rules**

- Dark void only. Light theme is a dim variant, not a white deck.
- Uppercase display type (Orbitron). Body stays mono (Share Tech Mono).
- One neon color per emphasis — cyan for primary claims, magenta for meta labels. Never rainbow every element.

**Do**

- Short punchy titles
- Code slides (native habitat)
- Progress bar / dots as neon chrome

**Don't**

- Long paragraph body copy (mono + glow kills readability)
- Soft pastels or serif type
- Stock photography (breaks the void)

**Font pair:** Orbitron (display) + Share Tech Mono (body/code)

---

## hand-drawn

**Tokens to know**

| Token | Role |
|---|---|
| `--ink` | Near-black / near-cream stroke color |
| `--marker-blue/green/yellow` | Secondary marker pens |
| `--wobble` | Intentional imperfection scale |
| Organic `border-radius` | `255px 15px 225px 15px / 15px…` blob radii |

**Layout rules**

- Light paper is the default. Dark is charcoal paper, not pure black.
- Headings in Caveat, slightly rotated (`-0.5deg` to `-1.2deg`). Body in Literata.
- Borders are 2px ink with asymmetric radii — never 8px perfect rounds.

**Do**

- Workshop agendas, teaching arcs, "how we got here" stories
- Quote slides (Caveat loves long lines)
- Rough process diagrams

**Don't**

- Financial tables that need surgical precision
- Cyberpunk / glass flourishes
- Perfect geometric grids (use `swiss-clean` instead)

**Font pair:** Caveat (display) + Literata (body) + IBM Plex Mono (code)

---

## aurora

**Tokens to know**

| Token | Role |
|---|---|
| `--aurora-1..4` | Cyan → violet → pink → green gradient stops |
| `--accent` | Teal midpoint for UI chrome |
| Gradient text / bars | Display type and progress use multi-stop fills |

**Layout rules**

- Ambient bloom fields on every slide (already in the CSS). Keep content cards slightly elevated so type stays legible.
- Title display is pure gradient text. Subtitles get a short gradient underline bar.
- KPI values may use gradient text; labels stay solid dim.

**Do**

- Vision / brand / multi-year strategy decks
- Big single-number impact slides
- Closing CTAs as filled gradient pills

**Don't**

- Overuse gradient text on body copy (only display + KPI values)
- Muddy the field with heavy photography
- Pair with hand-drawn (competing warmth models)

**Font pair:** Outfit (display/body) + JetBrains Mono (code)

---

## Quick pick flowchart

```
External + polished?
  ├─ Night / neon energy → cyberpunk-neon
  ├─ Soft product / SaaS → glassmorphism
  └─ Vision / brand bloom → aurora
Internal / human?
  └─ Workshop / teach → hand-drawn
Dense / sober numbers?
  └─ Leave modern family → swiss-clean or midnight-editorial
```

## Applying a preset in a deck

```html
<!-- 1. Fonts from the preset header -->
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;800&family=JetBrains+Mono&display=swap" rel="stylesheet">

<!-- 2. Tokens + slide mode -->
<style>
  /* paste skills/_shared/aesthetics/aurora.css here, or inject via resolveTheme() */
</style>

<!-- 3. Record the choice for traceability -->
<!-- aesthetic: aurora -->
<div class="deck" data-nav="horizontal" data-aesthetic="aurora">
  …
</div>
```

Or at build time:

```ts
import { resolveTheme } from "../../../src/utils/theme-resolver.ts";
const theme = await resolveTheme({ preset: "glassmorphism" });
// inject theme.css into <style data-injected-theme="…">
```
