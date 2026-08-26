# Export pipeline (lumen-slides-export)

Read when converting a deck to PPTX.

## Pre-export validation (stderr warnings, export continues)

- **Overflow** — element exceeds 1280×720 slide bounds.
- **Descender clipping** — text bottom past slide edge with line-height variance.
- **Unwrapped text** — bare text not in `<p>`, `<span>`, `<h*>`, `<li>`, `<blockquote>`.
- **Emoji** — unicode emoji in slide text (PPTX risk).

Structural failures abort without retry. Transient render failures retry 3× (2s delay).

## CSS → PPTX bridging

- Scope rules per slide: `[data-slide-index="N"]` prefix.
- Materialize `::before` / `::after` with non-empty `content` into DOM nodes.
- Normalize canvas to 1280×720; disable scroll-snap and animations.

## Known limits

- No Google Fonts base64 embedding (system fallbacks).
- No CSS `filter` / `opacity` bake.
- No auto-regeneration on validation failure.

Output: `<deck>.pptx` beside HTML, or `--output` path. Versioning: `deck_v2.pptx`, etc.
