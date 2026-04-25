# @the-forge-flow/lumen

Illuminate code: skills for diagrams, charts, mermaid, slides, galleries, guides, project recaps, and fact-checks. Single-file HTML/SVG outputs that work offline.

Bundles and unifies capabilities from:

- [architecture-diagram-generator](https://github.com/Cocoon-AI/architecture-diagram-generator)
- [fireworks-tech-graph](https://github.com/yizhiyanhua-ai/fireworks-tech-graph)
- [visual-explainer](https://github.com/nicobailon/visual-explainer)
- [gmdiagram](https://github.com/ZeroZ-lab/gmdiagram)
- [roxabi-forge](https://github.com/Roxabi/roxabi-forge)

## Status

`v0.1.0` — scaffolding. Skills are placeholders; implementations land next.

## Skills

| Skill | What it does |
| --- | --- |
| `lumen-diagram` | Architecture / flow / sequence / ER / state diagrams as single-file SVG |
| `lumen-chart` | Data charts: bar, pie, line, area, scatter, radar |
| `lumen-mermaid` | Mermaid diagrams with zoom, pan, and new-tab export |
| `lumen-slides` | Magazine-quality scroll-snap presentation deck |
| `lumen-gallery` | Image and audio comparison gallery with dynamic filters |
| `lumen-guide` | Multi-tab HTML doc for guides, recaps, architecture overviews |
| `lumen-recap` | Project state recap diagram from current codebase |
| `lumen-fact-check` | Verify a doc against the codebase, correct inaccuracies in place |

## Install

### Claude Code (plugin)

```
/plugin marketplace add MonsieurBarti/lumen
/plugin install lumen
```

### PI coding agent (extension)

```
pi extension add @the-forge-flow/lumen
```

## Develop

```
bun install
bun run build
bun run test
```

## License

MIT
