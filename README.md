<div align="center">
  <img src="https://raw.githubusercontent.com/MonsieurBarti/The-Forge-Flow-CC/refs/heads/main/assets/forge-banner.png" alt="The Forge Flow - Lumen" width="100%">

  <h1>💡 Lumen</h1>

  <p>
    <strong>Illuminate code: 8 skills for diagrams, charts, mermaid, slides, galleries, guides, project recaps, and fact-checks — for both Claude Code and PI coding agent</strong>
  </p>

  <p>
    <a href="https://github.com/MonsieurBarti/lumen/actions/workflows/ci.yml">
      <img src="https://img.shields.io/github/actions/workflow/status/MonsieurBarti/lumen/ci.yml?label=CI&style=flat-square" alt="CI Status">
    </a>
    <a href="https://www.npmjs.com/package/@the-forge-flow/lumen">
      <img src="https://img.shields.io/npm/v/@the-forge-flow/lumen?style=flat-square" alt="npm version">
    </a>
    <a href="LICENSE">
      <img src="https://img.shields.io/github/license/MonsieurBarti/lumen?style=flat-square" alt="License">
    </a>
  </p>
</div>

---

Single-file HTML/SVG outputs that work offline. Bundles and unifies capabilities from five upstream projects into one coherent skill set:

- [architecture-diagram-generator](https://github.com/Cocoon-AI/architecture-diagram-generator) — semantic colors, z-order arrow masking
- [fireworks-tech-graph](https://github.com/yizhiyanhua-ai/fireworks-tech-graph) — 14 diagram types, AI-domain templates (RAG, Mem0, Multi-Agent)
- [visual-explainer](https://github.com/nicobailon/visual-explainer) — Mermaid with zoom/pan, project recap, fact-check
- [gmdiagram](https://github.com/ZeroZ-lab/gmdiagram) — 9 diagram + 9 chart types, JSON → SVG pipeline, Nice Numbers algorithm
- [roxabi-forge](https://github.com/Roxabi/roxabi-forge) — 14 fgraph topologies, 10 slide patterns, gallery templates, Frame → Structure → Style → Deliver methodology

## ✨ Features

- **🎨 8 skills** — diagram, chart, mermaid, slides, gallery, guide, recap, fact-check
- **🖌️ 13 aesthetics** — 8 mermaid palettes (`blueprint`, `editorial`, `paper`, `terminal`, `dracula`, `nord`, `solarized`, `gruvbox`) + 5 fgraph aesthetics (`dark-professional`, `blueprint`, `editorial`, `terminal`, `lyra`); `glassmorphism` / `cyberpunk-neon` / `hand-drawn` land in v0.2
- **📄 Single-file HTML** — embedded CSS/JS/SVG, opens in any browser, works offline (`file://`)
- **🤖 Dual distribution** — Claude Code plugin AND PI extension from the same repo
- **🪜 Frame → Structure → Style → Deliver** — disciplined methodology baked into every skill
- **⚡ No Python, no librsvg** — pure HTML/CSS/SVG; LLM authors via skill, or deterministic TS renderer via PI tool

## 📦 Installation

### Claude Code (plugin)

```bash
/plugin marketplace add MonsieurBarti/lumen
/plugin install lumen
```

### PI coding agent (extension)

PI discovers the extension automatically once installed.

**From npm:**

```bash
pi install npm:@the-forge-flow/lumen
```

**From GitHub (tracks `main`):**

```bash
pi install git:github.com/MonsieurBarti/lumen
```

**Pin a version:**

```bash
pi install npm:@the-forge-flow/lumen@<version>
```

Replace `<version>` with the [latest release](https://www.npmjs.com/package/@the-forge-flow/lumen) or any tag from the [CHANGELOG](./CHANGELOG.md).

Then reload PI with `/reload`.

## 🎯 Skills

Skills are organized in three tiers (inspired by Shiv Sakhuja's [Skill Graphs 2.0](https://x.com/shivsakhuja/status/2047124337191444844)):

- **Capabilities** (atomic) — single-purpose, deterministic. Don't invoke other skills.
- **Composites** (molecular) — orchestrate 2–10 capabilities in a fixed pipeline.
- **Playbooks** (compound) — human-driven orchestrators over composites.

### Capabilities (`skills/`)

| Skill | What it does | Triggers |
|---|---|---|
| `lumen-diagram` | Architecture / flow / sequence / ER / state / mindmap / network / AI-pattern diagrams | `draw`, `diagram`, `visualize`, `sketch`, `architecture of X` |
| `lumen-chart` | Bar / pie / line / area / scatter / radar / funnel / bubble / table | `chart`, `graph`, `plot`, `trend`, `comparison` |
| `lumen-mermaid` | Mermaid with zoom / pan / fit / new-tab export | `mermaid diagram`, raw mermaid source |
| `lumen-slides` | Magazine-quality scroll-snap deck, 10 slide patterns | `create deck`, `slides`, `pitch`, `presentation` |
| `lumen-gallery` | Image / audio comparison gallery, 5 templates, dynamic filters | `gallery`, `showcase`, `compare visually`, `side by side` |
| `lumen-guide` | Multi-tab HTML doc with component library | `write a guide`, `architecture doc`, `multi-tab doc` |
| `lumen-recap` | Project state recap (state + recent + debt + next) | `recap`, `where are we`, `summarize the project` |
| `lumen-fact-check` | Verify a doc against the codebase, propose corrections | `fact-check`, `verify this doc`, `is this still accurate` |

### Composites (`composites/`)

| Skill | Chain | Triggers |
|---|---|---|
| `lumen-architecture-doc` | `lumen-diagram` → `lumen-guide` → `lumen-fact-check` | `architecture doc`, `design doc`, `document this architecture` |
| `lumen-readme-pack` | `lumen-recap` → `lumen-diagram` → `lumen-chart` → `lumen-guide` | `readme pack`, `project page`, `landing doc`, `visual readme` |
| `lumen-launch-deck` | `lumen-recap` → `lumen-chart` → `lumen-diagram` → `lumen-slides` | `launch deck`, `release deck`, `announcement deck` |
| `lumen-postmortem` | `lumen-recap` → `lumen-mermaid` → `lumen-chart` → `lumen-guide` | `postmortem`, `incident review`, `RCA document` |

### Playbooks (`playbooks/`)

_Empty in v0.1 — playbooks land in v0.2._

Each skill ships with a full `SKILL.md` describing triggers, pipeline, output spec, quality checks, and PI extension route.

📄 **See what each skill produces:** [`docs/examples/`](./docs/examples/) — rendered examples for slides, gallery, guide, recap, and fact-check.

🖨️ **Need PNG / PDF?** See [`docs/export.md`](./docs/export.md) — per-skill recipes using your browser's print-to-PDF and OS screenshot tools (no extra install required).

## 🚀 Usage

In Claude Code or PI, ask naturally:

```
> draw the architecture of a RAG pipeline
> create a deck about our auth migration
> recap the lumen project
> fact-check this README against the code
> compare these voice samples in a gallery
```

Skills are auto-routed by trigger phrases. Output is a single HTML file you can save, share, or open offline.

## 🪶 Status

<!-- x-release-please-start-version -->`v0.1.2`<!-- x-release-please-end --> — 8 skills shipped with production-ready `SKILL.md`, examples, and templates. PI tool route currently wires only mermaid types; `architecture` ships as a library export (`generateArchitectureTemplate`). Shared assets (`skills/_shared/`) and the `type:"diagram"` / `type:"chart"` deterministic PI tool routes land in `v0.2.0`.

## 🧪 Development

```bash
# Install dependencies
bun install

# Run tests
bun test

# Lint & format
bun run lint

# Type check
bun run typecheck

# Build for publish
bun run build
```

## 📁 Project structure

```
lumen/
├── .claude-plugin/
│   ├── plugin.json              # CC plugin manifest
│   └── marketplace.json         # CC marketplace listing
├── skills/                      # Capabilities (atomic) — single-purpose, no cross-skill calls
│   ├── _shared/aesthetics/      # 5 cross-cutting palettes
│   ├── lumen-diagram/SKILL.md
│   ├── lumen-chart/SKILL.md
│   ├── lumen-mermaid/SKILL.md
│   ├── lumen-slides/SKILL.md
│   ├── lumen-gallery/SKILL.md
│   ├── lumen-guide/SKILL.md
│   ├── lumen-recap/SKILL.md
│   └── lumen-fact-check/SKILL.md
├── composites/                  # Composites (molecular) — orchestrate 2–10 capabilities with explicit pipelines
├── playbooks/                   # Playbooks (compound) — human-driven orchestrators over composites
├── src/                         # PI extension TypeScript
│   ├── index.ts                 # Tool registration + lifecycle
│   ├── templates/               # Deterministic HTML renderers (mermaid, diagram, …)
│   └── utils/                   # validators, file-writer, browser-open
├── docs/                        # Research briefs from each upstream
│   ├── architecture-diagram-generator.md
│   ├── fireworks-tech-graph.md
│   ├── visual-explainer.md
│   ├── gmdiagram.md
│   └── roxabi-forge.md
└── tests/
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing`)
3. Commit with conventional commits (`git commit -m "feat: add something"`)
4. Push to the branch (`git push origin feature/amazing`)
5. Open a Pull Request

## 📜 License

MIT © [MonsieurBarti](https://github.com/MonsieurBarti)

---

<div align="center">
  <sub>Built with ⚡ by <a href="https://github.com/MonsieurBarti">MonsieurBarti</a></sub>
</div>
