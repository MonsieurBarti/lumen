---
name: lumen-diagram
description: Generate a single-file SVG technical diagram (architecture, flow, sequence, ER, state, mind map, network topology). Use when the user asks to "draw", "diagram", "visualize", "sketch the architecture", "show the flow", or describes a system, pipeline, or topology they want illustrated.
version: 0.1.0
---

# lumen-diagram

> Status: scaffold. Implementation lands in v0.2.

## Sources to copy from (do not re-create)

- `architecture-diagram-generator` — color semantics (frontend/backend/database/cloud/security), z-order arrow masking, 40px spacing rule, single-file HTML/SVG template
- `fireworks-tech-graph` — 14 diagram types, AI-domain templates (RAG, Mem0, Multi-Agent), arrow flow semantics (read/write/control/async/feedback), shape vocabulary (cylinder=DB, hexagon=agent, diamond=decision)
- `roxabi-forge` — 14 fgraph topologies (radial-hub, linear-flow, swimlane, layered, machine-clusters, sequence, state, gantt, pie, ER, dep-graph, system-architecture), layout rules (even-stride, straight-arrow invariant), brand-aware aesthetics
- `gmdiagram` — JSON schema → SVG render pipeline, foreignObject + CSS flexbox to avoid LLM coordinate math
