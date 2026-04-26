# Illustrated slide presets — design language reference

Per-preset specs for the 6 illustrated presets declared in `../SKILL.md`. The illustrated family is **visual-rich, AI-generation-friendly**, and intended for decks where imagery is part of the message.

This complements `slide-patterns.md` (the typographic family) and `slide-patterns-roxabi.md` (alternative typographic perspective). Pick **one** preset per deck and carry it through every slide.

## When to pick illustrated over typographic

Pick illustrated when:
- You will generate AI imagery (stronger visual vocabulary = better generation)
- The audience is non-technical or consumer-facing
- The story is narrative / emotional rather than analytical
- The deck will be projected at a distance (illustrated styles read further)

Pick typographic when:
- The payload is dense text or code (illustrated styles distract from reading)
- The audience expects a sober technical brief
- You have no image-generation tooling available

## Image-prompt rules (apply to every illustrated preset)

When generating background or hero images via `surf gemini --generate-image` or similar:

1. **Short prompts beat long prompts.** 3 sentences describing mood + content + style. Not 30 lines specifying every visual detail.
2. **Name the style explicitly** in the prompt — "ligne-claire comic", "Bauhaus geometric poster", "engineering blueprint". The style name is the most load-bearing token.
3. **Skip negative prompts** unless something specific is going wrong. They rarely improve quality and often dilute the style signal.
4. **Generate 4 variants** and pick the best. Image generation is stochastic; one shot rarely lands.

## Cross-cutting decorative SVG patterns

These fragments work in any illustrated preset; pick the ones that fit the chosen visual vocabulary.

```html
<!-- Halftone dot pattern (Risograph / Oatmeal / vintage) -->
<svg width="100%" height="100%" class="halftone">
  <defs>
    <pattern id="halftone" x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
      <circle cx="3" cy="3" r="1.4" fill="currentColor" opacity="0.45" />
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#halftone)" />
</svg>

<!-- Hand-drawn wavy underline (comic / ligne-claire) -->
<svg viewBox="0 0 200 12" class="wavy-underline">
  <path d="M 4 8 Q 24 2 44 8 T 84 8 T 124 8 T 164 8 T 196 8"
        stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" />
</svg>

<!-- Speech-bubble tail (comic-strip) -->
<svg viewBox="0 0 40 30" class="bubble-tail">
  <path d="M 4 4 Q 18 4 32 4 L 32 18 Q 32 22 28 22 L 14 22 L 6 28 L 10 22 Q 4 22 4 18 Z"
        fill="currentColor" />
</svg>
```

---

## `comic-strip`

**Signal:** "Warm, character-led, story-shaped."

Palette tokens:

```css
.slide--comic-strip {
  --bg: #f4ead5;            /* warm beige paper */
  --ink: #2a2a2a;           /* not pure black — softens the line */
  --sky: #b8d8e3;           /* sky / panel-bg accent */
  --grass: #8db580;         /* ground accent */
  --warm-pop: #d97757;      /* highlight on speech bubbles, key callouts */
  --line-weight: 2.5px;
}
```

Typography:

```css
.slide--comic-strip h1, .slide--comic-strip h2 {
  font-family: "Patrick Hand", "Caveat", "Comic Neue", system-ui, sans-serif;
  font-weight: 700;
  letter-spacing: -0.01em;
}
.slide--comic-strip p, .slide--comic-strip li {
  font-family: "Atkinson Hyperlegible", "Inter", system-ui, sans-serif;
  font-size: 1.4rem;
  line-height: 1.55;
}
.slide--comic-strip .speech-bubble {
  background: white;
  border: var(--line-weight) solid var(--ink);
  border-radius: 14px;
  padding: 12px 16px;
  font-family: "Patrick Hand", system-ui;
  position: relative;
}
```

Layout rules:
- Ground line (zigzag grass or simple curve) anchors most slides
- Characters use simple round heads (a circle), minimalist bodies (1–2 strokes)
- Speech bubbles for key insights — at most 1 per slide
- Backgrounds sparse — `var(--bg)` covers 70–85% of the slide

Image-prompt template:

> "A warm beige illustration of [scene], gentle round-headed character in [pose], minimalist body, soft sky-blue and grass-green accents, hand-drawn ink line, sparse background, comic-strip style."

Do:
- Use one or two characters consistently across the deck
- Let whitespace breathe; resist filling every corner

Don't:
- Don't use Snoopy, Peanuts, or any trademarked character — the style is the inspiration, not the brand
- Don't over-detail backgrounds; sparseness IS the aesthetic

---

## `ligne-claire`

**Signal:** "Tintin meets technical doc. Clarity over warmth."

Palette tokens:

```css
.slide--ligne-claire {
  --bg: #fefaf2;            /* off-white paper */
  --ink: #1a1a1a;           /* near-black, uniform */
  --fill-1: #c14a36;        /* primary flat fill */
  --fill-2: #2e6f9a;        /* secondary flat fill */
  --fill-3: #d4a93a;        /* accent fill */
  --fill-4: #5b8a52;        /* tertiary fill */
  --line-weight: 2px;       /* uniform — never varies within a frame */
}
```

Typography:

```css
.slide--ligne-claire h1 {
  font-family: "Playfair Display", "Bodoni Moda", serif;
  font-weight: 700;
  letter-spacing: -0.02em;
}
.slide--ligne-claire p, .slide--ligne-claire li {
  font-family: "Source Serif Pro", "Lora", Georgia, serif;
  font-size: 1.35rem;
  line-height: 1.5;
}
```

Layout rules:
- 2–4 panels per slide, equal-sized, separated by `var(--line-weight)` borders
- Each panel: flat-color shapes with `var(--line-weight)` outlines, uniform across all elements
- No gradients, no shadows, no halftones — flat fills only
- Information hierarchy via panel sequence (left-to-right, top-to-bottom), not size

Image-prompt template:

> "A ligne-claire illustration of [scene], uniform 2px black outline, flat color fills (warm red, navy blue, ochre, sage green), no shading, no gradients, off-white background, technical clarity."

Do:
- Use uniform line weight everywhere — that's the defining trait
- Compose 2-, 3-, or 4-panel sequences for process/state slides

Don't:
- Don't vary line weight for emphasis. Use color or panel size instead.
- Don't add textures or gradients. Flat is the rule.

---

## `neo-pop-magazine`

**Signal:** "Loud, youthful, screen-scroll-stopping."

Palette tokens:

```css
.slide--neo-pop {
  --bg: #ffffff;
  --block-1: #ff5b87;       /* hot pink */
  --block-2: #4361ee;       /* electric blue */
  --block-3: #ffd23f;       /* sun yellow */
  --block-4: #06d6a0;       /* mint */
  --ink: #1a1a1a;
}
```

Typography:

```css
.slide--neo-pop h1 {
  font-family: "Druk", "Anton", "Bebas Neue", "Inter Tight", sans-serif;
  font-size: clamp(4rem, 12vw, 11rem);    /* titles ~50% of slide height */
  font-weight: 900;
  line-height: 0.85;
  letter-spacing: -0.04em;
  text-transform: uppercase;
}
.slide--neo-pop p, .slide--neo-pop li {
  font-family: "Inter", "Helvetica Neue", system-ui, sans-serif;
  font-weight: 500;
  font-size: 1.5rem;
  line-height: 1.4;
}
```

Layout rules:
- Aggressive type-to-image ratio (~10:1) — title dominates the slide
- Color blocks at **slide-quarter or slide-half** scale, not small accents
- Bleed elements off the edge of the slide for kinetic feel
- One block, one secondary block, max — three+ becomes noise

```html
<section class="slide--neo-pop">
  <div class="block block--1" style="position:absolute;top:0;left:0;width:42%;height:60%;background:var(--block-1);"></div>
  <div class="block block--2" style="position:absolute;bottom:0;right:0;width:60%;height:30%;background:var(--block-2);"></div>
  <h1 style="position:relative;color:var(--ink);">SHIP IT</h1>
  <p style="position:relative;">Q4 launch, the unfiltered version.</p>
</section>
```

Image-prompt template:

> "A neo-pop magazine cover illustration of [subject], bold color blocks (hot pink, electric blue, sun yellow), oversized type bleeding off edges, high-contrast and kinetic, white background."

Do:
- Commit to the loudness. Half-loud reads as broken, not subtle.
- Bleed at least one element off-slide every 3–4 slides for energy

Don't:
- Don't shrink the title to fit politely. Let it dominate.
- Don't use 5+ block colors. The vocabulary is small on purpose.

---

## `bauhaus-geometric`

**Signal:** "Form follows function. Geometry IS the meaning."

Palette tokens:

```css
.slide--bauhaus {
  --bg: #f5f1e8;            /* paper white, warm */
  --primary-red: #e63946;
  --primary-blue: #1d3557;
  --primary-yellow: #f4a261;
  --ink: #1a1a1a;
}
```

Semantic shape vocabulary (the load-bearing rule):

| Shape | Meaning |
|---|---|
| Circle | wholeness, beginning, audience, completion |
| Triangle | direction, hierarchy, force, change |
| Square | structure, foundation, system, stability |
| Star (5-pt) | accent, signal, milestone — use sparingly |

Within a deck, **each shape carries the same meaning on every slide.** Don't use a circle for "complete" on slide 3 and "start" on slide 7.

Typography:

```css
.slide--bauhaus h1, .slide--bauhaus h2 {
  font-family: "Futura", "Avenir Next", "Cabinet Grotesk", sans-serif;
  font-weight: 700;
  letter-spacing: -0.01em;
  text-transform: lowercase;          /* Bauhaus typographic preference */
}
.slide--bauhaus p, .slide--bauhaus li {
  font-family: "Futura", "Avenir Next", system-ui, sans-serif;
  font-weight: 400;
  font-size: 1.4rem;
  line-height: 1.45;
}
```

Layout rules:
- Compose with primary shapes at large scale (≥ 25% of slide)
- Two- or three-color combinations only; never four
- Diagonal compositions allowed; rotations in 15° increments
- Type aligns to shape edges, not the slide grid

Image-prompt template:

> "A Bauhaus-style poster of [subject], primary red, blue, and yellow shapes (circle, triangle, square) on warm paper-white background, bold geometric composition, lowercase Futura headline, no shading."

Do:
- Pick a shape vocabulary on slide 1 and reuse it consistently
- Use lowercase headlines — it's part of the visual signature

Don't:
- Don't use 4+ primary colors. Three is the cap.
- Don't add shadows or gradients. Flat geometry only.

---

## `engineering-blueprint`

**Signal:** "Reading a technical drawing. Precision, not decoration."

Palette tokens:

```css
.slide--blueprint {
  --bg: #0a3d62;             /* deep blueprint blue */
  --line: #f1f5f9;           /* near-white grid + drawings */
  --line-faint: rgba(241, 245, 249, 0.18);
  --annotation: #e63946;     /* red — used for ~5% of pixels max */
  --highlight: #ffd23f;      /* yellow — used for 1–2 callouts only */
}
```

Typography:

```css
.slide--blueprint h1, .slide--blueprint h2 {
  font-family: "Iosevka", "JetBrains Mono", "IBM Plex Mono", monospace;
  font-weight: 600;
  color: var(--line);
  letter-spacing: 0.02em;
}
.slide--blueprint p, .slide--blueprint li {
  font-family: "Iosevka", "JetBrains Mono", monospace;
  color: var(--line);
  font-size: 1.2rem;
  line-height: 1.5;
}
.slide--blueprint .annotation {
  color: var(--annotation);
  font-family: "Iosevka", monospace;
  font-size: 0.95rem;
}
```

Layout rules:
- Background: subtle grid (faint hairlines every 20–40px) covering full slide
- Drawings: white-line on blue, like CAD output
- Dimension lines (with arrowheads at both ends) on technical shapes
- Annotations in red, sparingly — never more than 5% of slide pixels

```html
<svg class="bp-grid" width="100%" height="100%">
  <defs>
    <pattern id="bp-grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--line-faint)" stroke-width="0.5"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="var(--bg)"/>
  <rect width="100%" height="100%" fill="url(#bp-grid)"/>
</svg>
```

Image-prompt template:

> "A blueprint-style technical illustration of [subject], white line drawings on deep blue background, fine grid paper, dimension lines and arrows, red annotations as 5% accent, CAD aesthetic."

Do:
- Use dimension lines on key shapes for authenticity
- Keep red truly sparse. It's a signal, not decoration.

Don't:
- Don't use full-color photography against the blue. It breaks the visual contract.
- Don't use multiple highlight colors. Red is the only annotation hue.

---

## `neo-brutalism`

**Signal:** "Readable from the back row. No subtlety, all impact."

Palette tokens:

```css
.slide--neo-brutalism {
  --bg: #ffe957;             /* high-saturation yellow (or swap per deck) */
  --block-1: #fa4659;
  --block-2: #2eb872;
  --block-3: #4361ee;
  --ink: #1a1a1a;            /* always near-black borders */
  --border-weight: 5px;
  --shadow-offset: 8px;
}
```

Typography:

```css
.slide--neo-brutalism h1 {
  font-family: "Archivo Black", "Anton", "Inter Tight", sans-serif;
  font-weight: 900;
  font-size: clamp(3rem, 6vw, 6rem);
  line-height: 0.95;
  letter-spacing: -0.02em;
  color: var(--ink);
}
.slide--neo-brutalism p, .slide--neo-brutalism li {
  font-family: "Inter", system-ui, sans-serif;
  font-weight: 600;
  font-size: 1.6rem;
  line-height: 1.35;
  color: var(--ink);
}
```

Layout rules — **the borders are the design**:

```css
.slide--neo-brutalism .block,
.slide--neo-brutalism .card,
.slide--neo-brutalism img,
.slide--neo-brutalism button {
  border: var(--border-weight) solid var(--ink);
  box-shadow: var(--shadow-offset) var(--shadow-offset) 0 0 var(--ink);
  border-radius: 0;             /* never rounded */
}
.slide--neo-brutalism .block:hover {
  transform: translate(2px, 2px);
  box-shadow: calc(var(--shadow-offset) - 2px) calc(var(--shadow-offset) - 2px) 0 0 var(--ink);
}
```

- Every visible element has a 4–6px solid black border
- Every element has a 6–10px solid drop shadow (no blur — pure offset)
- Drop shadows always offset toward the same corner across the deck (consistency)
- Hover/active states: shorten the shadow to "press in" the element
- High-saturation backgrounds (yellow / hot pink / lime) — pick one per deck

Image-prompt template:

> "A neo-brutalist poster illustration of [subject], thick 5px black borders on every shape, high-saturation yellow background, hot-pink and green color blocks, hard 8px black drop shadows, ultra-bold sans-serif type, no rounded corners."

Do:
- Apply borders to **every** visible element. Half-bordered reads as broken.
- Pick a single shadow direction (e.g. bottom-right) and stick with it.

Don't:
- Don't use rounded corners. Brutalism is square.
- Don't blur shadows. Hard offsets only.

---

## Cross-preset image-generation cheatsheet

When picking which preset to image-generate **first** (limited budget):

| Preset | AI generation quality | Why |
|---|---|---|
| `comic-strip` | ⭐⭐⭐⭐⭐ | strong visual vocabulary, well-represented in training data |
| `bauhaus-geometric` | ⭐⭐⭐⭐⭐ | iconic, named, geometric — easy targets |
| `neo-brutalism` | ⭐⭐⭐⭐ | high-contrast borders are easy; sometimes models blur shadows |
| `ligne-claire` | ⭐⭐⭐⭐ | well-defined; uniform line weight occasionally drifts |
| `engineering-blueprint` | ⭐⭐⭐⭐ | strong mode; sometimes models add false 3D detail |
| `neo-pop-magazine` | ⭐⭐⭐ | type-heavy, models often misrender large display type |

Generate imagery in the strong-mode presets; reach for the rest only when story demands it.
