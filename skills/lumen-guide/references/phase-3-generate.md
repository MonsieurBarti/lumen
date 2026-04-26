# Phase 3 — Generate (lumen-guide)

> **Self-check:** if you are reading this file, the `Read ${CLAUDE_PLUGIN_ROOT}/skills/lumen-guide/references/phase-3-generate.md` directive from `SKILL.md:Pipeline · Deliver` resolved. If you are building a lumen-guide split-file output and have not seen this header, abort and report the unresolved path — this body is mandatory for split-file generation.

**File paths:**
```
{ROOT}/{SLUG}.html                  ← shell (CSS linked, JS inlined)
{ROOT}/css/{SLUG}.css               ← single linked stylesheet
{ROOT}/tabs/{SLUG}/tab-{ID}.html    ← one fragment per tab (lazy-fetched)
```

Read `shells/split.html` → substitute placeholders. The shell contains all structure.

**Shell HTML:** diagram-meta block, Google Fonts link, single `css/{SLUG}.css` link, header, nav with tab buttons + theme toggle, panel placeholders, two inline `<script>` blocks (`{THEME_TOGGLE_JS}` then `{TAB_LOADER_JS}`).

**CSS file:** concatenate base sheets (`reset.css` + `typography.css` + `layout.css` + `components.css`) + chosen aesthetic from `lumen-diagram/templates/aesthetics/*.css` + any guide-specific styles. Write to `{ROOT}/css/{SLUG}.css`.

**JS:** there is no separate JS file. `theme-toggle.js` and `tab-loader.js` are inlined into the shell via the `{THEME_TOGGLE_JS}` / `{TAB_LOADER_JS}` placeholders, with `{NAME}` substituted to match `{SLUG}` (so `tab-loader.js` fetches `tabs/{SLUG}/tab-{ID}.html`). Add Mermaid init or any other one-off scripts via `{EXTRA_SCRIPTS}`.

### Header (REQUIRED for multi-tab)

Replace the plain nav title with a styled header:

```html
<header>
  <div class="header-eyebrow">{{EYEBROW}}</div>
  <h1>{{TITLE_PLAIN}} <span class="accent">{{TITLE_ACCENT}}</span></h1>
  <div class="header-subtitle">{{SUBTITLE}}</div>
  <div class="header-row">
    <span class="verdict-badge green">✓ {{BADGE_1}}</span>
    <span class="verdict-badge amber">⚠ {{BADGE_2}}</span>
  </div>
</header>
<nav class="topnav" aria-label="Main">
  <div class="tabs" role="tablist">
    {TABS}
  </div>
  <button class="theme-btn" id="theme-toggle" ...>◑ light</button>
</nav>
```

### TOC Sidebar (for mono-page guides)

For audit-style or long-form single-page docs, use the TOC sidebar layout:

```html
<div class="wrap--toc">
  <aside class="toc">
    <div class="toc-title">Contents</div>
    <a href="#overview">Overview</a>
    <a href="#section-1">1. Section Name</a>
    <a href="#section-2">2. Another Section</a>
  </aside>
  <main class="main--toc">
    <!-- content here -->
  </main>
</div>
```

Add TOC scroll observer to `{EXTRA_SCRIPTS}`:

```javascript
// TOC scroll observer
const tocLinks = document.querySelectorAll('.toc a')
const sections = document.querySelectorAll('.sec-head')
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      tocLinks.forEach(l => l.classList.remove('active'))
      const id = e.target.getAttribute('id')
      document.querySelector(`.toc a[href="#${id}"]`)?.classList.add('active')
    }
  })
}, { rootMargin: '-20% 0px -80% 0px' })
sections.forEach(s => observer.observe(s))
```

### Section Titles (REQUIRED)

Use styled section titles instead of plain `<h2>`:

```html
<div class="section-title">2.1 — Section Name</div>
```

Or with section label:

```html
<div class="section-label dot">1.1</div>
<h2>Section Name</h2>
```

### Finding Cards (for audit-style content)

For code/design reviews, use finding cards with severity:

```html
<div class="finding finding--high">
  <div class="finding-header">
    <span class="badge badge--risk high">HIGH</span>
    <span class="finding-title">{{ISSUE_TITLE}}</span>
  </div>
  <div class="finding-body">{{DESCRIPTION}}</div>
  <div class="finding-files"><code>{{FILE_NAME}}</code></div>
</div>
```

Severity levels: `finding--high` (red), `finding--medium` (amber), `finding--low` (cyan).

### Stat Grid (for overview tabs)

```html
<div class="stat-grid">
  <div class="stat">
    <span class="stat__value">{{NUMBER}}</span>
    <span class="stat__label">{{LABEL}}</span>
  </div>
</div>
```

### fgraph diagrams (split-file mode)

Inline the CSS subset your topology uses (see `lumen-diagram/SKILL.md` Pipeline step 5) into the per-tab `tab-N.html` fragment, OR concatenate it into `{ROOT}/css/{SLUG}.css` once and reference shared classes per tab:

```html
<!-- in tabs/tab-N.html -->
<section class="diagram">
  <div class="fgraph-wrap">
    <svg class="fgraph-edges" viewBox="0 0 100 100" preserveAspectRatio="none">
      <path class="fg-edge control" d="M 20,50 L 80,50" marker-end="url(#fg-arr-cyan)"/>
    </svg>
    <div class="fgraph-node pill"    style="--x:20; --y:50">{{HUB_LABEL}}</div>
    <div class="fgraph-node hexagon" style="--x:80; --y:50">{{SATELLITE_LABEL}}</div>
  </div>
</section>
```

No runtime JS. Coord space is 0..100 for both `--x/--y` node positions and SVG path coords (`viewBox="0 0 100 100" preserveAspectRatio="none"` + `vector-effect: non-scaling-stroke`).

Template picker: see `lumen-diagram/SKILL.md` Topology selection table (15 shapes: `radial-hub`, `radial-ring`, `linear-flow`, `lane-swim`, `layered`, `deployment-tiers`, `machine-clusters`, `sequence`, `state`, `gantt`, `pie`, `er`, `dep-graph`, `dual-cluster`, `system-architecture`).

### Tab fragments — content patterns by tab type:

| Tab type | Content |
|----------|---------|
| Overview / intro | Header + `<p>` + `.stat-grid` + `.cards` grid (2–4 cards) |
| Step-by-step | Section titles + `<ol>` + `<pre><code>` |
| Architecture | Section title + fgraph diagram (`.fgraph-wrap` with semantic shapes — see `graph-templates/README.md`) + description |
| Comparison | Section title + `.table-wrap > table` with `<thead>` |
| Status / KPIs | Section title + `.stat-grid` + progress indicators |
| Decisions / log | `<h3>` entries with date + rationale `<p>` |
| Audit / Review | TOC sidebar + `.finding` cards by severity |

**Dark mode text — always:**
- Paragraphs, list items, card body → `color: var(--text-muted)` (`#9ca3af`)
- Column headers, dates, metadata → `color: var(--text-dim)` (`#6b7280`)

