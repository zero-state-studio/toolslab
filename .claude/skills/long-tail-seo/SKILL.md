---
name: long-tail-seo
description: "Research, assign, and verify long-tail SEO keywords for ToolsLab tools. Use when adding long-tail keywords to a tool, auditing keyword coverage, or optimizing tool page content for search. Triggers: 'long-tail keywords', 'keyword research for tool', 'SEO keywords for [tool]', 'check keyword coverage', 'add long-tail to [tool]'."
metadata:
  version: 1.0.0
---

# /long-tail-seo — Long-Tail Keyword Research & Verification

Automated workflow for researching, assigning, and verifying long-tail SEO keywords for ToolsLab tools. Ensures keywords are both defined in `tools.ts` AND covered in visible page content.

## Usage

```
/long-tail-seo [tool-id]
/long-tail-seo base64-to-pdf
/long-tail-seo --audit              # Audit all tools with existing longTailKeywords
/long-tail-seo --find-missing       # List tools without longTailKeywords
```

## Architecture

### Where long-tail keywords live

```
lib/tools.ts                          → longTailKeywords: string[] (keyword inventory)
lib/i18n/dictionaries/en/tools/*.json → pageDescription, instructions (visible content)
app/tools/[tool]/page.tsx             → <meta keywords> (injected automatically)
lib/tool-schema.ts                    → JSON-LD keywords field (injected automatically)
```

### SEO weight of each location

| Location | SEO Weight | Why |
|---|---|---|
| `pageDescription` (visible text) | **HIGH** | Google indexes visible content |
| `meta.description` | **HIGH** | Appears in SERP snippets |
| `instructions` (steps, features, useCases) | **HIGH** | Visible, indexable content |
| H1/H2 headings | **HIGH** | Strong ranking signal |
| JSON-LD `keywords` field | **LOW** | Semantic signal only |
| `<meta name="keywords">` tag | **ZERO** | Google ignores since 2009 |

**Key insight**: Long-tail keywords only have SEO value when their concepts appear in **visible page content**. The `longTailKeywords` array in `tools.ts` serves as a strategic inventory — the real work is ensuring `pageDescription` and `instructions` cover those concepts.

---

## Workflow: 4 Steps

### Step 1: RESEARCH — Find high-value long-tail queries

For the given tool, generate 12 long-tail keywords by combining:

**Query patterns to cover:**
- **Transactional**: `[tool] online free`, `[tool] no signup`, `free online [tool]`
- **Informational**: `how to [action]`, `what is [tool]`
- **Specific feature**: `[tool] with [feature]`, `[tool] for [use case]`
- **Comparison/Alternative**: `[tool] without [limitation]`, `[tool] in browser`
- **Format variations**: `[input] to [output] converter`, `convert [input] to [output]`

**Quality criteria for each keyword:**
- Contains 4-8 words (true long-tail)
- Represents a real search query (natural language)
- Includes the tool's primary function
- Mixes intent types (informational, transactional, navigational)
- Avoids keyword stuffing or unnatural phrasing

**Research method:**
1. Read the tool's `name`, `description`, `keywords` from `lib/tools.ts`
2. Read the tool's `pageDescription` and `instructions` from the EN i18n file
3. Identify the tool's core function, input/output, and unique features
4. Generate 12 long-tail keywords covering diverse query patterns
5. Prioritize keywords that match real user search intent

### Step 2: ASSIGN — Add keywords to tools.ts

Add the `longTailKeywords` array to the tool entry in `lib/tools.ts`:

```typescript
{
  id: 'tool-id',
  name: 'Tool Name',
  // ... existing fields
  keywords: ['existing', 'short', 'keywords'],
  longTailKeywords: [
    'tool name converter online free',
    'how to use tool name',
    // ... 10 more
  ],
  searchVolume: 5000,
}
```

**Rules:**
- Always 12 keywords per tool
- English only (visible content in i18n handles other languages)
- No duplicates with existing `keywords` array
- Each keyword must be unique (no near-duplicates)

### Step 3: VERIFY — Cross-check against visible content

For each of the 12 long-tail keywords, check if the key concepts appear in:

1. `pageDescription` in `lib/i18n/dictionaries/en/tools/[tool-id].json`
2. `meta.description` in the same file
3. `tagline` in the same file
4. `instructions.steps[].description`
5. `instructions.features[]`
6. `instructions.useCases[]`
7. `instructions.proTips[]`

**Verification rules:**
- A keyword is "covered" if its 2-3 most distinctive concepts appear somewhere in the visible content
- Example: `"base64 to jpg converter online free"` → check for "converter" + "online" + "free" in content
- Generic words like "the", "to", "and" don't count as concepts to verify
- The exact phrase does NOT need to appear — conceptual coverage is sufficient

**Output a coverage table:**

```
| Long-Tail Keyword | Status | Found In |
|---|---|---|
| tool converter online free | COVERED | meta.description: "Free converter" |
| how to convert tool data | NOT COVERED | "how to" pattern missing from instructions |
```

### Step 4: FIX — Enrich content for uncovered keywords

For any NOT COVERED keywords:

1. Identify which concept is missing
2. Suggest a specific edit to `pageDescription` or `instructions` to naturally include it
3. Apply the edit (add a sentence or phrase, don't rewrite the whole thing)
4. NEVER add keyword-stuffed content — it must read naturally
5. Verify the fix covers the gap

**Where to add missing concepts (in priority order):**
1. `pageDescription` — if the concept is a core feature/benefit
2. `instructions.features[]` — if it's a specific capability
3. `instructions.useCases[]` — if it's a use case scenario
4. `instructions.proTips[]` — if it's an advanced usage pattern

---

## Output Format

After running all 4 steps, output:

```
## Long-Tail SEO Report: [tool-id]

### Keywords Added (12)
1. keyword one
2. keyword two
...

### Coverage Check
| # | Long-Tail Keyword | Status | Found In |
|---|---|---|---|
| 1 | keyword one | COVERED | pageDescription |
| 2 | keyword two | FIXED | Added to instructions.features |
...

### Summary
- Total: 12 keywords
- Covered: X/12
- Fixed: Y/12
- Coverage: 100%

### Content Changes Made
- [file]: added "phrase" to [field]
```

---

## Audit Mode (`--audit`)

When run with `--audit`, check ALL tools that already have `longTailKeywords` defined:

1. Read all tool entries from `lib/tools.ts` that have `longTailKeywords`
2. For each, run Step 3 (VERIFY) only
3. Output a summary table:

```
| Tool | Keywords | Covered | Gaps |
|---|---|---|---|
| base64-to-jpg | 12 | 12 | 0 |
| lorem-ipsum | 12 | 11 | 1 |
```

4. For any gaps found, run Step 4 (FIX)

---

## Find Missing Mode (`--find-missing`)

List all tools in `lib/tools.ts` that do NOT have `longTailKeywords` defined, sorted by `searchVolume` descending (highest opportunity first):

```
| Tool | Search Volume | Keywords | Long-Tail |
|---|---|---|---|
| fancy-text-generator | 82,000 | 12 | MISSING |
| curl-to-code | 45,000 | 8 | MISSING |
...
```

---

## Integration with Other Skills

This skill works alongside:
- **`seo-audit`** — Run seo-audit first to check overall SEO health, then long-tail-seo for keyword depth
- **`programmatic-seo`** — Use long-tail findings to inform SEO content strategy
- **`page-cro`** — Long-tail keywords inform what content should be on the page for conversion

---

## Files Modified by This Skill

| File | What Changes |
|---|---|
| `lib/tools.ts` | `longTailKeywords` array added to tool entry |
| `lib/i18n/dictionaries/en/tools/[tool-id].json` | `pageDescription`, `instructions` enriched (only if gaps found) |

**Files NOT modified** (automatic pipeline handles them):
- `app/tools/[tool]/page.tsx` — reads `longTailKeywords` automatically for meta tags
- `app/[locale]/tools/[tool]/page.tsx` — same
- `lib/tool-schema.ts` — reads `longTailKeywords` automatically for JSON-LD
