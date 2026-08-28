---
name: lumen-gallery
description: Gallery: filterable comparison HTML (image or audio). User asks to showcase, compare side by side, or browse iterations.
license: MIT
compatibility: Claude Code · Pi · OMP
version: 0.1.10 # x-release-please-version
---

**Tier:** capability (atomic) — does not invoke other lumen skills.

## Steps

1. **Shape** — item list as `{src, dims, score?, label?}[]` (preferred) or filename strings with `inferMeta`. Done when every item has `data-*` dims for filtering.
2. **Template** — copy closest `templates/*.html` (pivot, simple, comparison, audio, multi-mode). Walkthrough: `templates/README.md`. Done when template matches data shape.
3. **Build** — wire `DIMS`, replace placeholders, link or inline `gallery-base.css` + `gallery-base.js`. Done when filters, lightbox, and search work.
4. **Deliver** — write `~/.agent/diagrams/<slug>.html` (+ assets if split mode), open in browser. Done when path is returned.

Example: `docs/examples/gallery.html`.
