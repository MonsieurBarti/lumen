---
name: lumen-slides
description: Generate magazine-quality scroll-snap presentation deck as single HTML file. 10 slide patterns with reveal animations, keyboard + touch navigation, prefers-reduced-motion support. 4+ aesthetic presets. Invoke when user asks for deck, slides, pitch, presentation, slides from issue #N.
version: 0.1.3 # x-release-please-version
---

# lumen-slides

Single-file scroll-snap deck. Inlined CSS + JS. Offline-playable. Magazine-quality typography, compositional variety, narrative arc.

## When to invoke

**Slides are always opt-in.** Only generate when this skill is explicitly invoked or the user asks for a slide deck.

Triggers: `create deck`, `make a deck`, `slides`, `slide deck`, `presentation deck`, `pitch deck`, `slides from #N`, `keynote-style`.

## Pipeline (Frame → Structure → Style → Deliver)

Full recipe in `references/generate-slides-recipe.md`. Summary:

1. **Frame** — infer reader-action / takeaway / tone. Slides have a *temporal dimension* — compose a story arc, not a list of sections.
2. **Plan the sequence** before writing HTML:
   - Start with impact (title)
   - Build context (overview)
   - Deep dive (content, diagrams, data)
   - Resolve (summary, next steps)
   - Assign a composition (centered / left-heavy / right-heavy / split / edge-aligned / full-bleed) to each slide
3. **Style** — pick ONE aesthetic from the 4 slide presets in `references/slide-patterns.md` (Midnight Editorial, Warm Signal, Terminal Mono, Swiss Clean) or riff on a `_shared/aesthetics/*.css` file. Commit to one direction; carry it through every slide. Vary from previous decks in the same session.
4. **Deliver** — start from `templates/slide-deck.html`. All CSS/JS inlined. Offline `file://` safe.

## 10 slide patterns

Exact `.slide--{type}` selectors recognized by the SlideEngine in `templates/slide-deck.html`. Full per-pattern HTML structure + decorative SVG + composition variants in `references/slide-patterns.md`.

| Selector | Use |
|---|---|
| `.slide--title` | Hero (heading + subtitle + optional bg image) |
| `.slide--section` | Section header (thin heading + color bar) |
| `.slide--content` | Heading + paragraphs + bullet list |
| `.slide--quote` | Full-bleed quote + attribution |
| `.slide--image` | Full-bleed image + optional caption |
| `.slide--code` | Code block with syntax highlighting |
| `.slide--comparison` | Side-by-side columns |
| `.slide--table` | HTML table with sticky header |
| `.slide--diagram` | Inline fgraph or Mermaid; reuse `lumen-diagram` / `lumen-mermaid` |
| `.slide--closing` | Final slide (CTA, contact) |

All patterns support `.reveal` child elements for stagger-in animations.

## SlideEngine (built into `templates/slide-deck.html`)

- Scroll-snap container, one slide per viewport
- Keyboard nav: ↑ / ↓ / PgUp / PgDn / Home / End / Space
- Touch swipe (vertical)
- `prefers-reduced-motion` honored (no transitions, no `.reveal` stagger)
- Progress indicator (slide N / total)
- URL fragment sync (`#slide-3`) for deep-link
- Print stylesheet (one slide per page)

## Compositional variety (hard rule)

Consecutive slides MUST vary their spatial approach. Three centered slides in a row → push one off-axis. Alternate centered / left-heavy / right-heavy / split / edge-aligned / full-bleed.

## Visual richness

- Proactively reach for visuals. If `surf` CLI is available (`which surf`), generate images for title slides + full-bleed via `surf gemini --generate-image`. Embed as base64 data URI.
- Add SVG decorative accents, inline sparklines, mini-charts, and small Mermaid diagrams where they make the story compelling. Visual-first, text-second.
- Library guidance (Mermaid theming, Chart.js, font pairings) in `references/libraries.md`.

## Aesthetic presets

4 slide-specific presets in `references/slide-patterns.md`:

- **Midnight Editorial** — dark serif, warm gold accents, magazine feel
- **Warm Signal** — cream + amber, narrative tone
- **Terminal Mono** — monospace, high-contrast, technical
- **Swiss Clean** — minimalist, tight grid, sharp typography

Or riff on any of `_shared/aesthetics/*.css` adapted for slides (5 options there).

`templates/slide-deck-base.css` (lifted from roxabi-forge) provides an alternative styling foundation if you want roxabi's slide tokens instead of visual-explainer's defaults.

## Quality checks

- Each slide fits in viewport (100vh) without scroll
- Code slides: syntax highlighting works offline (no CDN dep that breaks `file://`)
- Tables: sticky header on scroll within slide
- `prefers-reduced-motion` disables all `.reveal`
- Aesthetic chosen is recorded in HTML comment for traceability
- Compositional rule satisfied (no three consecutive same-composition slides)
- Story arc has an impact-build-resolve shape (no "list of sections")
- Mermaid diagrams (if any) use the zoom-pan pattern from `lumen-mermaid`

## Output

Single HTML file written to `~/.agent/lumen/<slug>.html`. Open in browser.

## PI extension route (v0.1.x)

Not wired through `lumen-generate_visual` PI tool. Slides need multi-step compositional planning + image generation; LLM-authored CC path is the right fit. Deterministic slide renderer is not planned.

## Sources

- [`nicobailon/visual-explainer/plugins/visual-explainer/templates/slide-deck.html`](https://github.com/nicobailon/visual-explainer) (MIT) — canonical 10-pattern SlideEngine + scroll-snap shell
- [`nicobailon/visual-explainer/plugins/visual-explainer/references/slide-patterns.md`](https://github.com/nicobailon/visual-explainer) (MIT) — 1400-line per-pattern walkthrough + 4 aesthetic presets
- [`nicobailon/visual-explainer/plugins/visual-explainer/references/libraries.md`](https://github.com/nicobailon/visual-explainer) (MIT) — Mermaid theming, Chart.js, font pairings
- [`nicobailon/visual-explainer/plugins/visual-explainer/commands/generate-slides.md`](https://github.com/nicobailon/visual-explainer) (MIT) — full LLM authoring recipe → `references/generate-slides-recipe.md`
- [`Roxabi/roxabi-forge/plugins/forge/references/slide-templates/slide-deck-base.css`](https://github.com/Roxabi/roxabi-forge) (MIT) — alternative slide styling foundation
- [`Roxabi/roxabi-forge/plugins/forge/references/slide-patterns.md`](https://github.com/Roxabi/roxabi-forge) (MIT) — complementary slide-pattern perspective → `references/slide-patterns-roxabi.md`
- `lumen-mermaid` (this package) — for `.slide--diagram` Mermaid embeds
- `lumen-diagram` (this package) — for `.slide--diagram` fgraph embeds
