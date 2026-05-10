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

## Output

Single `.pptx` file written alongside the HTML (or to `--output` if specified). Automatic versioning: if `deck.pptx` exists, creates `deck_v2.pptx`, etc.

## Notes

- CSS-to-PPTX bridging fidelity is best-effort in this slice; complex gradients and transforms may not map perfectly. Enhanced fidelity lands in M02-S03.
- Playwright Chromium browser is downloaded on first run (~3 MB). If browser is missing, the CLI emits: `run "npx playwright install chromium"`.
