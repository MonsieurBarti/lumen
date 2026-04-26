# lumen-fact-check — example

Two files, same document, before and after running the `lumen-fact-check`
skill against the lumen repo:

- [`before.md`](./before.md) — a fictional "quick overview" of lumen with
  11 intentional inaccuracies of every claim type the recipe checks for
  (quantitative, naming, behavioral, structural, temporal).
- [`after.md`](./after.md) — the same document after fact-check, with
  corrections applied in place and a `## Verification Summary` table
  appended that cites the source for every fix.

Diff the two files to see exactly what the skill changes.
