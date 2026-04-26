# Slide Patterns

CSS patterns, JS engine, slide type layouts, transitions, navigation chrome, and aesthetic presets for single-file HTML presentation decks. All slides are `100dvh` viewport-fit, single-file, offline-playable under `file://`.

**Trigger phrases:** "as a slide deck", "make a deck", "forge slides", `forge-slides`, `/forge-slides`, `--slides` flag. Never auto-select slide format — only on explicit request.

**4-phase pipeline position:** This doc is read during **Phase 3 (Generation)**. It tells the skill which HTML structure, class names, and CSS hooks to emit for each slide type. Phase 1 (Context) handles brand detection and aesthetic selection. Phase 2 (Decision) runs the Frame and produces the silent deck outline. Phase 4 (Deliver) writes the output file and runs the checklist.

---

## When to Use `forge-slides` vs Other Forge Skills

| Situation | Skill |
|---|---|
| Presenting to a room / screen-share / async video | `forge-slides` |
| Detailed technical guide or walkthrough | `forge-guide` |
| Issue/epic analysis for contributors or stakeholders | `forge-epic` |
| Visual explainer or architecture diagram | `forge-epic` or `forge-guide` + fgraph |
| A/B comparison gallery for generated artifacts | `forge-gallery` |
| Charts and metrics (standalone) | `forge-chart` |

**Decision rule:** slides when the reader navigates through a sequence with clear pacing. Guides and epics when the reader scrolls and scans at will.

---

## Slide Engine Base

The deck is a scroll-snap container. Each slide is exactly one viewport tall.

```html
<body>
<div class="deck">
  <section class="slide slide--title">...</section>
  <section class="slide slide--section">...</section>
  <section class="slide slide--content">...</section>
  <!-- one <section> per slide -->
</div>
</body>
```

```css
/* Scroll-snap container */
.deck {
  height: 100dvh;
  overflow-y: auto;
  scroll-snap-type: y mandatory;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
}

/* Individual slide */
.slide {
  height: 100dvh;
  scroll-snap-align: start;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: clamp(40px, 6vh, 80px) clamp(40px, 8vw, 120px);
  isolation: isolate;
}
```

---

## 10 Slide Types

Each type uses `.slide.slide--{type}` plus internal element classes prefixed with `slide__`. Adapt colors and spacing per aesthetic; keep structural class names consistent so `SlideEngine` and CSS hooks resolve correctly.

### title

**Purpose:** Full-viewport hero opening the deck. Sets visual tone and topic. One heading, one subtitle or date.

**HTML shape:**

```html
<section class="slide slide--title">
  <svg class="slide__decor slide__decor--corner" ...></svg><!-- optional -->
  <div class="slide__content reveal">
    <h1 class="slide__display">Deck Title</h1>
    <p class="slide__subtitle reveal">Subtitle or date</p>
  </div>
</section>
```

**CSS hook points:** `.slide--title` (centering), `.slide__display` (48–120px display type), `.slide__subtitle` (mono, dimmed), `.slide__decor` (decorative SVG accents).

**Content fit:** 1 heading + 1 subtitle max. Background via gradient or `slide__bg` image. Display text at max scale — never smaller than 48px.

```css
.slide--title {
  justify-content: center;
  align-items: center;
  text-align: center;
}
```

---

### section

**Purpose:** Breathing room between topics. Oversized decorative section number (ultra-light weight) with heading. No body text.

**HTML shape:**

```html
<section class="slide slide--section">
  <span class="slide__number">02</span>
  <div class="slide__content">
    <h2 class="slide__heading reveal">Section Title</h2>
    <p class="slide__subtitle reveal">Optional subheading</p>
  </div>
</section>
```

**CSS hook points:** `.slide--section` (centering), `.slide__number` (decorative oversized numeral, `opacity: 0.08`), `.slide__heading`, `.slide__subtitle`.

**Content fit:** 1 number + 1 heading + optional subhead. The number is decorative — `pointer-events: none`, absolutely positioned.

```css
.slide--section {
  justify-content: center;
}

.slide--section .slide__number {
  font-size: clamp(100px, 22vw, 260px);
  font-weight: 200;
  line-height: 0.85;
  opacity: 0.08;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -55%);
  pointer-events: none;
}
```

---

### content

**Purpose:** Heading + bullets or short paragraphs. Asymmetric layout with optional aside area for an illustration, icon, or accent SVG.

**HTML shape:**

```html
<section class="slide slide--content">
  <div class="slide__inner">
    <div class="slide__text">
      <p class="slide__label reveal">Context label</p>
      <h2 class="slide__heading reveal">Heading</h2>
      <ul class="slide__bullets">
        <li class="reveal">First point</li>
        <li class="reveal">Second point</li>
      </ul>
    </div>
    <div class="slide__aside reveal">
      <!-- illustration, icon, mini-diagram, accent SVG -->
    </div>
  </div>
</section>
```

**CSS hook points:** `.slide--content .slide__inner` (3fr 2fr grid), `.slide__bullets` (custom bullet via `::before`, no list-style), `.slide__aside` (hidden below 768px width).

**Content fit:** 1 heading + 5–6 bullets (max 2 lines each). If more content is needed, split to a second slide.

```css
.slide--content .slide__inner {
  display: grid;
  grid-template-columns: 3fr 2fr;
  gap: clamp(24px, 4vw, 60px);
  align-items: center;
  width: 100%;
}

.slide--content .slide__bullets {
  list-style: none;
  padding: 0;
}

.slide--content .slide__bullets li {
  padding: 8px 0 8px 20px;
  position: relative;
  font-size: clamp(16px, 2vw, 22px);
  line-height: 1.6;
  color: var(--text-muted);
}

.slide--content .slide__bullets li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 18px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent);
}
```

---

### diagram

**Purpose:** Full-viewport Mermaid diagram or fgraph. Heading at top, diagram fills remaining space. See [In-Slide Diagrams](#in-slide-diagrams) for Mermaid vs fgraph decision and init sequence.

**HTML shape (Mermaid):**

```html
<section class="slide slide--diagram">
  <h2 class="slide__heading reveal">Diagram Title</h2>
  <div class="slide__diagram-wrap reveal">
    <div class="Mermaid" data-Mermaid>
      graph TD
        A --> B
    </div>
  </div>
</section>
```

**CSS hook points:** `.slide--diagram` (reduced padding to give diagram room), `.slide__diagram-wrap` (flex, center-aligned, fills remaining height), `.slide--diagram .Mermaid svg` (force 100% width via `autoFit()`).

**Content fit:** 1 heading + 1 diagram. Max 8–10 nodes for projection readability. 18px+ node labels, 2px+ edges.

```css
.slide--diagram {
  padding: clamp(24px, 4vh, 48px) clamp(24px, 4vw, 60px);
}

.slide__diagram-wrap {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  overflow: auto;
}

.slide--diagram .Mermaid svg {
  width: 100% !important;
  height: auto !important;
  max-width: 100% !important;
}
```

---

### table

**Purpose:** Structured comparison or data table. Cell text at 18–20px for projection readability. Heading at top.

**HTML shape:**

```html
<section class="slide slide--table">
  <h2 class="slide__heading reveal">Table Title</h2>
  <div class="slide__table-wrap reveal">
    <table class="slide__table">
      <thead>
        <tr><th>Column A</th><th>Column B</th></tr>
      </thead>
      <tbody>
        <tr><td>Value</td><td>Value</td></tr>
      </tbody>
    </table>
  </div>
</section>
```

**CSS hook points:** `.slide--table` (reduced padding), `.slide__table-wrap` (flex 1, overflow-auto), `.slide__table` (larger cell text, stronger alternating rows).

**Content fit:** 1 heading + max 8 rows. If more than 8 rows, paginate to a second table slide. Column headers use `.slide__label` scale (small mono caps).

```css
.slide--table {
  padding: clamp(24px, 4vh, 48px) clamp(24px, 4vw, 60px);
}

.slide__table-wrap {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.slide__table {
  width: 100%;
  border-collapse: collapse;
  font-size: clamp(14px, 1.8vw, 20px);
}

.slide__table th {
  font-size: clamp(10px, 1.3vw, 14px);
  font-family: var(--font-mono);
  text-transform: uppercase;
  letter-spacing: 1px;
  padding: clamp(8px, 1.5vh, 14px) clamp(12px, 2vw, 20px);
  text-align: left;
  color: var(--text-dim);
  border-bottom: 2px solid var(--border-bright);
}

.slide__table td {
  padding: clamp(10px, 1.5vh, 16px) clamp(12px, 2vw, 20px);
  border-bottom: 1px solid var(--border);
}

.slide__table tbody tr:nth-child(even) {
  background: var(--surface);
}
```

---

### code

**Purpose:** Short code snippet as the focal point. Heading + recessed code block with floating filename label. Centered on the viewport.

**HTML shape:**

```html
<section class="slide slide--code">
  <h2 class="slide__heading reveal">What Changed</h2>
  <div class="slide__code-block reveal">
    <span class="slide__code-filename">worker.ts</span>
    <pre><code>function processQueue(items) {
  return items.map(process)
}</code></pre>
  </div>
</section>
```

**CSS hook points:** `.slide--code` (center-aligned), `.slide__code-block` (recessed dark surface, max-width 900px), `.slide__code-filename` (accent badge, absolutely positioned above block), `pre code` (mono, 14–18px, 1.7 line-height).

**Content fit:** 1 heading + max 10 lines of code. For more code, split to a second slide or switch to a `content` slide with code as the aside element.

```css
.slide--code {
  align-items: center;
}

.slide__code-block {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: clamp(24px, 4vh, 48px) clamp(24px, 4vw, 48px);
  max-width: 900px;
  width: 100%;
  position: relative;
}

.slide__code-filename {
  position: absolute;
  top: -12px;
  left: 24px;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 4px;
  background: var(--accent);
  color: var(--bg);
}

.slide__code-block pre {
  margin: 0;
  overflow-x: auto;
}

.slide__code-block code {
  font-family: var(--font-mono);
  font-size: clamp(14px, 1.6vw, 18px);
  line-height: 1.7;
  color: var(--text);
}
```

---

### quote

**Purpose:** Pullquote as the sole focal point. Dramatic scale with generous whitespace. Oversized opening quotation mark as decoration.

**HTML shape:**

```html
<section class="slide slide--quote">
  <div class="slide__quote-mark reveal">&ldquo;</div>
  <blockquote class="reveal">
    The best documentation is the code you don't have to explain.
  </blockquote>
  <cite class="reveal">&mdash; Attribution</cite>
</section>
```

**CSS hook points:** `.slide--quote` (centered, wide horizontal padding), `.slide__quote-mark` (large decorative serif `"`, `opacity: 0.08`), `blockquote` (24–48px italic), `cite` (mono, uppercase, dimmed).

**Content fit:** 1 quote (~25 words / ~150 chars max) + 1 attribution. Longer quotes become `content` slides. `autoFit()` scales down blockquotes over 100 chars proportionally.

```css
.slide--quote {
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: clamp(60px, 10vh, 120px) clamp(60px, 12vw, 200px);
}

.slide__quote-mark {
  font-size: clamp(80px, 14vw, 180px);
  line-height: 0.5;
  opacity: 0.08;
  font-family: Georgia, serif;
  pointer-events: none;
  margin-bottom: -20px;
}

.slide--quote blockquote {
  font-size: clamp(24px, 4vw, 48px);
  font-weight: 400;
  line-height: 1.35;
  font-style: italic;
  margin: 0;
}

.slide--quote cite {
  font-family: var(--font-mono);
  font-size: clamp(11px, 1.4vw, 14px);
  font-style: normal;
  margin-top: clamp(16px, 3vh, 32px);
  display: block;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--text-dim);
}
```

---

### image

**Purpose:** Full-bleed background image (base64 data URI or CSS gradient) with minimal text overlay. Gradient scrim ensures contrast. Zero slide padding.

**HTML shape:**

```html
<section class="slide slide--image">
  <div class="slide__bg" style="background-image:url('data:image/png;base64,...')"></div>
  <div class="slide__scrim"></div>
  <div class="slide__content">
    <h2 class="slide__heading reveal">Headline Over Image</h2>
    <p class="slide__subtitle reveal">Supporting text</p>
  </div>
</section>
```

**CSS hook points:** `.slide--image` (zero padding, text at bottom), `.slide__bg` (absolute inset, cover), `.slide__scrim` (gradient from bottom), `.slide__content` (z-index 2, padded).

**Content fit:** 1 heading + 1 subtitle. Background image at 16:9 for title slides, 1:1 for aside illustrations. When no generated image is available, use `.slide__bg--gradient` with a bold `linear-gradient`.

```css
.slide--image {
  padding: 0;
  justify-content: flex-end;
}

.slide__bg {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  z-index: 0;
}

.slide__scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to top,
    rgba(0,0,0,0.75) 0%,
    rgba(0,0,0,0.1) 50%,
    transparent 100%
  );
  z-index: 1;
}

.slide--image .slide__content {
  position: relative;
  z-index: 2;
  padding: clamp(40px, 6vh, 80px) clamp(40px, 8vw, 120px);
  color: #ffffff;
}

.slide__bg--gradient {
  background: linear-gradient(
    135deg,
    var(--accent) 0%,
    color-mix(in srgb, var(--accent) 60%, var(--bg) 40%) 100%
  );
}
```

---

### comparison

**Purpose:** Two-panel split for before/after, option A vs B, or text + diagram. Each panel has its own background tier. Zero padding on the slide root — panels fill edge to edge.

**HTML shape:**

```html
<section class="slide slide--comparison">
  <div class="slide__panels">
    <div class="slide__panel slide__panel--a">
      <p class="slide__label reveal">Before</p>
      <h2 class="slide__heading reveal">Option A</h2>
      <div class="slide__body reveal">Content or diagram</div>
    </div>
    <div class="slide__panel slide__panel--b">
      <p class="slide__label reveal">After</p>
      <h2 class="slide__heading reveal">Option B</h2>
      <div class="slide__body reveal">Content or diagram</div>
    </div>
  </div>
</section>
```

**CSS hook points:** `.slide--comparison` (zero padding), `.slide__panels` (grid, 3fr 2fr or 1fr 1fr), `.slide__panel--a` (surface tier), `.slide__panel--b` (surface2 tier).

**Content fit:** Each panel follows its inner type's density limits (heading + 3–4 bullets, or 1 diagram). Panels do not scroll — if either side overflows, reduce content.

```css
.slide--comparison {
  padding: 0;
}

.slide--comparison .slide__panels {
  display: grid;
  grid-template-columns: 1fr 1fr;
  height: 100%;
}

.slide__panel {
  padding: clamp(40px, 6vh, 80px) clamp(32px, 4vw, 60px);
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.slide__panel--a {
  background: var(--surface);
}

.slide__panel--b {
  background: var(--surface2);
  border-left: 1px solid var(--border);
}
```

---

### closing

**Purpose:** Final slide. Mirrors the title slide structure — centered, display type, optional CTA or next-step text. Background treatment echoes the title.

**HTML shape:**

```html
<section class="slide slide--closing">
  <div class="slide__content reveal">
    <h2 class="slide__display">Thank You</h2>
    <p class="slide__subtitle reveal">Next step or contact info</p>
  </div>
</section>
```

**CSS hook points:** `.slide--closing` (same centering as title), `.slide__display`, `.slide__subtitle`. Often shares background treatment with `slide--title` — use the same gradient or image pattern for visual bookending.

**Content fit:** 1 heading + 1 subtitle/CTA. No bullets, no body text. If a recap is needed, use a `content` slide before the closing.

```css
.slide--closing {
  justify-content: center;
  align-items: center;
  text-align: center;
}
```

---

## Runtime Init Sequence

**Order:** `initSlideMermaid()` → `autoFit()` → `new SlideEngine('.deck')`

This order is load-bearing. Each step depends on the previous completing.

```javascript
document.addEventListener('DOMContentLoaded', async function() {
  await initSlideMermaid()   // render SVGs first — intrinsic dims needed for autoFit
  autoFit()                  // then patch SVG width/height + scale KPIs/quotes
  new SlideEngine('.deck')   // finally wire keyboard + touch + IntersectionObserver
})
```

**Why `initSlideMermaid()` runs first:** Mermaid SVGs don't exist in the DOM until `Mermaid.render()` injects them. `autoFit()` queries `.slide--diagram svg` to strip `height` attributes and set `width: 100%; height: auto` — that query returns nothing if Mermaid hasn't rendered yet. Rendering first, patching second, is the working contract (same pattern VE uses).

**Why `autoFit()` runs before `SlideEngine`:** `SlideEngine` attaches an `IntersectionObserver` to every `.slide`. If a diagram slide is first on screen and its SVG still has intrinsic fixed dimensions, the slide overflows horizontally before the observer sees "visible" and swaps in layout. Patching SVG dims before the observer fires keeps the initial frame clean.

**Why `SlideEngine` runs last:** It owns chrome (progress bar, dots, counter) and keyboard/touch bindings. Until all slide content is laid out, the first `entry.isIntersecting` fire counts the wrong slide as active — the progress bar and counter start misaligned. Awaiting `initSlideMermaid()` + running `autoFit()` first keeps state consistent.

**`initSlideMermaid()` — scoped init (not `Mermaid-init.js`):** `slide-deck-base.js` ships its own Mermaid init. It does not reuse `base/Mermaid-init.js` verbatim because that file's `window.__postLoad` contract is tab-loader-specific. The slide init:

1. Imports `Mermaid` from CDN (`cdn.jsdelivr.net/npm/Mermaid@11`)
2. Calls `Mermaid.initialize({ startOnLoad: false, theme: 'base', ... })`
3. Queries only `.slide--diagram [data-Mermaid]` — not page-wide `.Mermaid` elements
4. Assigns each element a unique ID `Mermaid-slide-${i}` before calling `Mermaid.render()` — preventing duplicate-ID collisions when a deck has multiple diagram slides
5. Injects the rendered SVG into the adjacent `.slide__diagram-wrap` container
6. Returns a `Promise` that resolves when all diagram slides are rendered

---

## Typography Scale

Slide type scale is 2–3× larger than scrollable pages. Clamp ranges ensure readability from 1280px to 4K.

| CSS var | Clamp range | `vw` fluid value | Used by |
|---|---|---|---|
| `--fs-display` | 48–120px | `8vw` | title, closing (`slide__display`) |
| `--fs-heading` | 28–48px | `4vw` | all types (`slide__heading`) |
| `--fs-body` | 16–24px | `2vw` | content bullets, panel body (`slide__body`) |
| `--fs-caption` | 10–14px | `1vw` | labels, table headers, citations (`slide__label`) |

Values match `slide-deck-base.css` CSS custom properties (`--fs-display/heading/body/caption`) — authoritative source.

```css
.slide__display {
  font-size: clamp(48px, 8vw, 120px);
  font-weight: 800;
  letter-spacing: -3px;
  line-height: 0.95;
  text-wrap: balance;
}

.slide__heading {
  font-size: clamp(28px, 5vw, 48px);
  font-weight: 700;
  letter-spacing: -1px;
  line-height: 1.1;
  text-wrap: balance;
}

.slide__body {
  font-size: clamp(16px, 2.2vw, 24px);
  line-height: 1.6;
  text-wrap: pretty;
  color: var(--text-muted);
}

.slide__label {
  font-family: var(--font-mono);
  font-size: clamp(10px, 1.2vw, 14px);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: var(--text-dim);
}

.slide__subtitle {
  font-family: var(--font-mono);
  font-size: clamp(14px, 1.8vw, 20px);
  color: var(--text-dim);
  letter-spacing: 0.5px;
}
```

**Section number scale (decorative, not in the table above):** `clamp(100px, 22vw, 260px)` at `font-weight: 200`. This is purely typographic decoration — it intentionally exceeds the display scale and stays legible because it is ghosted at `opacity: 0.08`.

---

## Aesthetic Presets for Slide Mode

All 6 forge aesthetics are tuned for slide mode. Each aesthetic file (`aesthetics/*.css`) includes slide-specific overrides for type scale, section-divider backgrounds, and title-slide treatment. Read the aesthetic file before generating — do not guess token values.

| Aesthetic | Display font weight | Section-divider bg | Title-slide treatment | Known strength |
|---|---|---|---|---|
| `editorial` | 800 (Outfit, bold display) | Radial amber glow at top center | Centered heading at full scale, corner marks in gold | Rich roadmaps, design reviews, project walkthroughs |
| `roxabi` | 800 (Outfit, same as editorial) | Gold radial glow, surface2 bg | Gold accent border on content area | Roxabi-branded decks, product pitches |
| `lyra` | 800 (Outfit) | Orange-red radial at top | Orange accent corner SVG, surface bg | Lyra project decks, voiceCLI demos |
| `terminal` | 400 mono weight (Geist Mono, not bold) | Faint dot grid, dark surface2 | Large weight-400 mono instead of bold display | Code-heavy decks, CLI walkthroughs, developer talks |
| `caveman` | 800 (system-ui) | Pure black, grid background | Full-bleed gradient with cursor-spotlight fallback | High-contrast product showcases, stark minimal style |
| `blueprint` | 700 (IBM Plex Sans) | Blueprint grid lines, muted blue surface | Grid-pattern bg, mono label above heading | Architecture diagrams, technical spec walkthroughs |

**Aesthetic detection:** same as `forge-guide` and `forge-epic` — brand book override (`brand/forge.yml`) → project-level mapping (`tokens.md § Which Theme to Use`) → fallback to `editorial`.

### V2 slide-type coverage policy

Base CSS (`slide-deck-base.css`) styles every slide type by default, so any aesthetic renders all 10 types without aesthetic-specific overrides. Aesthetics *opt in* to richer per-type treatments — they don't carry the full matrix.

| Aesthetic | V1 (`title`, `content`, `closing`) | +`section` | +`quote` | +`comparison` | +`table` | +`code` | +`diagram` |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| `editorial` | ✓ | ✓ | — | — | — | — | — |
| `roxabi` | ✓ | ✓ | — | — | — | — | — |
| `blueprint` | ✓ | ✓ | ✓ | — | — | — | — |
| `caveman` | ✓ | ✓ | ✓ | ✓ | — | — | — |
| `lyra` | ✓ | ✓ | ✓ | ✓ | — | — | — |
| `terminal` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

**Reference aesthetic for V2 types:** `terminal` is the complete reference — when authoring a new V2 slide treatment for any aesthetic, read `terminal.css` first for structural cues, then adapt tokens. The partial coverage of the other aesthetics is intentional: each picked up V2 overrides as decks actually exercised the types (lyra/caveman leaned into `comparison`, blueprint into `quote`). Backfill lazily — when a deck's V2 slide renders acceptably on base CSS, leave it; when it needs aesthetic-specific polish, add the rule.

---

## In-Slide Diagrams

### Mermaid

Use Mermaid for complex graphs: 8+ nodes, branching paths, cycles, multiple edge crossings. If the diagram has fewer than ~7 nodes with no branching, prefer fgraph (below) or a CSS pipeline layout — small Mermaid SVGs float in dead space at slide scale.

**HTML shape inside a `diagram` slide:**

```html
<div class="slide__diagram-wrap reveal">
  <div class="Mermaid" data-Mermaid>
    flowchart TD
      A["Input"] --> B["Process"]
      B --> C["Output"]
  </div>
</div>
```

Use `data-Mermaid` on the element — `slide-deck-base.js`'s `initSlideMermaid()` queries `.slide--diagram [data-Mermaid]` and assigns each element a unique ID `Mermaid-slide-${i}` before calling `Mermaid.render()`. This avoids duplicate-ID errors when a deck has multiple diagram slides.

**Why the skill ships its own init (not `base/Mermaid-init.js`):** `base/Mermaid-init.js` uses a `window.__postLoad` callback contract that is tab-loader-specific — it fires after a tab's content is fetched and injected into the shell. In a slide deck there are no tabs; all slides are in the DOM on load. The slide init is synchronous-then-async: it runs on `DOMContentLoaded`, iterates the diagram slides in order, renders each to a unique ID, and resolves a `Promise` that gates `SlideEngine` init. The import/config pattern (CDN ESM, `theme: 'base'`, `themeVariables` from forge CSS tokens) is the same as `Mermaid-guide.md § Single-File Mermaid`.

**Mermaid presentation overrides** (add inside the deck's `<style>` block):

```css
.slide--diagram .Mermaid .nodeLabel { font-size: 18px !important; }
.slide--diagram .Mermaid .edgeLabel { font-size: 14px !important; }
.slide--diagram .Mermaid .node rect,
.slide--diagram .Mermaid .node circle { stroke-width: 2px; }
```

### fgraph

Use fgraph when a diagram has ≤ 6 radial peers, rich node content (pills, status lines, multi-line labels), or needs pixel-perfect sizing inside a 100dvh slide.

**Why fgraph fits slides:** fgraph nodes are absolutely positioned CSS boxes in a 0–100 coordinate space. They fill the `.fgraph-wrap` container at exactly the size the slide assigns — no intrinsic-size surprise. Mermaid's SVG fixes its own dimensions; fgraph obeys the container.

**Which fgraph templates fit inside a slide:**

| Template | Fits at 100dvh? | Notes |
|---|---|---|
| `radial-hub` | Yes | Use square `.fgraph-wrap` aspect ratio (set explicit height) |
| `linear-flow` | Yes | 16:6 aspect — wide decks only; use for pipeline slides |
| `dual-cluster` | Yes | Square aspect, fits well in comparison panel |
| `radial-ring` | Yes | N peers, no center hub; fit within `slide__diagram-wrap` |
| `layered` | Tight | 4 stacked layers; reduce vertical padding or use portrait-only |
| `machine-clusters` | Wide-only | 3 side-by-side frames; awkward in portrait |
| `deployment-tiers` | Tight | Tall aspect; reduce padding aggressively or skip |

**HTML shape inside a `diagram` slide:**

```html
<div class="slide__diagram-wrap reveal">
  <div class="fgraph-wrap" style="width:100%;height:60dvh;">
    <!-- fgraph template content — inline fgraph-base.css, no separate link -->
    <svg class="fgraph-edges" viewBox="0 0 100 100" ...>...</svg>
    <div class="fgraph-node" style="--x:50;--y:50;">...</div>
  </div>
</div>
```

`fgraph-base.css` must be inlined into the deck's `<style>` block — slide decks are single-file and must work under `file://`. Do not link `_shared/fgraph-base.css`. Read `references/graph-templates/README.md` for the full node/edge class vocabulary.

---

## Cinematic Transitions

`IntersectionObserver` adds `.visible` when a slide enters the viewport. Slides animate once and stay visible when scrolling back.

```css
.slide {
  opacity: 0;
  transform: translateY(40px) scale(0.98);
  transition:
    opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.slide.visible {
  opacity: 1;
  transform: none;
}

/* Staggered child reveals — add .reveal to each content element */
.slide .reveal {
  opacity: 0;
  transform: translateY(20px);
  transition:
    opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.slide.visible .reveal {
  opacity: 1;
  transform: none;
}

.slide.visible .reveal:nth-child(1) { transition-delay: 0.1s; }
.slide.visible .reveal:nth-child(2) { transition-delay: 0.2s; }
.slide.visible .reveal:nth-child(3) { transition-delay: 0.3s; }
.slide.visible .reveal:nth-child(4) { transition-delay: 0.4s; }
.slide.visible .reveal:nth-child(5) { transition-delay: 0.5s; }
.slide.visible .reveal:nth-child(6) { transition-delay: 0.6s; }
```

---

## Navigation Chrome

All chrome elements are `position: fixed` with `z-index: 100`, rendered above slides on any background.

```css
/* Progress bar */
.deck-progress {
  position: fixed;
  top: 0; left: 0;
  height: 3px;
  background: var(--accent);
  z-index: 100;
  transition: width 0.3s ease;
  pointer-events: none;
}

/* Nav dots */
.deck-dots {
  position: fixed;
  right: clamp(12px, 2vw, 24px);
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 100;
}

.deck-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: var(--text-dim);
  opacity: 0.3;
  border: none; padding: 0; cursor: pointer;
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.deck-dot.active {
  opacity: 1;
  transform: scale(1.5);
  background: var(--accent);
}

/* Slide counter */
.deck-counter {
  position: fixed;
  bottom: clamp(12px, 2vh, 24px);
  right: clamp(12px, 2vw, 24px);
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-dim);
  z-index: 100;
  font-variant-numeric: tabular-nums;
}
```

**Chrome visibility on mixed backgrounds:** When some slides are light and others dark (image slides, comparison panels), wrap chrome in a subtle backdrop:

```css
.deck-dots,
.deck-counter {
  background: color-mix(in srgb, var(--bg) 70%, transparent 30%);
  padding: 6px;
  border-radius: 20px;
  backdrop-filter: blur(4px);
}
```

---

## `autoFit()` — Required Safety Net

Agents cannot perfectly predict how text reflows at every viewport size. `autoFit()` handles the three known content overflow cases after DOMContentLoaded and before `SlideEngine` init.

```javascript
function autoFit() {
  // Mermaid SVGs: force fill container instead of intrinsic size
  document.querySelectorAll('.Mermaid svg').forEach(function(svg) {
    svg.removeAttribute('height')
    svg.style.width = '100%'
    svg.style.maxWidth = '100%'
    svg.style.height = 'auto'
    svg.parentElement.style.width = '100%'
  })

  // Blockquotes: reduce font proportionally for long text
  document.querySelectorAll('.slide--quote blockquote').forEach(function(el) {
    var len = el.textContent.trim().length
    if (len > 100) {
      var scale = Math.max(0.5, 100 / len)
      var fs = parseFloat(getComputedStyle(el).fontSize)
      el.style.fontSize = Math.max(16, Math.round(fs * scale)) + 'px'
    }
  })
}
```

Three cases:
- **Mermaid** — SVGs render with fixed `height` attribute that causes overflow inside flex containers. Force `width: 100%; height: auto`.
- **Blockquotes** — Quotes over ~100 chars overflow at `clamp(24px, 4vw, 48px)` on narrow viewports. Scale proportionally with a 50% floor; if even 50% isn't enough, the content belongs in a `content` slide not a `quote` slide.

---

## Resize Handler Note

Mermaid SVGs rendered on `DOMContentLoaded` are fixed-size snapshots of the viewport at load time. On landscape ↔ portrait rotation (phone or tablet), the SVG does not re-render — it may overflow or leave dead space.

**Known limitation for v0.1 — desktop primary.** The recommended workaround is a manual page refresh (`F5` / `Cmd+R`). No auto-resize handler is shipped in v0.1.

`autoFit()` sets `width: 100%` on Mermaid SVGs, which helps on rotation, but the `viewBox` and internal layout are still calculated from the original render dimensions. fgraph diagrams are immune — they are CSS boxes that reflow naturally on resize.

---

## Out of Scope for v0.1

| Feature | Why deferred |
|---|---|
| Mermaid pan/zoom (`svg-pan-zoom`) | Adds ~30 KB runtime dependency; presentation use case rarely needs pan/zoom (8-node max); deferred to v0.2 |
| Presenter mode (speaker notes + second screen) | Requires `BroadcastChannel` or `window.open` + postMessage; out-of-scope complexity for v0.1 |
| Remote-controlled decks | Requires WebSocket or Broadcast API with a server component; contradicts offline-first design |
| PDF export | Print-media CSS is a separate project; `@page` rules and forced page breaks interact poorly with scroll-snap layout |
| WYSIWYG editor | Not a forge output type — forge generates, not edits |

---

## Accessibility and Motion

**`prefers-reduced-motion`:** All transforms and transitions on `.slide` and `.slide .reveal` must be disabled when this media feature is `reduce`. No exceptions — this is a hard requirement, not a nicety.

```css
@media (prefers-reduced-motion: reduce) {
  .slide,
  .slide .reveal {
    opacity: 1 !important;
    transform: none !important;
    transition: none !important;
  }
}
```

**Keyboard navigation is primary.** Touch swipe is parity for mobile handoff (Telegram/Discord). All interactive chrome (dots, progress bar) must be keyboard-accessible. `SlideEngine` keyboard bindings: `ArrowDown` / `ArrowRight` / `Space` / `PageDown` → next; `ArrowUp` / `ArrowLeft` / `PageUp` → prev; `Home` → first; `End` → last.

**Contrast rules:** Inherit from the aesthetic's token system. `--text-muted` at `~8:1` is the minimum for body-level text. `--text-dim` at `~4.3:1` is acceptable only for labels, captions, and metadata (never for sentences). The `three-tier hierarchy` from `tokens.md` applies in slide context — do not use `--text-dim` for bullet text or body paragraphs.

**Focus management:** `SlideEngine` does not move keyboard focus between slides. Navigation is scroll-based, not focus-trap-based. This keeps Tab behavior predictable for assistive technology traversing slide content.
