# Aesthetics provenance

Cross-cutting visual aesthetic palettes consumed by every lumen renderer that produces fgraph / chart / guide / slide / gallery output. Lifted from upstream MIT-licensed projects; lumen redistributes them under MIT (see repo LICENSE) with attribution.

Promoted from `skills/lumen-diagram/templates/aesthetics/` in v0.2 once a second skill (chart) needed them — the path move makes it explicit that these files are not lumen-diagram-specific.

## Files

Four lifted verbatim from [Roxabi/roxabi-forge](https://github.com/Roxabi/roxabi-forge) — `plugins/forge/references/aesthetics/`:

- `editorial.css` — warm technical document
- `blueprint.css` — clean technical, monospace
- `terminal.css` — retro CLI, high contrast
- `lyra.css` — warm amber, narrative tone

`dark-professional.css` is authored fresh by lumen, but its semantic palette (cyan-frontend / emerald-backend / violet-database / amber-cloud / rose-security / orange-bus / slate-external) is derived from [Cocoon-AI/architecture-diagram-generator](https://github.com/Cocoon-AI/architecture-diagram-generator) (MIT). Token names follow the roxabi-forge fgraph-base.css convention so it's interchangeable with the other aesthetics.

When upstream updates, refresh from the source repo and bump lumen's minor version.
