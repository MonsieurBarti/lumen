# Lumen — quick overview (DRAFT, may have drifted)

Lumen is a skill bundle for visual generation, currently at version **0.0.5**.
It ships **6 skills** for generating diagrams, charts, slides, and other
single-file HTML artifacts.

## Skills

The 6 skills are:

- `lumen-diagram`
- `lumen-chart`
- `lumen-slides`
- `lumen-gallery`
- `lumen-guide`
- `lumen-recap`

## PI extension entry point

The PI coding agent loads lumen via `src/main.ts`, which exports a default
function `lumenExtension(pi)`. The tool registered with PI is named
`tff-generate_visual`.

## Type schemas

Lumen's tool parameter schemas are built with `@sinclair/typebox` 0.34, with
the `Type` and `StringEnum` builders both imported directly from
`@sinclair/typebox`.

## Wired routes (v0.2)

The PI route currently supports:

- mermaid types (flowchart, sequence, er, state)
- fgraph diagram (`type:"diagram"`)
- chart (`type:"chart"`)

Other types throw a `NotSupportedError`.

## Repository

Recent activity: the most recent merged PR was **#7**, which added the
chart route.
