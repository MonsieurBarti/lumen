# forge-gallery fixtures

Stable JSON inputs that anchor regression testing for `forge-gallery`. Each file describes a single gallery invocation — the prompt, slug, project — that the skill should be able to render deterministically.

## Schema

```json
{
  "skill": "forge-gallery",
  "variant": "<gallery template>",
  "input": {
    "prompt": "<user prompt to the skill>",
    "slug": "<output filename stem>",
    "project": "<target project under ~/.roxabi/forge/>"
  },
  "expected_output_hash": null,
  "notes": "<one line on what this fixture exercises>"
}
```

| Key | Type | Purpose |
|---|---|---|
| `skill` | string | Always `"forge-gallery"` for this directory. |
| `variant` | string | One of the gallery templates (pivot, simple, comparison, audio, multi-mode). |
| `input.prompt` | string | Verbatim user prompt. |
| `input.slug` | string | Output file stem. |
| `input.project` | string | Project scope under `~/.roxabi/forge/<project>/`. |
| `expected_output_hash` | string \| null | **Null in this issue.** Future runners: SHA-256 of rendered HTML (whitespace-normalized). |
| `notes` | string | What this fixture anchors — which template feature, which data shape. |

## Hash algorithm (future)

When the fixture runner lands, `expected_output_hash` will be:

```
sha256( render(skill, input) | normalize-whitespace )
```

## This issue scope

Infrastructure only. No runner executes validation in CI yet. Fixtures are authored alongside prompts so a future runner has a ready corpus.
