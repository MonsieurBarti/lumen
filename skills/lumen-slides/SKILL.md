---
name: lumen-slides
description: Deck: single-file scroll-snap HTML presentation. User asks for slides, deck, pitch, or keynote.
license: MIT
compatibility: Claude Code · Pi · OMP
version: 0.1.10 # x-release-please-version
---

**Tier:** capability (atomic) — does not invoke other lumen skills.

## Steps

1. **Frame** — infer takeaway, audience, tone. Done when you can state the deck's one-sentence promise.
2. **Plan** — story arc (impact → context → depth → resolve); assign a `pattern_key` per slide from `_templates/index.json`. Done when every planned slide has a pattern and composition variant.
3. **Style** — pick **one** preset; default `aurora` for external decks. Presets: `references/slide-modern-presets.md`, typographic/illustrated families in `references/slide-patterns.md`. Done when preset name is chosen and will be inlined from `_shared/aesthetics/{preset}.css`.
4. **Build** — start from `templates/slide-deck.html`; inline CSS/JS; wrap text in semantic elements (`<p>`, `<span>`, `<h*>`). Done when HTML is single-file and `file://`-safe.
5. **Budget** — run `validateContentBudgets` (`src/utils/content-budget.ts`); fix every `error`. Done when `contentBudgetHasErrors(report) === false`.
6. **Deliver** — write `~/.agent/lumen/<slug>.html`, open in browser. Done when user has the path.

Full recipe, patterns, runtime (presenter mode, nav): `references/generate-slides-recipe.md`.

Example: `docs/examples/slides.html`.
