# Templates provenance

These files are lifted from upstream MIT-licensed projects. Lumen redistributes them under MIT (see repo LICENSE) with attribution.

## fgraph topologies + `fgraph-base.css`

Source: [Roxabi/roxabi-forge](https://github.com/Roxabi/roxabi-forge) — `plugins/forge/references/graph-templates/`. Copyright the roxabi-forge contributors. MIT-licensed.

Files copied verbatim:

- `radial-hub.html`, `radial-ring.html`
- `linear-flow.html`, `lane-swim.html`
- `layered.html`, `deployment-tiers.html`, `machine-clusters.html`
- `sequence.html`, `state.html`, `gantt.html`, `pie.html`, `er.html`
- `dep-graph.html`, `dual-cluster.html`, `system-architecture.html`
- `fgraph-base.css`

## Aesthetics

In `aesthetics/`. Four files lifted verbatim from [Roxabi/roxabi-forge](https://github.com/Roxabi/roxabi-forge) — `plugins/forge/references/aesthetics/`:

- `editorial.css` — warm technical document
- `blueprint.css` — clean technical, monospace
- `terminal.css` — retro CLI, high contrast
- `lyra.css` — warm amber, narrative tone

`dark-professional.css` is authored fresh by lumen, but its semantic palette (cyan-frontend / emerald-backend / violet-database / amber-cloud / rose-security / orange-bus / slate-external) is derived from [Cocoon-AI/architecture-diagram-generator](https://github.com/Cocoon-AI/architecture-diagram-generator) (MIT). Token names follow the roxabi-forge fgraph-base.css convention so it's interchangeable with the other aesthetics.

## AI pattern recipes (`ai-patterns.md`)

Recipes restated from [yizhiyanhua-ai/fireworks-tech-graph](https://github.com/yizhiyanhua-ai/fireworks-tech-graph) (MIT) "Built-in domain patterns" section. Content is paraphrased / re-expressed against fgraph topology vocabulary; not a verbatim copy.

When upstream updates, refresh from the source repo and bump lumen's minor version.
