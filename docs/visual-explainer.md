# visual-explainer

## What it does

**visual-explainer-pi** is a PI extension package (@the-forge-flow/visual-explainer-pi) that generates beautiful, self-contained, browser-viewable HTML visualizations from technical content. It transforms structured data (architecture descriptions, Mermaid syntax, data tables, implementation plans) into styled, interactive HTML pages with warm color palettes, distinctive typography, and polished interaction patterns. Every generated file is a complete, standalone document with embedded CSS/JS that opens automatically in the default browser. It's built on the design system from [nicobailon/visual-explainer](https://github.com/nicobailon/visual-explainer) and provides a PI extension layer that integrates the tool into the LLM's callable interface.

---

## Interface (how a user invokes it)

### Primary: `tff-generate_visual` Tool

The extension registers a single PI tool that the LLM calls directly with typed parameters:

```typescript
defineTool({
  name: "tff-generate_visual",
  label: "Generate Visual",
  description: "Generate beautiful, self-contained HTML pages for diagrams, architecture overviews, diff reviews, data tables, and visual explanations. Opens result in browser. Based on nicobailon/visual-explainer design principles.",
  promptSnippet: "Create a visual diagram/architecture/table",
  promptGuidelines: [
    "Use this tool when the user asks for diagrams, architecture views, or data tables",
    "Proactively use for complex tables (4+ rows, 3+ columns) instead of ASCII",
    "Choose aesthetic based on context: blueprint (technical), editorial (formal), paper (warm), terminal (retro), dracula/nord/solarized/gruvbox (IDE themes)",
    "Content can be structured data (for tables) or mermaid syntax (for diagrams)",
  ],
  parameters: {
    type: StringEnum(["architecture", "flowchart", "sequence", "er", "state", "table", "diff", "plan", "timeline", "dashboard", "slides", "mermaid_custom"]),
    content: Union[string | Record<string, unknown>[]],
    title: string,
    aesthetic?: StringEnum(["blueprint", "editorial", "paper", "terminal", "dracula", "nord", "solarized", "gruvbox"]),
    theme?: StringEnum(["light", "dark", "auto"]),
    filename?: string,
  }
})
```

**Example LLM invocations:**

```typescript
// Architecture diagram with sections
tff_generate_visual({
  type: "architecture",
  title: "Auth System Overview",
  aesthetic: "blueprint",
  content: {
    sections: [
      { label: "Edge", content: "<div class=\"inner-card\">API Gateway</div>" },
      { label: "Core", content: "<div class=\"inner-card\">Auth Service</div>", isHero: true },
    ],
  },
});

// Flowchart from Mermaid syntax
tff_generate_visual({
  type: "flowchart",
  title: "Data Pipeline",
  aesthetic: "editorial",
  content: "graph LR; A[Ingest] --> B[Transform] --> C[Store]",
});

// Data table
tff_generate_visual({
  type: "table",
  title: "API Endpoints",
  aesthetic: "paper",
  content: [
    { method: "GET", path: "/users", status: { value: "stable", status: "success" } },
    { method: "POST", path: "/users", status: { value: "beta", status: "warning" } },
  ],
});
```

**Output:** Returns `{ content: [{ type: "text", text: "..." }], details: { type, title, aesthetic, theme, filePath, url } }`

### Secondary: Slash Commands

Two helper commands are registered:

- `/visual-reopen <n>` — Re-open a recently generated visual by index (1-10) from `state.recentFiles`
- `/visual-list` — List the last 10 generated visualizations with their file paths

### Session Hooks

- `session_start` event: Checks for extension updates (non-blocking) and displays "Visual explainer ready" notification if UI is available
- `session_shutdown` event: Cleanup temporary directories (no deletion of generated HTML files—they persist in `~/.agent/diagrams/`)

### Output Location

All generated HTML files are written to `~/.agent/diagrams/` and opened automatically in the system's default browser via platform-specific commands (`open` on macOS, `xdg-open` on Linux, `cmd /c start` on Windows).

---

## Capabilities (extractable as skills)

These are discrete, reusable capabilities that could be exposed as individual Claude Code skills:

### 1. **Generate Architecture Diagram**
   - **Purpose:** Create CSS Grid-based card layout visualizations for system architecture, microservices topology, or layered system descriptions
   - **Inputs:** Title, section objects with labels, content HTML, optional flow arrows, optional 3-column grid layout, optional pipeline steps with legend
   - **Outputs:** Self-contained HTML with animated fade-in sections, depth hierarchy (hero/elevated/default/recessed), color-coded dot indicators
   - **Key file:** `src/templates/architecture.ts`

### 2. **Generate Mermaid Diagram**
   - **Purpose:** Render flowcharts, sequence diagrams, ER diagrams, state machines, or custom Mermaid syntax with interactive zoom/pan controls
   - **Inputs:** Mermaid syntax string, title, optional caption, aesthetic, theme
   - **Outputs:** Self-contained HTML with Mermaid CDN loader, zoom controls (+, −, fit, 1:1, expand-to-tab), pan-drag support, adaptive viewport height
   - **Key techniques:**
     - Mermaid source stored in `<script type="text/plain">` (not `<pre class="mermaid">`) to prevent HTML parser mangling of `<`, `>`, `&`, `<br/>`
     - Explicit render via `mermaid.render(id, code)` with `startOnLoad: false` to avoid timing race with zoom handler binding
     - Concrete font strings in `themeVariables.fontFamily` (not CSS vars) because Mermaid bakes values into SVG inline styles
     - New-tab export reads `data-bg` attribute from `.mermaid-wrap` to match baked-in SVG colors
   - **Key file:** `src/templates/mermaid.ts`

### 3. **Generate Data Table**
   - **Purpose:** Render structured data as accessible HTML tables with status indicators, code cell formatting, and optional sticky headers
   - **Inputs:** Title, columns (key, header, optional width/align), rows (string or { value, status }), optional caption
   - **Outputs:** Self-contained HTML with alternating row backgrounds, hover effects, status badges (success/warning/error/neutral with colored dots), responsive layout
   - **Key file:** `src/templates/data-table.ts`

### 4. **Apply Design System Palette**
   - **Purpose:** Select warm, distinctive color palettes (never indigo/violet/pink) and matching typography for a given aesthetic
   - **Aesthetics:** blueprint, editorial, paper, terminal, dracula, nord, solarized, gruvbox
   - **Outputs:** CSS custom properties for 18+ palette variables (bg, surface, surface2, surfaceElevated, border, borderBright, text, textDim, accent, accentDim, green, greenDim, orange, orangeDim, teal, tealDim, plum, plumDim)
   - **Key file:** `src/templates/shared.ts` (PALETTES, FONT_PAIRINGS, SHARED_CSS)

### 5. **Generate Self-Contained HTML with Browser Launch**
   - **Purpose:** Compose complete HTML document with embedded CSS/JS, write to disk, and open in default browser
   - **Inputs:** Title, aesthetic, theme (light/dark/auto), body content HTML, extra CSS, extra scripts
   - **Outputs:** Writes file to `~/.agent/diagrams/{timestamp}-{sanitized-title}.html`, opens in browser, returns filePath + file:// URL
   - **Key techniques:**
     - Full self-contained documents (no external CSS/JS except Mermaid CDN)
     - Responsive design with `@media (max-width: 768px)` breakpoints
     - Respects `prefers-reduced-motion` for accessibility
     - Sanitizes filenames and HTML entities
   - **Key file:** `src/utils/file-writer.ts`, `src/utils/browser-open.ts`, `src/templates/shared.ts` (generateHtmlShell)

### 6. **Parse and Validate Visualization Parameters**
   - **Purpose:** Type-check and sanitize user-provided parameters before rendering
   - **Validates:** type (12 enum values), content (string or array), title (required string), aesthetic (8 enum values, fallback to "blueprint"), theme (3 enum values, fallback to "auto"), filename (optional, sanitized)
   - **Key file:** `src/utils/validators.ts`

### 7. **Track Recent Files and Provide Reopen Commands**
   - **Purpose:** Maintain a rolling queue of last 10 generated visualizations for quick re-access
   - **State:** `ExtensionState.recentFiles: string[]`
   - **Commands:** `/visual-reopen <n>`, `/visual-list`
   - **Key file:** `src/index.ts` (state management), `src/utils/file-writer.ts` (writeHtmlFile tracks in state)

---

## Key techniques / prompts / algorithms

### 1. HTML Generation Pipeline

The core rendering flow is:

1. **Validate Parameters** → `validateParams()` type-checks and normalizes input
2. **Determine Theme** → If `theme === "auto"`, check `prefersDarkMode()` (currently defaults to light on server)
3. **Select Template** → Switch on `params.type` to pick generator function (architecture, mermaid, table, or hybrid fallbacks for diff/plan/timeline/dashboard)
4. **Load Palette** → Fetch `PALETTES[aesthetic][isDark ? "dark" : "light"]` and `FONT_PAIRINGS[aesthetic]`
5. **Generate CSS Variables** → Call `generateCSSVariables(palette, fonts, isDark)` to produce `:root { --font-body, --font-mono, --bg, --surface, ... }`
6. **Compose Content HTML** → Template-specific generator (e.g., `generateArchitectureTemplate()`) transforms content to HTML
7. **Build Complete Document** → `generateHtmlShell(title, bodyContent, aesthetic, cssVars, extraHead, extraScripts)` wraps in DOCTYPE + fonts + styles
8. **Write to Disk** → `writeHtmlFile(filename, html, state)` saves to `~/.agent/diagrams/` and tracks in `state.recentFiles`
9. **Open Browser** → `openInBrowser(filePath, pi)` calls platform-specific command (open/xdg-open/cmd)
10. **Return Result** → `{ filePath, previewSnippet, url }`

**Key invariant:** The full HTML is written to disk WITHOUT truncation. The earlier bug report "mermaid graphs are always bugged" was caused by using `pi.truncateHead()` on the HTML itself, which cut off `</script>` tags and corrupted the document. The tool output (preview snippet) is truncated, but the actual file on disk is always complete.

### 2. Mermaid Rendering with Zoom/Pan Controls

The Mermaid shell (in `MERMAID_SHELL_JS` and `MERMAID_SHELL_CSS`) implements a sophisticated pan/zoom system:

**Key invariants (each exists because it was a real bug):**

1. **Opaque Script Tag:** Mermaid source lives in `<script type="text/plain" class="diagram-source">`, NOT `<pre class="mermaid">`. The HTML parser treats it as opaque data, so `<br/>`, `<`, `>`, `&` survive untouched.

2. **Explicit Render:** Uses `mermaid.render(id, code)` with `startOnLoad: false` and awaits it before binding zoom handlers. Avoids race condition where "mermaid finished mutating DOM" happens after our controls try to bind.

3. **Concrete Fonts:** `themeVariables.fontFamily` uses concrete font strings (e.g., `"'IBM Plex Sans', system-ui, sans-serif"`), not CSS custom properties. Mermaid bakes the value into SVG `<style>` blocks, and CSS vars don't resolve inside an extracted SVG (see `openInNewTab()` function).

4. **Data-Bg Export:** `.mermaid-wrap` stores the page background color in a `data-bg` attribute. When the user clicks "expand to new tab," the export function reads this and wraps the SVG in a minimal HTML shell with matching background, so the new-tab view looks identical to the current page.

**Zoom/Pan Algorithm:**

- **Viewport:** Fixed-size container (`mermaid-viewport`) with `position: relative; overflow: hidden`
- **Canvas:** Absolute-positioned div that scales and translates based on zoom + pan state
- **Zoom Levels:** Configurable min (0.08) and max (6.5), with step increment (0.14)
- **Smart Fit:** On load, compute a "readability floor" (0.58)—if the contain zoom drops below this, switch to "width-priority" or "height-priority" mode to keep text readable
- **Constrain Pan:** After each zoom or pan operation, recalculate pan boundaries so the diagram can't pan off-screen unless it's larger than the viewport
- **Mouse/Touch:** Supports wheel zoom (Ctrl/Cmd + wheel), drag pan (grab cursor), and two-finger pinch zoom on touch devices
- **Adaptive Height:** After rendering, compute ideal container height from SVG's intrinsic aspect ratio, clamped between a min (360px) and max (960px or 84vh)

All this is an IIFE that auto-initializes for every `.diagram-shell` on the page, allowing multiple diagrams per document.

### 3. CSS Architecture: Depth Hierarchy and Variables

**Palette Structure:** Each aesthetic has 18 variables arranged as:
- **Surfaces:** `bg` (page), `surface` (card), `surface2` (alternate), `surfaceElevated` (hero prominence)
- **Borders:** `border` (subtle, 6-8% opacity), `borderBright` (12-15% opacity)
- **Typography:** `text` (primary), `textDim` (secondary/captions)
- **Accent colors:** `accent` + `accentDim`, plus 3 semantic colors: `green`, `orange`, `teal`, `plum` (each with dim variant)

**Depth Classes:**
- `.section--hero`: Elevated background, brightest border, 28px padding, higher z-index shadow
- `.section` (default): Standard surface, standard border, 20px padding
- `.section--recessed`: Darker background (surface2), inset shadow

**Animations:** Staggered fade-in using CSS custom property `--i` (animation index):
```css
.section {
  animation: fadeUp 0.4s ease-out both;
  animation-delay: calc(var(--i, 0) * 0.06s);
}
```

**Responsive Design:**
- Base: `padding: 40px`
- Mobile (`@media (max-width: 768px)`): `padding: 20px`, grid to single column, hide pipeline arrows
- Text: Balances with `text-wrap: balance` for heading, respects `font-variant-numeric: tabular-nums` for right-aligned numbers

### 4. Design Principles (Inherited from nicobailon/visual-explainer)

**Forbidden (AI Slop Detection):**
- Inter font as primary body font (never distinctive)
- Indigo/violet/pink as primary accents (#8b5cf6, #7c3aed, #a78bfa)
- Cyan-magenta-pink gradient combinations
- Emoji icons in section headers
- Animated glowing box-shadows
- Gradient text on headings (`background-clip: text`)

**Required:**
- **Distinctive font pairings:** Never just system fonts. Each aesthetic pairs a distinctive serif or sans-serif with a matching monospace:
  - blueprint: IBM Plex Sans + IBM Plex Mono
  - editorial: Instrument Serif + JetBrains Mono
  - paper: Bricolage Grotesque + Fragment Mono
  - terminal: JetBrains Mono (both)
  - dracula: DM Sans + Fira Code
  - nord: Plus Jakarta Sans + Azeret Mono
  - solarized: IBM Plex Sans + IBM Plex Mono
  - gruvbox: Bricolage Grotesque + Fragment Mono

- **Warm accents:** Terracotta, sage, teal, rose, amber, gold (never cool purples)
- **Depth through lightness:** 2-4% shifts between surface levels, not shadows alone
- **Accessibility:** Respects `prefers-reduced-motion`, uses semantic HTML (`<table>`, `<thead>`, `<tbody>`, status indicators via ::before dots)
- **Typography hierarchy:** Font sizes scale (h1 32-38px, labels 11px mono uppercase, body 13-14px)

### 5. Mermaid Source Escaping

Only one character sequence needs escaping: `</script`. The HTML parser looks for this exact sequence to terminate a `<script>` element. Everything else (`<`, `>`, `&`, `<br/>`) passes through untouched in a `<script type="text/plain">` element.

```typescript
export function escapeMermaidSource(source: string): string {
  return source.replace(/<\/script/gi, "<\\/script");
}
```

This is case-insensitive (`/gi` flags) to catch `</SCRIPT` or mixed case.

### 6. State Management

```typescript
interface ExtensionState {
  recentFiles: string[];      // Last 10 generated files (unshift/slice pattern)
  tempDirs: string[];         // For future cleanup (currently empty)
  defaultAesthetic: Aesthetic; // "blueprint"
  defaultTheme: Theme;        // "auto"
}
```

State is created once on extension load via `createInitialState()`. The `writeHtmlFile()` function pushes each new file to the front of `recentFiles` and keeps only the last 10. Files are NOT deleted on shutdown; they persist in `~/.agent/diagrams/` for manual reference.

---

## Runtime stack

- **Language:** TypeScript (strict mode, ES modules)
- **Runtime:** Node.js ≥20.0.0 (via PI, which runs on Node)
- **Package Manager:** bun (for install, test, build)
- **Module System:** ESM with `type: "module"` in package.json
- **Type System:** TypeScript 5.7+
- **Testing:** Vitest 2.1.0 with snapshot and coverage support
- **Linting:** Biome 1.9.4 (replaces ESLint + Prettier)
- **Git Hooks:** Lefthook 2.1.5 (auto-installed via `npm/bun run prepare`)
- **Commit Linting:** CommitLint (conventional commits)
- **Build Output:** Compiled to `dist/` (index.js + .d.ts for all modules)
- **Peer Dependencies:** PI's core packages:
  - @mariozechner/pi-coding-agent (ExtensionAPI, defineTool)
  - @mariozechner/pi-ai (StringEnum)
  - @mariozechner/pi-tui (UI context)
  - @sinclair/typebox (Type for schema validation)

**Build Command:** `tsc -p tsconfig.build.json` (TypeScript-only, no bundler needed; output is tree-shakable ESM)

**Key Files:**
- `src/index.ts` — Extension entry point, tool registration, state initialization
- `src/types.ts` — All TypeScript interfaces (VisualType, Aesthetic, Theme, Palette, etc.)
- `src/templates/` — HTML template generators (architecture, mermaid, data-table, shared)
- `src/utils/` — Validators, file I/O, browser launching
- `dist/` — Compiled output (git-ignored, rebuilt on `bun run build`)
- `package.json` — Field `"pi": { "extensions": ["./dist/index.js"] }` tells PI where to load the extension

---

## Reusable artifacts (prompts, templates, skill definitions)

### 1. **Tool Definition (Main Artifact)**

The entire tool is defined in `src/index.ts` via `defineTool()`:

```typescript
const generateVisualTool = defineTool({
  name: "tff-generate_visual",
  label: "Generate Visual",
  description: "Generate beautiful, self-contained HTML pages for diagrams, architecture overviews, diff reviews, data tables, and visual explanations. Opens result in browser. Based on nicobailon/visual-explainer design principles.",
  promptSnippet: "Create a visual diagram/architecture/table",
  promptGuidelines: [
    "Use this tool when the user asks for diagrams, architecture views, or data tables",
    "Proactively use for complex tables (4+ rows, 3+ columns) instead of ASCII",
    "Choose aesthetic based on context: blueprint (technical), editorial (formal), paper (warm), terminal (retro), dracula/nord/solarized/gruvbox (IDE themes)",
    "Content can be structured data (for tables) or mermaid syntax (for diagrams)",
  ],
  parameters: Type.Object({
    type: StringEnum([...]),
    content: Type.Union([...]),
    title: Type.String(...),
    aesthetic: Type.Optional(StringEnum([...])),
    theme: Type.Optional(StringEnum([...])),
    filename: Type.Optional(Type.String(...)),
  }),
  async execute(_toolCallId, rawParams, _signal, _onUpdate, _ctx) {
    const params = validateParams(rawParams);
    const result = await generateVisual(params, pi);
    return {
      content: [{ type: "text", text: `${result.previewSnippet}\n\nOpened in browser: ${result.url}\nFile: ${result.filePath}` }],
      details: { type: params.type, title: params.title, aesthetic: params.aesthetic, theme: params.theme, filePath: result.filePath, url: result.url },
    };
  },
});
pi.registerTool(generateVisualTool);
```

This is a direct PI extension; no separate "skill definition" markdown file exists. The tool is self-documenting via its description and promptGuidelines.

### 2. **Palette Definitions**

In `src/templates/shared.ts`, a comprehensive palette system for 8 aesthetics, each with light and dark variants:

```typescript
export const PALETTES: Record<Aesthetic, { light: Palette; dark: Palette }> = {
  blueprint: { light: { bg: "#faf7f5", surface: "#ffffff", ... }, dark: { ... } },
  editorial: { light: { ... }, dark: { ... } },
  // ... 6 more
};

export const FONT_PAIRINGS: Record<Aesthetic, FontPairing> = {
  blueprint: { body: "'IBM Plex Sans', system-ui, sans-serif", mono: "'IBM Plex Mono', ..." },
  // ... 7 more
};
```

All color values are hex or rgba; fully deterministic and theme-agnostic.

### 3. **Shared CSS Foundation**

`SHARED_CSS` (1200+ lines of CSS in `src/templates/shared.ts`) defines:
- Reset (*, margin, padding, box-sizing)
- Base animations (fadeUp, fadeScale)
- Reduced motion query
- Section card base classes (.section, .section--hero, .section--recessed)
- Section labels with dot indicators
- Flow arrows with SVG
- Code styling
- Responsive media query for mobile

Plus `MERMAID_SHELL_CSS` and `MERMAID_SHELL_JS` for the Mermaid zoom/pan system.

### 4. **Template Generators (Composable Functions)**

Three main template generators, all with signature `(title, content, aesthetic, isDark) => string`:

**`generateArchitectureTemplate()`** (`src/templates/architecture.ts`):
- Accepts `ArchitectureContent` with sections array + optional flowArrows, threeColumn, pipeline
- Outputs HTML with staggered animations, color-coded labels, nested grid layouts
- ~335 lines including CSS

**`generateMermaidTemplate()`** (`src/templates/mermaid.ts`):
- Accepts `MermaidContent` with mermaidSyntax string + optional caption
- Embeds Mermaid CDN loader, zoom controls, pan/drag handlers
- Handles all Mermaid diagram types (flowchart, sequence, ER, state, mindmap, etc.)
- ~200 lines + 1000+ lines of shell JS/CSS

**`generateTableTemplate()`** (`src/templates/data-table.ts`):
- Accepts `TableContent` with columns + rows, optional sticky header
- Renders semantic HTML `<table>` with status indicators, alternating row colors
- ~300 lines including CSS

All three use `generateHtmlShell()` to wrap their content in a complete HTML document.

### 5. **HTML Shell Template**

`generateHtmlShell(title, bodyContent, aesthetic, cssVariables, extraHead, extraScripts)` in `src/templates/shared.ts`:

```typescript
export function generateHtmlShell(
  title: string,
  bodyContent: string,
  aesthetic: string,
  cssVariables: string,
  extraHead = "",
  extraScripts = "",
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&..." rel="stylesheet">
<style>
${cssVariables}
${SHARED_CSS}
${extraHead}
</style>
</head>
<body>
${bodyContent}
${extraScripts}
</body>
</html>`;
}
```

All fonts are pre-connect, single Google Fonts request for all aesthetics. Self-contained, no external CSS/JS except Mermaid CDN (loaded as module script in the mermaid template).

### 6. **Validation and Filename Generation**

`src/utils/validators.ts` exports:
- `validateVisualType(type)` — Enum check with error message listing valid values
- `validateAesthetic(aesthetic)` — Fallback to "blueprint" with warning
- `validateTheme(theme)` — Fallback to "auto" with warning
- `validateParams(params)` — Full parameter type-checking
- `sanitizeFilename(filename)` — Remove path components, replace invalid chars with `-`, ensure `.html` extension
- `generateDefaultFilename(title)` — Pattern `${date}-${slug}.html` (e.g., `2026-04-25-auth-system.html`)

### 7. **Cross-Platform Browser Launcher**

`src/utils/browser-open.ts`:

```typescript
export async function openInBrowser(filePath: string, pi: ExtensionAPI): Promise<void> {
  const platform = process.platform;
  let command: string, args: string[];
  
  switch (platform) {
    case "darwin": command = "open"; args = [filePath]; break;
    case "linux": command = "xdg-open"; args = [filePath]; break;
    case "win32": command = "cmd"; args = ["/c", "start", "", filePath]; break;
    default: throw new Error(`Unsupported platform: ${platform}...`);
  }
  
  const result = await pi.exec(command, args, { timeout: 10000 });
  if (result.code !== 0) throw new Error(`Browser open failed: ${result.stderr || "Unknown error"}`);
}
```

Uses PI's `exec()` method to spawn the platform-specific opener with a 10-second timeout.

### 8. **Test Suite Structure**

Tests in `tests/` use Vitest with snapshot testing:

- `tests/templates/mermaid.test.ts` — 8 tests covering script tag safety, special characters, font handling, complete document structure
- `tests/templates/shared.test.ts` — Palette validation, CSS variable generation
- `tests/utils/validators.test.ts` — Type checking, error messages, fallback behavior

Each test guards against a specific real bug from the original codebase (e.g., "tests/templates/mermaid.test.ts:87-98" guards against the `truncateHead` bug that corrupted large diagrams).

---

## Claude Code nativeness

### How It Integrates with Claude Code (PI)

**Installation:**
The package is published to npm as `@the-forge-flow/visual-explainer-pi` and installed via:
```bash
pi install npm:@the-forge-flow/visual-explainer-pi
```

The `package.json` field `"pi": { "extensions": ["./dist/index.js"] }` tells PI to load `dist/index.js` as an extension on session start.

**Extension Lifecycle:**

1. **Session Start (`session_start` event):**
   - Calls `checkForUpdates(pi)` (non-blocking) to fetch latest version from npm registry
   - If update available, notifies user: `"📦 Update available: X.Y.Z (you have A.B.C). Run: pi install npm:@the-forge-flow/visual-explainer-pi"`
   - Displays "Visual explainer ready" notification if UI available

2. **Tool Registration:**
   - Calls `pi.registerTool(generateVisualTool)` to expose the `tff-generate_visual` tool to the LLM
   - Tool is immediately available for the LLM to call; no special commands needed

3. **Command Registration:**
   - `/visual-reopen <n>` and `/visual-list` are PI commands, callable by user or forwarded by the system

4. **Session Shutdown (`session_shutdown` event):**
   - Clears `state.tempDirs` (currently unused, for future cleanup)
   - HTML files in `~/.agent/diagrams/` persist intentionally

### No Plugin Manifest, No Skills Directory

Unlike traditional Claude Code plugins:
- **No .claude/ directory required** — The tool is registered directly via `defineTool()`
- **No separate skill markdown files** — The tool's `description`, `promptSnippet`, and `promptGuidelines` serve as self-documentation
- **No MCP integration** — Direct PI extension, not an MCP server
- **No special hooks** — Uses standard PI extension API (registerTool, registerCommand, on events)

The extension is a **first-party PI package**, not a third-party skill. It's native to PI's tool system.

### Output Handling for PI's Context Limits

The tool is careful about LLM-facing output:
- Full HTML file (which may be 50–200 KB) is written to disk WITHOUT truncation
- The `previewSnippet` returned to the LLM is a short summary: `"Generated ${type} visualization: ${title}"`
- The LLM receives metadata (filePath, URL) for reference but not the full HTML body
- This avoids the earlier bug where `pi.truncateHead()` was applied to the HTML itself, corrupting `</script>` tags

### Cross-Platform Compatibility

- Uses Node.js built-in APIs (fs/promises, os.homedir, path, process.platform)
- No platform-specific native modules
- Browser opening uses PI's `pi.exec()` for safe subprocess launching with timeout
- Tested and working on macOS (darwin), Linux, and Windows (win32)

---

## Recommendation: skills to extract for the-forge-flow

To re-expose visual-explainer's capabilities as individual Claude Code skills (compatible with the-forge-flow's skill system), propose:

### Candidate Skills:

1. **`visual-explainer:generate-web-diagram`** (ALREADY EXISTS in skill list)
   - Wraps `tff-generate_visual` with type="mermaid_custom" or "flowchart"
   - Input: Diagram title, Mermaid syntax, optional aesthetic
   - Output: Browser-opened HTML file with zoom/pan controls
   - Reuse: `generateMermaidTemplate()`, `openInBrowser()`, `MERMAID_SHELL_JS`

2. **`visual-explainer:generate-architecture`** (NEW)
   - Wraps `tff-generate_visual` with type="architecture"
   - Input: System/architecture description (natural language or structured sections)
   - Output: Browser-opened architecture diagram with depth hierarchy
   - Reuse: `generateArchitectureTemplate()`, palette system, `.section--hero`/`.section--recessed` CSS

3. **`visual-explainer:generate-comparison-table`** (NEW)
   - Wraps `tff-generate_visual` with type="table"
   - Input: Structured data (e.g., API endpoints, feature matrix)
   - Output: Responsive HTML table with status indicators
   - Reuse: `generateTableTemplate()`, status badge CSS

4. **`visual-explainer:apply-aesthetic`** (UTILITY)
   - Exposes palette + typography selection
   - Input: Aesthetic name + theme (light/dark)
   - Output: CSS variables for use in custom HTML/templates
   - Reuse: `PALETTES`, `FONT_PAIRINGS`, `generateCSSVariables()`

5. **`visual-explainer:render-html-visual`** (CORE UTILITY)
   - Lower-level skill: takes raw HTML body content and palette, renders complete document
   - Inputs: title, bodyContent (HTML string), aesthetic, theme
   - Outputs: Written HTML file, browser launch
   - Reuse: `generateHtmlShell()`, `writeHtmlFile()`, `openInBrowser()`

### Skill Definition Format (Following the-forge-flow Conventions):

Each skill would be a TypeScript function exported as:

```typescript
// skill: generate-web-diagram
export interface GenerateWebDiagramInput {
  title: string;
  mermaidSyntax: string;
  aesthetic?: "blueprint" | "editorial" | "paper" | "terminal" | "dracula" | "nord" | "solarized" | "gruvbox";
  theme?: "light" | "dark" | "auto";
}

export interface GenerateWebDiagramOutput {
  filePath: string;
  url: string;
  previewSnippet: string;
}

export async function generateWebDiagram(
  input: GenerateWebDiagramInput,
  context: SkillContext,
): Promise<GenerateWebDiagramOutput> {
  // Calls generateMermaidTemplate(), writeHtmlFile(), openInBrowser()
}
```

### Key Extraction Points:

- **Do NOT duplicate HTML generation logic** — Import `src/templates/*` modules directly
- **Leverage validators** — Use `validateAesthetic()`, `validateTheme()`, etc. from `src/utils/validators.ts`
- **Wrap tool registration** — Each skill wraps a specific `tff-generate_visual` call with pre-set parameters
- **Preserve CSS system** — All palettes and fonts remain immutable; no modifications needed
- **Reuse file I/O** — `writeHtmlFile()` and `openInBrowser()` are generic enough for all skills

### Integration with the-forge-flow:

1. **Add `visual-explainer` package as peer dependency** in the-forge-flow's project
2. **Create skill adapters** in `.claude/skills/` that import and wrap the visual-explainer functions
3. **Share the `ExtensionState` pattern** for tracking recent files (or use the-forge-flow's own state management)
4. **Copy or import palettes** into shared theme system (if the-forge-flow has one)
5. **Document the 8 aesthetics** in the-forge-flow's skill guide so users can choose intentionally

### Example Skill Definition for the-forge-flow:

```markdown
# visual-explainer:generate-web-diagram

Generate a beautiful, browser-viewable diagram from Mermaid syntax.

## Input

- **mermaidSyntax** (string): Mermaid diagram code (flowchart, sequence, ER, state machine, etc.)
- **title** (string): Diagram title
- **aesthetic** (string, optional): One of: blueprint, editorial, paper, terminal, dracula, nord, solarized, gruvbox. Default: blueprint
- **theme** (string, optional): light, dark, or auto. Default: auto

## Output

- **filePath** (string): Path to the generated HTML file on disk
- **url** (string): file:// URL for the diagram
- **previewSnippet** (string): Short description of the generated visualization

## Example

```
{{ generateWebDiagram "Data Processing Pipeline" "graph LR; A[Ingest] --> B[Transform] --> C[Store]" }}
```

Result: Opens a beautiful, interactive diagram in your browser with zoom/pan controls.
```

---

## Summary Table

| Aspect | Detail |
|--------|--------|
| **Project Type** | PI extension package (npm: @the-forge-flow/visual-explainer-pi) |
| **Primary Interface** | Single `tff-generate_visual` tool + 2 slash commands |
| **Visualization Types** | 12: architecture, flowchart, sequence, ER, state, table, diff, plan, timeline, dashboard, slides, mermaid_custom |
| **Aesthetics** | 8 (blueprint, editorial, paper, terminal, dracula, nord, solarized, gruvbox), each light + dark |
| **Runtime** | TypeScript + Node.js ≥20 (via PI) |
| **Key Technique** | Self-contained HTML generation with embedded CSS/JS, Mermaid CDN for diagrams, zoom/pan controls |
| **Output** | `~/.agent/diagrams/{filename}.html`, auto-opened in browser |
| **State** | Tracks last 10 generated files for re-access via `/visual-reopen` and `/visual-list` |
| **Core Files** | index.ts (tool registration), templates/* (HTML generators), utils/* (validation, file I/O, browser opening) |
| **Design Principles** | No AI slop (forbidden: Inter font, indigo accents, gradient text, emoji headers, animated glows); warm palettes, distinctive type, depth hierarchy, accessibility |
| **Test Coverage** | 20+ Vitest unit tests covering template generation, character escaping, complete document validation |
| **Reusable Components** | Palette system, template generators, CSS foundations, validators, file writer, browser launcher |
| **Claude Code Integration** | Loads via `pi install npm:...`, registers tool with `defineTool()`, uses PI's ExtensionAPI for exec/notify |

---
