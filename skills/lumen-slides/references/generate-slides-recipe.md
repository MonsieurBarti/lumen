---
description: Generate a stunning magazine-quality slide deck as a self-contained HTML page
---
Load the visual-explainer skill, then generate a slide deck for: $@

Follow the visual-explainer skill workflow. Read the reference template at `./templates/slide-deck.html` and slide patterns at `./references/slide-patterns.md` before generating. Also read `./references/css-patterns.md` for shared patterns (Mermaid zoom controls, depth tiers, overflow protection) and `./references/libraries.md` for Mermaid theming, Chart.js, and font pairings.

**Slide output is always opt-in.** Only generate slides when this command is invoked or the user explicitly asks for a slide deck.

**Aesthetic:** Pick a distinctive direction from the 4 slide presets in slide-patterns.md (Midnight Editorial, Warm Signal, Terminal Mono, Swiss Clean) or riff on the existing 8 aesthetic directions adapted for slides. Vary from previous decks. Commit to one direction and carry it through every slide.

**Narrative structure:** Slides have a temporal dimension — compose a story arc, not a list of sections. Start with impact (title), build context (overview), deep dive (content, diagrams, data), resolve (summary/next steps). Plan the slide sequence and assign a composition (centered, left-heavy, split, full-bleed) to each slide before writing HTML.

**Visual richness:** Proactively reach for visuals. If `surf` CLI is available (`which surf`), generate images for title slide backgrounds and full-bleed slides via `surf gemini --generate-image`. Add SVG decorative accents, inline sparklines, mini-charts, and small Mermaid diagrams where they make the story more compelling. Visual-first, text-second.

**Compositional variety:** Consecutive slides must vary their spatial approach. Alternate between centered, left-heavy, right-heavy, split, edge-aligned, and full-bleed. Three centered slides in a row means push one off-axis.

**Template keys:** Every slide gets a `pattern_key` from the registry in `skills/lumen-slides/_templates/index.json`. Choose based on content type, not aesthetic preference:

| Content need | Pattern key |
|---|---|
| Title / hero | `title` |
| Section divider | `section` |
| Bullets or paragraphs | `content` |
| Pullquote | `quote` |
| Full-bleed image | `image` |
| Code snippet | `code` |
| Two-panel comparison | `comparison` |
| Data table | `table` |
| Mermaid / fgraph diagram | `diagram` |
| Closing / CTA | `closing` |

Each pattern declares `composition_variants` (e.g. `centered`, `split`, `full-bleed`) and `required_slots`. Use `getPatternByKey()` from `src/utils/template-registry.ts` to look up a pattern programmatically.

**Theme resolution:** Themes are discovered in this order (highest priority wins):

1. `<cwd>/_theme.css` — project-level override
2. `~/.agent/lumen/_theme.css` — user-global override
3. `skills/_shared/aesthetics/{preset}.css` — built-in fallback

Use `resolveTheme({ cwd, preset })` from `src/utils/theme-resolver.ts` to load the resolved CSS at build time.

**Example:**
```typescript
import { getPatternByKey } from "./src/utils/template-registry.ts";
import { resolveTheme } from "./src/utils/theme-resolver.ts";

const titlePattern = getPatternByKey("title");      // { pattern_key: "title", composition_variants: ["centered", "full-bleed"], ... }
const theme = await resolveTheme({ preset: "swiss-clean" }); // { css: "...", source: "preset", path: "..." }
```

Write to `~/.agent/diagrams/` and open the result in the browser.
