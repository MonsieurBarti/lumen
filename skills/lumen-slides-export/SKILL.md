---
name: lumen-slides-export
description: Export a generated lumen slide deck HTML to editable PowerPoint (.pptx). Invoked after lumen-slides produces a deck, or standalone via lumen-export-slides CLI. Preserves vector SVGs and native text boxes.
version: 0.1.7 # x-release-please-version
---

# lumen-slides-export

Export a lumen slide deck HTML to a fully editable `.pptx` file using Playwright + dom-to-pptx.

**Tier:** capability (atomic) — does not invoke other lumen skills. Composites and playbooks may invoke it.

## When to invoke

Trigger phrases: `export slides`, `slides to pptx`, `pptx export`, `powerpoint export`, `deck to pptx`.

## Pipeline

1. **Verify HTML exists** — confirm the slide deck HTML file path is valid.
2. **Run CLI** — invoke `lumen-export-slides <html-path>` (or `npx lumen-export-slides <html-path>` if local bin is not on PATH).
3. **Report path** — return the generated `.pptx` file path to the user.

## Quality checks

- PPTX file is non-empty and readable by PowerPoint / Keynote / LibreOffice
- SVG diagrams (Mermaid, fgraph) are preserved as vectors when possible
- All slides from the HTML are represented in the PPTX

## Validation (M02-S03)

The export pipeline now runs automatic validation in headless Chromium before conversion. Validation detects:

- **Overflow** — any element's bounding rect exceeds the 1280×720 slide bounds.
- **Descender clipping** — text nodes where bottom edge exceeds slide bottom with non-zero line-height variance.
- **Unwrapped text nodes** — bare text nodes directly inside `.slide` (not inside `<p>`, `<span>`, `<h*>`, `<li>`).
- **Emoji usage** — unicode emoji ranges in text content (PPTX compatibility risk).

Validation warnings are logged to stderr; export proceeds regardless (best-effort fidelity). Structural issues are reported immediately without retry. Transient failures (font loading, Mermaid rendering timeouts) retry up to 3 times with a 2-second delay.

## CSS-to-PPTX bridging

- **CSS scoping per slide** — all stylesheet rules are prefixed with a slide-specific `[data-slide-index="N"]` selector before export to prevent class bleed across slides.
- **Pseudo-element materialization** — `::before` and `::after` pseudo-elements with non-empty `content` are converted into real DOM nodes with cloned computed styles before export.
- **Canvas normalization** — slides are forced to exactly 1280×720 pixels, `100vh`/`100dvh` units are overridden, and scroll-snap/animations are disabled.

## Known fidelity limits

The following features are deferred to future work:

- Google Fonts base64 embedding — current templates use system-font fallbacks.
- Baking CSS `filter` / `opacity` to canvas — niche use case, lossy, very complex.
- Auto-regeneration of slides on validation failure — validation reports issues; fixing them is the author's responsibility.

## Output

Single `.pptx` file written alongside the HTML (or to `--output` if specified). Automatic versioning: if `deck.pptx` exists, creates `deck_v2.pptx`, etc.

## Notes

- Playwright Chromium browser is downloaded on first run (~3 MB). If browser is missing, the CLI emits: `run "npx playwright install chromium"`.
