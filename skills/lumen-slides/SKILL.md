---
name: lumen-slides
description: Generate magazine-quality scroll-snap presentation deck as single HTML file. 10 slide patterns with reveal animations, horizontal (default) or vertical navigation, presenter mode with speaker notes + timer, content-budget quality gates, prefers-reduced-motion support. 13 fgraph aesthetics including modern glassmorphism / cyberpunk-neon / hand-drawn / aurora. Invoke when user asks for deck, slides, pitch, presentation, slides from issue #N.
version: 0.1.9 # x-release-please-version
---

# lumen-slides

Single-file scroll-snap deck. Inlined CSS + JS. Offline-playable. Magazine-quality typography, compositional variety, narrative arc.

📄 Rendered example: [`docs/examples/slides.html`](../../docs/examples/slides.html)

**Tier:** capability (atomic) — does not invoke other lumen skills. Composites and playbooks may invoke it.

## When to invoke

**Slides are always opt-in.** Only generate when this skill is explicitly invoked or the user asks for a slide deck.

Triggers: `create deck`, `make a deck`, `slides`, `slide deck`, `presentation deck`, `pitch deck`, `slides from #N`, `keynote-style`.

## Pipeline (Frame → Template → Structure → Style → Deliver)

Full recipe in `references/generate-slides-recipe.md`. Summary:

1. **Frame** — infer reader-action / takeaway / tone. Slides have a *temporal dimension* — compose a story arc, not a list of sections.
2. **Template** — load the pattern registry and assign a `pattern_key` to each planned slide. Reference `skills/lumen-slides/_templates/index.json` for the 10 available patterns and their metadata (composition variants, required/optional slots, CSS class contracts). Use `loadTemplateRegistry()` or `getPatternByKey()` from `src/utils/template-registry.ts` for programmatic access.
3. **Structure** before writing HTML:
   - Start with impact (title)
   - Build context (overview)
   - Deep dive (content, diagrams, data)
   - Resolve (summary, next steps)
   - Assign a composition (centered / left-heavy / right-heavy / split / edge-aligned / full-bleed) to each slide
4. **Style** — pick ONE aesthetic: typographic family (Midnight Editorial, Warm Signal, Terminal Mono, Swiss Clean), modern family (`glassmorphism`, `cyberpunk-neon`, `hand-drawn`, `aurora` — see `references/slide-modern-presets.md`), illustrated family, or any `_shared/aesthetics/*.css`. Commit to one direction; carry it through every slide. Vary from previous decks in the same session.
5. **Deliver** — start from `templates/slide-deck.html`. All CSS/JS inlined. Offline `file://` safe.

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

## Template registry

`skills/lumen-slides/_templates/index.json` is the canonical registry for the 10 slide patterns. Each entry maps a `pattern_key` to metadata:

| Field | Description |
|---|---|
| `pattern_key` | Stable identifier (e.g. `title`, `content`, `diagram`) |
| `name` | Human-readable label |
| `description` | When to use the pattern and its visual behavior |
| `composition_variants` | Allowed spatial approaches for this pattern |
| `required_slots` | CSS class selectors that must be present in the slide markup |
| `optional_slots` | Additional selectors that may appear |
| `css_class_contract` | Full set of selectors recognized by the SlideEngine for this pattern |
| `supports_reveal` | Whether `.reveal` child elements animate on scroll |

For programmatic access, `src/utils/template-registry.ts` exports:

- `loadTemplateRegistry()` — loads and validates `index.json`, returns a `TemplateRegistry` object. Cached after first call.
- `getPatternByKey(key)` — looks up a single `SlidePattern` by `pattern_key`. Returns `undefined` if the key is not found.

Validation enforces exactly 10 patterns, unique keys, and the full field schema. This registry is the single source of truth for both human authors (writing HTML by hand) and code generators (producing slides programmatically).

## SlideEngine (built into `templates/slide-deck.html`)

- Scroll-snap container, one slide per viewport
- **Navigation axis** via `data-nav` on `.deck`:
  - `horizontal` (**default**, keynote / board-room) — left/right swipe + arrows
  - `vertical` — scroll-doc style, up/down swipe + arrows
  - Toggle live with **`O`** (orientation)
- Keyboard nav: ← / → / ↑ / ↓ / PgUp / PgDn / Home / End / Space
- **`S`** — presenter mode (dual-window via `BroadcastChannel`; falls back to in-page overlay if the popup is blocked). Shows current title, next title, speaker notes, elapsed timer
- **`F`** — toggle fullscreen
- Touch swipe follows the active axis
- `prefers-reduced-motion` honored (no transitions, no `.reveal` stagger; instant `scrollIntoView`)
- Progress indicator (slide N / total) + dots (bottom for horizontal, right for vertical)
- URL fragment sync (`#slide-3`) for deep-link
- Print stylesheet (one slide per page; speaker notes printed below each slide)

### Speaker notes

Put talking points in an audience-hidden aside inside each `<section class="slide">`:

```html
<aside class="speaker-notes">
  Open with the outage story. Pause after the 40ms figure.
</aside>
```

Notes are stripped from content-budget body-text counts and only surface in presenter mode / print.

## Compositional variety (hard rule)

Consecutive slides MUST vary their spatial approach. Three centered slides in a row → push one off-axis. Alternate centered / left-heavy / right-heavy / split / edge-aligned / full-bleed.

## Visual richness

- Proactively reach for visuals. If `surf` CLI is available (`which surf`), generate images for title slides + full-bleed via `surf gemini --generate-image`. Embed as base64 data URI.
- Add SVG decorative accents, inline sparklines, mini-charts, and small Mermaid diagrams where they make the story compelling. Visual-first, text-second.
- Library guidance (Mermaid theming, Chart.js, font pairings) in `references/libraries.md`.

## Aesthetic presets

Two families of preset are available — pick **one direction** per deck and carry it through every slide.

### Theme discovery

Themes resolve via `src/utils/theme-resolver.ts` in hierarchical order (highest priority wins):

1. **Project override** — `<cwd>/_theme.css` in the working directory
2. **User-global override** — `~/.agent/lumen/_theme.css`
3. **Built-in preset fallback** — `skills/_shared/aesthetics/{preset}.css`

The `resolveTheme({ cwd, preset })` function returns the CSS string plus metadata about which source was used (`project`, `global`, or `preset`). If no custom theme is found, it falls back to the named preset (default `editorial`). This lets teams share a project-level `_theme.css`, individual users keep a personal default, and one-off decks still pick from the built-in library.

### Typographic family (4 — minimalist)

Detail in `references/slide-patterns.md`. Best for technical / executive audiences where text is the payload.

- **Midnight Editorial** (`midnight-editorial`) — dark serif, warm gold accents, magazine feel
- **Warm Signal** (`warm-signal`) — cream + amber, narrative tone
- **Terminal Mono** (`terminal-mono`) — monospace, high-contrast, technical
- **Swiss Clean** (`swiss-clean`) — minimalist, tight grid, sharp typography

### Modern family (4 — 2025+ stage-ready)

Detail in `references/slide-modern-presets.md`. Prefer these for external / high-stakes decks when you want a contemporary look without illustration.

- **Glassmorphism** (`glassmorphism`) — frosted panels, soft indigo field, gradient display type. SaaS / product launches.
- **Cyberpunk Neon** (`cyberpunk-neon`) — void black, cyan+magenta neon, Orbitron display. Tech demos, AI launches.
- **Hand-drawn** (`hand-drawn`) — warm paper, Caveat ink headings, imperfect geometry. Workshops, teaching, kickoffs.
- **Aurora** (`aurora`) — multi-stop luminous gradients, Outfit type, bloom fields. Vision / brand / investor days.

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

## Content budgets (hard quality gates)

Evidence-based limits (PLOS CompBio ten rules, UCSD multimedia learning, 5-5-5 / 6×6). Enforce while authoring; validate with `validateContentBudgets(html)` from `src/utils/content-budget.ts` before delivery.

| Rule | Soft (warn) | Hard (error) |
|---|---|---|
| Bullets per slide | ≤4 (UCSD rule of four) | ≤6 |
| Words per bullet | ≤12 | ≤20 |
| Major visual elements per slide | ≤6 (Phillips) | — |
| Consecutive text-heavy slides | ≤2 | — |
| Slide title | Assertive takeaway, not generic (`Results`, `Overview`, `Agenda`, …) | — |
| One idea per slide | Heading states the single claim; no multi-topic slides | — |

**Authoring checklist (every slide):**
1. Can the distracted viewer read the takeaway from the title alone?
2. ≤4 bullets, each a short phrase — not a sentence paragraph
3. Prefer a diagram / KPI / image over a fifth bullet
4. Add `<aside class="speaker-notes">` for anything you would otherwise dump on the slide
5. No three text-only slides in a row — break with visual / quote / diagram

## Quality checks

- Each slide fits in viewport (100vh / 100vw) without internal page scroll
- Content-budget report has **zero errors** (`contentBudgetHasErrors(report) === false`)
- Code slides: syntax highlighting works offline (no CDN dep that breaks `file://`)
- Tables: sticky header on scroll within slide
- `prefers-reduced-motion` disables all `.reveal`
- Aesthetic chosen is recorded in HTML comment for traceability
- Compositional rule satisfied (no three consecutive same-composition slides)
- Story arc has an impact-build-resolve shape (no "list of sections")
- Mermaid diagrams (if any) use the zoom-pan pattern from `lumen-mermaid`
- Deck root is `<div class="deck" data-nav="horizontal">` unless the user asked for a vertical scroll-doc
- Presenter mode works: at least the title + closing slides carry `speaker-notes`
- Keyboard hints mention S / F / O

## Output

Single HTML file written to `~/.agent/lumen/<slug>.html`. Open in browser.

## PI extension route (v0.1.x)

Not wired through `lumen-generate_visual` PI tool. A deterministic schema (array of typed slides with pattern keys, titles, bullets, and optional diagram references) is feasible but not yet implemented. The LLM-authored CC path remains the right fit for decks that need multi-step compositional planning and image generation.

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
