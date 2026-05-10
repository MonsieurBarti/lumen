---
name: lumen-slides
description: Generate magazine-quality scroll-snap presentation deck as single HTML file. 10 slide patterns with reveal animations, keyboard + touch navigation, prefers-reduced-motion support. 4+ aesthetic presets. Invoke when user asks for deck, slides, pitch, presentation, slides from issue #N.
version: 0.1.7 # x-release-please-version
---

# lumen-slides

Single-file scroll-snap deck. Inlined CSS + JS. Offline-playable. Magazine-quality typography, compositional variety, narrative arc.

📄 Rendered example: [`docs/examples/slides.html`](../../docs/examples/slides.html)

**Tier:** capability (atomic) — does not invoke other lumen skills. Composites and playbooks may invoke it.

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

Two families of preset are available — pick **one direction** per deck and carry it through every slide.

### Typographic family (4 — minimalist)

Detail in `references/slide-patterns.md`. Best for technical / executive audiences where text is the payload.

- **Midnight Editorial** — dark serif, warm gold accents, magazine feel
- **Warm Signal** — cream + amber, narrative tone
- **Terminal Mono** — monospace, high-contrast, technical
- **Swiss Clean** — minimalist, tight grid, sharp typography

### Illustrated family (6 — visual-rich, AI-generation-friendly)

Summary below; detailed per-preset specs (palette tokens, typography, layout rules, decorative SVG fragments, image-prompt templates, do/don't) in `references/slide-illustrated-presets.md`.

- **comic-strip** — warm round-headed characters with minimalist bodies, sparse backgrounds, occasional speech bubbles, zigzag ground/grass lines. Beige + sky-blue + grass-green palette. Best for warm, story-led explainers.
- **ligne-claire** — uniform line weight, flat color fills, 2–4 panel layouts, info-clarity over emotional warmth. Best for technical sequences where comic framing aids comprehension.
- **neo-pop-magazine** — aggressive typographic contrast (titles ~50% of slide), color-block sections, youth / social-feed aesthetic. Best for launch announcements and consumer-facing decks.
- **bauhaus-geometric** — circle / triangle / square / star carry semantic meaning per step; primary red-blue-yellow on paper white; form follows function. Best for process / framework decks where shapes reinforce structure.
- **engineering-blueprint** — white line-drawings on deep blueprint blue (~75% bg coverage), grid paper, dimension lines, red annotations as ~5% accent. Best for systems / architecture decks.
- **neo-brutalism** — 4–6px thick black borders on every element, high-saturation color blocks, ultra-large sans-serif (3–6vw), 6–10px solid drop shadows. Best for far-distance readability on long decks (auditorium, projection).

### Design heuristic — illustration beats minimalism for AI imagery

When generating images for a deck via `surf gemini --generate-image` or similar, **prefer illustrated presets over typographic-minimalist ones**. Illustrated styles have an explicit visual vocabulary (lines, characters, color blocks) that image models can exploit; minimalist styles (dark bg + glowing text + whitespace) lack visual elements to anchor generation and produce flat, empty results. Image prompts should be **short** — 3 sentences describing mood and content beat 30-line specifications.

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
- [`alchaincyf/huashu-skills`](https://github.com/alchaincyf/huashu-skills) — *idea-level credit only, no license at time of writing.* The `huashu-slides` skill's 18-style taxonomy and the heuristic that illustration beats minimalism for AI image generation informed the 6 illustrated presets and the "Design heuristic" note above. Lumen presets are independently authored in English with generic art-history names — no Snoopy/xkcd/Oatmeal-style brand references, no file-level reuse.
