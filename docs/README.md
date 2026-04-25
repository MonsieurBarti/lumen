# Research

Deep-dive analysis of the five upstream projects whose capabilities `lumen` consolidates. Each report follows the same structure: what the project does, how a user invokes it, capabilities to extract, key techniques, runtime stack, reusable artifacts (prompts/templates/skills), Claude Code nativeness, and a recommendation for re-exposing it as a `lumen` skill.

| Report | Source repo | Primary contribution to lumen |
| --- | --- | --- |
| [architecture-diagram-generator](./architecture-diagram-generator.md) | [Cocoon-AI/architecture-diagram-generator](https://github.com/Cocoon-AI/architecture-diagram-generator) | Color semantics, z-order arrow masking, single-file SVG template |
| [fireworks-tech-graph](./fireworks-tech-graph.md) | [yizhiyanhua-ai/fireworks-tech-graph](https://github.com/yizhiyanhua-ai/fireworks-tech-graph) | 14 diagram types, AI-domain templates (RAG, Mem0, Multi-Agent), arrow flow semantics |
| [visual-explainer](./visual-explainer.md) | [nicobailon/visual-explainer](https://github.com/nicobailon/visual-explainer) | Mermaid-with-zoom-pan, project recap, fact-check, browser launch + recent files |
| [gmdiagram](./gmdiagram.md) | [ZeroZ-lab/gmdiagram](https://github.com/ZeroZ-lab/gmdiagram) | Two-pillar diagram + chart split, JSON → SVG render pipeline, Nice Numbers algorithm |
| [roxabi-forge](./roxabi-forge.md) | [Roxabi/roxabi-forge](https://github.com/Roxabi/roxabi-forge) | 14 fgraph topologies, 10 slide patterns, gallery templates, Frame → Structure → Style → Deliver methodology |

Each `lumen` skill names the upstream report it copies from in its `SKILL.md`. These docs are the canonical reference when implementing.
