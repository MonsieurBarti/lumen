# Output UX — Schema Over Prose

Shared output rules for all forge skills. Each skill cites this reference rather than duplicating the rules.

Generated HTML must be **scannable in 5 seconds** (glance), **navigable in 30 seconds** (scan), and **deep-readable in 5 minutes** (study). Every content block must earn its visual weight.

---

## Three-Layer Information Architecture

| Layer | Time | What the reader sees | Components |
|---|---|---|---|
| **Glance** (above fold) | 0–5s | Title + ONE visual + key takeaway | `.hero`, `.stat-grid`, `.summary-card` |
| **Scan** (first scroll) | 5–30s | Highest-priority details, key facts | `.kv-strip`, tables, bold-lead lists, `.tag-row` |
| **Deep** (full page) | 30s–5min | Implementation details, edge cases, historical context | `details.disclosure`, tabs, `.finding` cards |

---

## Mandatory Rules

1. **Schema over sentences** — Use tables, stat-cards, key-value strips, and bold-lead lists instead of paragraphs. A paragraph is a last resort for narrative that cannot be structured.

2. **Bold-lead lists** — Every `<li>` in a description list starts with **2-3 bolded words** (information scent). The reader scans bold text in 200ms per item.
   ```html
   <li><strong>Hub routing</strong> — dispatches messages to registered handlers via NATS topics</li>
   ```

3. **Progressive disclosure** — Secondary information *for the stated reader* lives in `<details class="disclosure">`:
   - Edge cases, "why" explanations, historical context → collapsed by default
   - Implementation notes, code examples → collapsed by default
   - Only the essential "what" is visible on first render

   **Exception:** If Signal 1 = onboarding/learning AND the content is first-principles context (not edge-case detail), keep it visible. Foundational "why" explanations that the stated reader needs to understand the document are not secondary — do not collapse them. Collapse only what is secondary *for that specific reader*.

   ```html
   <details class="disclosure">
     <summary>Why NATS over direct imports?</summary>
     <p>Process isolation allows independent restarts without cascading failures...</p>
   </details>
   ```

4. **Key-value over prose** — Metadata, config, specs use `.kv-strip` or `.summary-card .summary-kv`, never inline prose.
   ```html
   <div class="kv-strip">
     <span class="kv"><b>Runtime</b> Python 3.12</span>
     <span class="kv"><b>GPU</b> RTX 5070 Ti</span>
     <span class="kv"><b>Transport</b> NATS</span>
   </div>
   ```

5. **Tables for comparison** — Never write "X is faster than Y because...". Use a `.table-wrap > table` with structured columns. Prose comparison is forbidden.

6. **Stat-cards for numbers** — Any numeric value that matters gets a `.stat` card, not a sentence containing a number.

7. **Max 4 sentences per visible block** — If a `<p>` or card body exceeds 4 sentences, extract the excess into a `<details class="disclosure">` underneath.

8. **Tooltips for jargon** — Technical terms that need definition use `<span class="has-tip" data-tip="...">term</span>` instead of inline parenthetical explanations.

9. **Summary card as page anchor** — Every tab or major section starts with a `.summary-card` that states the section's conclusion in ≤ 2 sentences. The reader should understand the section's answer before reading any detail.

10. **No equal-weight walls** — Headings every 200-300 words. No section exceeds 5 visible blocks without a visual break. A block = any element with `display:block` that renders more than one line of visible text. A visual break = diagram, table, stat-grid, `<hr>`, or `<details class="disclosure">`.

---

## Anti-Patterns (FORBIDDEN)

| Anti-Pattern | Fix |
|---|---|
| Paragraph > 4 sentences | Extract excess into `<details class="disclosure">` |
| Inline metadata ("The runtime is Python 3.12, the GPU is...") | Use `.kv-strip` or `.summary-card .summary-kv` |
| Prose comparison ("Option A is better because...") | Use `.table-wrap > table` with structured columns |
| All content at equal visual weight | Use three-layer architecture: glance → scan → deep |
| Generic headings ("Overview", "Details") | Descriptive headings ("How the hub routes messages") |
| Number buried in prose ("We have 47 endpoints") | Use `.stat` card with `.stat__value` + `.stat__label` |
| Parenthetical definition ("NATS (a message broker)") | Use `.has-tip` tooltip |
| Long explanation visible by default | Wrap in `<details class="disclosure">` |

---

## Fact-sheet

Before emitting HTML, the sub-agent enumerates every factual claim the output will make — file paths, line numbers, version strings, counts (tab/section/row totals), component/class names, command invocations, and any quoted identifier from source. Each item is re-read against its source file or authoritative command output and confirmed correct.

The fact-sheet is a throwaway checklist (not committed), compiled in the same turn as output generation. Its purpose is to catch the drift that occurs when a sub-agent paraphrases structure from memory instead of re-reading source — the single most common cause of hallucinated paths, stale counts, and fabricated component names in `forge-epic` and `forge-guide` output.

One bullet per claim. A claim is verified only when the agent has actually re-read or re-run the source since drafting the output — not when it "looks right."

---

## Deliver Checklist (Output UX)

Every skill's Deliver phase must verify:

- Fact-sheet compiled and every claim verified against source (see Fact-sheet section above).
- Every tab/section starts with a `.summary-card` or `.stat-grid` (glance layer present).
- No visible text block exceeds 4 sentences without a break or disclosure wrapper.
- Metadata uses `.kv-strip` or structured table, not inline prose.

---

## See Also

- `base/explainer-base.css` — CSS implementations of disclosure, tooltip, kv-strip, summary-card
- `frame-phase.md` — Signal 1 (reader-action) determines what counts as "secondary" in Rule 3
