---
name: lumen-gallery
description: Generate image or audio comparison gallery as HTML with pivot grouping, dynamic filters, search, lightbox, starring. 5 templates (pivot matrix, simple batches, comparison cards, audio players, multi-mode). Invoke when user asks to compare visually, showcase, gallery, side by side, show iterations, multi-mode gallery, audio comparison.
version: 0.1.2 # x-release-please-version
---

# lumen-gallery

Multi-mode gallery. Auto-discovered filters. Lightbox + starring + lazy load + search.

## When to invoke

Triggers: `gallery`, `showcase`, `compare visually`, `sprite gallery`, `side by side`, `create a gallery`, `show iterations`, `multi-mode gallery`, `audio comparison`, `voice cloning A/B`.

## 5 templates (`templates/`)

| Template | Best for |
|---|---|
| `pivot-gallery.html` | Matrix view (col × row grouping, dynamic pivot segs, score filter) |
| `simple-gallery.html` | Batch tabs + starring + lightbox + lazy load |
| `comparison-gallery.html` | Cards with spec tables + verdict badges |
| `audio-gallery.html` | Audio players + engine grouping (TTS A/B, voice cloning) |
| `multi-mode-gallery.html` | Mode tabs + per-mode DIMS + downloads dropdown |

Copy the closest template, replace `{{PLACEHOLDERS}}`, customize the `DIMS` object. Full template-by-template walkthrough in `templates/README.md`.

## DIMS pattern (auto-discovered filters)

Each gallery item exposes `data-*` attributes (e.g., `data-engine="elevenlabs"`, `data-voice="alice"`, `data-score="0.92"`). The `DIMS` JS object declares which dims are filterable; the runtime auto-discovers their unique values, builds filter buttons, and applies multi-select intersection filtering.

## Runtime API (`templates/gallery-base.js`)

- `buildDimFilters(DIMS, container)` — auto-discover unique values per dim, create filter buttons
- `applyDimFilters(items, DIMS, activeFilters)` — filter visible items (intersection across dims)
- `buildPivotSegsFromDims(DIMS, colId, rowId)` — auto-build col / row segmentation buttons
- Lightbox (click to fullscreen, Esc to close, backdrop click to dismiss)
- Lazy loading (`IntersectionObserver` + `loading="lazy"` fallback)
- Starring (localStorage-persisted)
- Search (substring across `data-*` attrs)
- Size controls (zoom in/out)
- Toast notifications

Plus `templates/gallery-base.css` for the shared layout primitives (lightbox modal, filter chips, card grid, masonry/pivot variants).

## Mode B (split files)

Galleries link `gallery-base.{css,js}` rather than inline (galleries can be many MB; split keeps the shell light). When deploying, drop the gallery HTML next to the assets folder, with `gallery-base.css` + `gallery-base.js` in a sibling location.

## Pipeline

1. Receive item list:
   - Filename strings (`["voice1.mp3", "voice2.mp3"]`) — fall back to `inferMeta(name)` from `gallery-base.js` to extract dims from filename patterns
   - **OR** item objects (`[{src, dims, score?, label?}]`) — preferred when caller has structured data
2. Pick template based on shape:
   - matrix data → `pivot-gallery`
   - iteration batches → `simple-gallery`
   - spec comparison → `comparison-gallery`
   - audio → `audio-gallery`
   - multi-dataset → `multi-mode-gallery`
3. Inject items + DIMS schema into template.
4. Pick aesthetic (reuse `lumen-diagram/templates/aesthetics/*.css`; default `editorial.css` for galleries).
5. Write file.

## Fixtures

Reference input shapes ship in `fixtures/`:

- `pivot.json` — matrix-shaped data with score
- `simple.json` — batch-grouped iteration set
- `comparison.json` — spec-comparison cards
- `audio.json` — audio engine A/B

Use them as a template for the JSON your caller passes in.

## Quality checks

- All `data-*` attrs match the keys declared in `DIMS`
- Lightbox has Esc-to-close + backdrop click
- Lazy loading fires below fold
- Starring persists across reload
- Mobile: touch swipe in lightbox, single-column fallback
- `prefers-reduced-motion` disables zoom transitions
- Files referenced in items[] exist (validate before writing HTML)

## Output

- Single-file mode (small galleries, ≤30 items): everything inlined.
- Split-file mode (default for ≥30 items): shell HTML + `gallery-base.{css,js}` next to it.

Either mode opens via `file://`.

## PI extension route (v0.1.x)

Not wired through `lumen-generate_visual` PI tool. Galleries depend on user-provided assets (images / audio files); the tool's `content` parameter shape doesn't fit. LLM-authored CC path is the right fit. Deterministic gallery renderer is not planned.

## Sources

- [`Roxabi/roxabi-forge/plugins/forge/references/gallery-templates/`](https://github.com/Roxabi/roxabi-forge) (MIT) — 5 templates + `gallery-base.css` + `gallery-base.js` + per-template walkthrough README
- [`Roxabi/roxabi-forge/plugins/forge/skills/forge-gallery/fixtures/`](https://github.com/Roxabi/roxabi-forge) (MIT) — 4 input-shape fixtures
- `lumen-diagram/templates/aesthetics/` (this package) — 5 aesthetics shared with diagrams + guides
