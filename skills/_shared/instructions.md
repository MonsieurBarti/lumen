---
description: Universal conventions shared across all lumen skills — aesthetics, file handling, browser launch, validation-first workflow, and evidence/citation rules.
---

# Lumen Shared Base Instructions

Apply these conventions to every lumen skill invocation unless the skill's own SKILL.md or recipe explicitly overrides a specific rule.

## 1. Universal aesthetics rules

- **Default aesthetic by output type:**
  - Guides, recaps, postmortems → `editorial` (warm, paper/ink, muted blues + greens).
  - Technical / infrastructure / sev-1 documents → `dark-professional` (signals seriousness).
  - Mermaid diagrams → `blueprint` (default); allow `editorial`, `paper`, `terminal`.
  - Charts + fgraph diagrams → `dark-professional` (default); allow `blueprint`, `editorial`, `lyra`, `terminal`.
- **Palette variation:** Vary fonts and palette from previous diagrams generated in the same session. Do not repeat the exact same aesthetic back-to-back unless the user explicitly requests it.
- **Offline-playable:** Every HTML file must open correctly from `file://` with no external asset references (no CDN CSS/JS, no remote images). Embed images as base64 data URIs.
- **Responsive foundation:** Apply `min-width: 0` on all grid/flex children. Use `overflow-wrap: break-word` on any container that holds user-generated or code content. Never use `display: flex` on `<li>` elements for marker characters — use absolute positioning instead.
- **Motion respect:** Honor `prefers-reduced-motion`. Disable scroll-snap animations and auto-playing transitions when the user has requested reduced motion.

## 2. File-handling conventions

- **Output directories:**
  - Single visualizations (diagrams, charts, galleries) → `~/.agent/diagrams/`
  - Recaps, fact-checks, guides, slides, composites → `~/.agent/lumen/`
- **Single-file mandate:** Every deliverable is one self-contained HTML file. Do not emit multi-file bundles, asset folders, or separate CSS/JS files.
- **Filename hygiene:** Use kebab-case, lowercase, no spaces. Example: `project-recap-2024-01-15.html`.
- **Overwrite safety:** When regenerating, use `getVersionedPath` logic (append `_v2`, `_v3`, ...) instead of clobbering the previous file, so comparisons are possible.
- **Post-write action:** After writing the file, open it in the browser automatically. The user should not need to hunt for the file.

## 3. Browser-launch infra guidance

- **Automatic open:** Every skill that produces HTML must call the browser-open utility after writing the file. No silent generation.
- **Base64 embedding:** Hero images, logos, or inline assets must be embedded as base64 data URIs using the `.hero-img-wrap` pattern. Do not reference external URLs that may break offline.
- **iframe embedding for diagrams:** When a composite embeds a subsystem diagram inside a guide or slide deck, use `<iframe srcdoc="...">`, not raw SVG extraction. HTML-escape the source (`&` → `&amp;`, `"` → `&quot;`) before placing into `srcdoc`. Set iframe `height` to match the diagram's intrinsic aspect (typically 360–540px). Add `loading="lazy"` for non-default tabs.

## 4. Validation-first convention

- **Pre-generation verification:** Before authoring any HTML, produce a structured verification fact sheet listing every quantitative claim, every named symbol (function/type/module), and every behavioral description you intend to present. For each item, cite the source: the git command that produced it, or the `file:line` where you read it.
- **Uncertainty flagging:** If a claim cannot be verified, mark it as uncertain rather than stating it as fact. Do not silently pass unverified claims into the output.
- **Composite pipeline discipline:** Composites orchestrate capabilities in a fixed sequence. Each step's output feeds the next. If any step fails, surface the error with the step number and the failing capability's name; do not ship a partial document.
- **Post-assembly fact-check:** After a composite assembles its final HTML, run `lumen-fact-check` on the output. Apply corrections in place. The verification summary stays as the final tab or a final section.

## 5. Evidence and citation rules

- **Source minimum:** Research-oriented outputs (recap research template, fact-check reports) must draw on at least 3–5 distinct sources per major factual claim. Do not repeat-cite the same source to inflate the count.
- **Citation format:** Inline citations must reference the exact source location:
  - Code claims → `file.ts:LN`
  - Git history claims → the exact command output (e.g., `git log --oneline --since="2 weeks ago"`)
  - External docs → URL + section anchor
- **Confidence levels (fact-check):** Classify every checked claim:
  - **High** — verified against primary source with exact match.
  - **Medium** — verified but required interpretation, inference, or partial match.
  - **Low** — source is secondary, outdated, or the claim pushes beyond what the source explicitly states.
  - **Unverifiable** — cannot be checked with available tools (missing file, runtime-only behavior, external dependency not accessible).
- **Uncertainty transparency:** Surface confidence levels prominently in the verification summary. For Low or Unverifiable claims, explain why the evidence is weak and what would be needed to upgrade the confidence.
- **Subjective exclusion:** Do not fact-check opinions, design judgments, readability assessments, or aesthetic choices. These are not verifiable facts and must be left untouched.
