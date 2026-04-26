# Exporting lumen output to PNG / PDF

Lumen skills emit single-file HTML. Lumen does **not** ship a built-in
PNG/PDF exporter — your browser already does this well, and bundling a
renderer (Chromium for full HTML, or `@resvg/resvg-js` for SVG-only) would
add a heavy native dependency for a problem the OS already solves.

This doc lists the per-skill recipes that work today, with no extra
install required.

## TL;DR

| Skill | Best route |
|---|---|
| `lumen-slides`  | `Cmd/Ctrl-P` → **Save as PDF** (one slide per page, thanks to the deck's print stylesheet) |
| `lumen-guide`   | `Cmd/Ctrl-P` → **Save as PDF** (currently active tab) |
| `lumen-recap`   | `Cmd/Ctrl-P` → **Save as PDF** |
| `lumen-gallery` | OS screenshot of viewport, *or* lightbox an item then right-click → **Save image as** |
| `lumen-mermaid` | Use the deck's built-in **expand-to-tab** button, then `Cmd/Ctrl-P` or right-click → **Save image as** on the rendered SVG |
| `lumen-diagram` | Right-click on the inline SVG → **Save image as** (SVG), or `Cmd/Ctrl-P` for the whole page |
| `lumen-chart`   | Right-click on the inline SVG → **Save image as** (SVG), or `Cmd/Ctrl-P` for the whole page |

## PDF (recommended for slides / guide / recap)

Modern browsers print to PDF natively, with selectable text and full font
fidelity:

- **Chrome/Edge/Brave**: `Cmd/Ctrl-P` → Destination: **Save as PDF** →
  *More settings* → uncheck *Headers and footers*, set *Margins* to **None**
  if you want edge-to-edge.
- **Safari**: `Cmd-P` → bottom-left **PDF** dropdown → **Save as PDF**.
- **Firefox**: `Cmd/Ctrl-P` → Destination: **Save to PDF**.

Lumen decks ship with a `@media print` stylesheet that sets one slide per
page, hides nav chrome, and disables scroll-snap — what you see in the
print preview is what you get.

## PNG of a single SVG (diagrams, charts)

`lumen-diagram` and `lumen-chart` emit pure inline SVG inside an HTML
shell. To export *just* the SVG:

1. Right-click the diagram → **Inspect Element** (or hit the inline SVG
   directly).
2. In DevTools, right-click the `<svg>` node → **Copy outerHTML**, paste
   into a `.svg` file.
3. Or: right-click the SVG element in the page → **Save image as** (most
   browsers offer SVG and PNG variants).

For a clean PNG at a specific resolution, drop the saved `.svg` into any
SVG-to-PNG converter — e.g.:

```bash
# rsvg-convert (one-shot, available via brew)
brew install librsvg
rsvg-convert -w 1600 my-diagram.svg -o my-diagram.png

# or Chromium headless (if installed)
chromium --headless --screenshot=out.png --window-size=1600,900 file://$PWD/my-diagram.svg
```

## PNG of a full HTML page (slides, gallery, guide, recap)

The OS does this best:

- **macOS**: `Cmd-Shift-4` for region, `Cmd-Shift-3` for full screen.
- **Windows**: `Win-Shift-S` (Snipping Tool).
- **Linux**: `gnome-screenshot -a`, or KDE's *Spectacle*.

For a programmatic full-page screenshot (e.g., CI):

```bash
# Chromium / Chrome headless
chromium --headless --screenshot=out.png --window-size=1440,2400 \
  --hide-scrollbars file:///path/to/skill-output.html
```

This bypasses the bundle-weight tradeoff: you only pay for Chromium when
you actually need it, on the machine that actually needs it.

## Why no built-in exporter?

Two routes were considered and rejected:

- **`@resvg/resvg-js`** — small Rust/napi binary, but renders SVG only
  (no CSS layout, no JS execution). Would only cover `lumen-diagram` and
  `lumen-chart` (2 of 8 skills); the rest emit full HTML pages. Shipping
  a feature that quietly skips most of the surface area is worse than
  shipping no feature at all.
- **Puppeteer / Playwright** — covers everything, but pulls in a
  ~150 MB Chromium download as a peer/install dep. Disproportionate for
  a visualization plugin where the OS already provides the same capability
  with one keystroke.

If lumen's skills ever grow a route where in-process export *is* the
right answer (e.g., a server-side rendering pipeline that needs PNG
without a display), the discussion can re-open. Until then: use your
browser's print-to-PDF and the OS screenshot tools. They're better than
anything we'd ship in-band.
