# lumen-chart provenance

## From [ZeroZ-lab/gmdiagram](https://github.com/ZeroZ-lab/gmdiagram) (MIT)

`gm-data-chart/skills/gm-data-chart/`:

| Local path | Upstream source | Notes |
|---|---|---|
| `schemas/schema-*.json` (10 files) | `assets/schema-*.json` | Schema descriptions and `examples` arrays were translated from Chinese to English where present. Schema structure unchanged. |
| `examples/product-comparison.{html,json}` | `assets/examples/product-comparison.{html,json}` | English-only original |
| `examples/team-performance.{html,json}` | `assets/examples/team-performance.{html,json}` | English-only original |
| `examples/team-skills.{html,json}` | `assets/examples/team-skills.{html,json}` | English-only original |

The original Chinese-language reference docs (`render-*.md`, `axis-and-grid.md`, `color-palettes.md`) are NOT shipped. Their algorithms and guidance are restated in English in `references/chart-recipes.md` (lumen-authored).

The 6 Chinese-locale example pairs from upstream (`browser-market-share`, `monthly-active-users`, `quarterly-revenue`, `sales-pipeline`, `study-hours-scores`, `website-traffic`) are NOT shipped. Equivalent English examples may be authored later.

When upstream updates, refresh from the source repo and bump lumen's minor version. Re-translate any new Chinese strings introduced.
