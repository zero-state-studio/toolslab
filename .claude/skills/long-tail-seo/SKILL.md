---
name: long-tail-seo
description: "Research, assign, and verify long-tail SEO keywords for ToolsLab tools. Uses real web research (Google autocomplete, People Also Ask, competitor analysis) for data-driven keyword selection. Triggers: 'long-tail keywords', 'keyword research for tool', 'SEO keywords for [tool]', 'check keyword coverage', 'add long-tail to [tool]'."
metadata:
  version: 2.1.0
---

# /long-tail-seo — Long-Tail Keyword Research & Verification

Automated workflow for researching, assigning, and verifying long-tail SEO keywords for ToolsLab tools. **Uses real web research** (Google autocomplete, People Also Ask, competitor analysis, related searches) for data-driven keyword selection. Ensures keywords are both defined in `tools.ts` AND covered in visible page content.

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

### meta.description role in SEO

`meta.description` does NOT directly affect ranking, but it **controls the SERP snippet** — the text Google shows under the page title. If it's too short, too long, or misaligned with the page content, Google rewrites it automatically (losing control over messaging).

| Aspect | Rule |
|---|---|
| **Length** | 150-160 characters (sweet spot for SERP display) |
| **Content** | Must be a persuasive summary coherent with `pageDescription` |
| **Keywords** | Should include 2-3 top transactional long-tail concepts (Google bolds matching terms) |
| **CTA** | Implicit call-to-action ("Free", "online", "instant", "no signup") |
| **Uniqueness** | Must NOT be a copy-paste of `pageDescription` — it's a short, persuasive version |

---

## Workflow: 5 Steps

### Step 1: GATHER — Read tool data from codebase

Read the tool's existing data to understand what it does:

1. Read the tool's `name`, `description`, `keywords`, `searchVolume` from `lib/tools.ts`
2. Read the tool's `pageDescription` and `instructions` from `lib/i18n/dictionaries/en/tools/[tool-id].json`
3. Identify the tool's core function, input/output, unique features, and target audience
4. Note the existing `keywords` array to avoid duplicates

### Step 2: RESEARCH — Web research for real search data

**This is the critical step that makes keyword selection data-driven instead of guessed.**

Run **5 parallel web searches** using the WebSearch tool to gather real keyword data:

#### Search 1: Google autocomplete suggestions
```
Query: "[tool name] generator" OR "[tool name] online"
Goal: Find what Google suggests when users start typing
```

#### Search 2: "People Also Ask" and related queries
```
Query: "how to [tool primary action]" OR "[tool name] how to"
Goal: Find informational long-tail queries real users ask
```

#### Search 3: Competitor keyword analysis
```
Query: "best free [tool name] online" OR "[tool name] alternative"
Goal: Find what keywords competitors target
```

#### Search 4: Specific use-case queries
```
Query: "[tool name] for [primary use case]" OR "[tool action] without [common limitation]"
Goal: Find niche long-tail queries with high conversion intent
```

#### Search 5: Format/feature-specific queries
```
Query: "[tool name] with [key feature]" OR "[input format] to [output format] [tool type]"
Goal: Find feature-specific search patterns
```

**How to adapt searches per tool type:**
- **Converters** (base64-to-jpg, etc.): Focus on format pairs, "convert X to Y online free"
- **Generators** (lorem-ipsum, uuid, etc.): Focus on "generate X online", "random X generator"
- **Formatters** (json-formatter, sql-formatter): Focus on "format X online", "beautify X", "minify X"
- **Validators** (json-validator, regex-tester): Focus on "validate X online", "check X syntax"
- **Encoders/Decoders**: Focus on "encode/decode X online free", "X encoder decoder"
- **Social/Marketing tools**: Focus on "[platform] tool for [action]", "[platform] [feature] generator"

#### Processing web results

From the 5 searches, extract:
1. **Google autocomplete suggestions** — these are real high-volume queries
2. **"People Also Ask" questions** — convert to keyword format
3. **Related searches** at bottom of SERP — often excellent long-tail
4. **Competitor page titles and H1s** — reverse-engineer their keyword targets
5. **Forum/Reddit queries** — real user language and pain points

**Deduplication rules:**
- Remove near-duplicates (e.g., "json formatter online" vs "online json formatter")
- Prefer the version that matches natural search language
- Remove any that overlap with the existing `keywords` array

### Step 3: SELECT & ASSIGN — Choose 12 best keywords and add to tools.ts

From the web research results, select the **12 best long-tail keywords** using this scoring:

**Selection criteria (in priority order):**
1. **Found in real search results** (autocomplete, PAA, related searches) — highest priority
2. **Contains 4-8 words** (true long-tail territory)
3. **Clear search intent** (transactional, informational, or navigational)
4. **Natural language** (how a real person would type in Google)
5. **Diverse intent mix** — aim for approximately:
   - 4 transactional (`[tool] online free`, `[tool] no signup`)
   - 3 informational (`how to [action]`, `what is [tool]`)
   - 3 feature-specific (`[tool] with [feature]`, `[tool] for [use case]`)
   - 2 comparison/alternative (`best free [tool]`, `[tool] without [limitation]`)

**Add to tools.ts:**

```typescript
{
  id: 'tool-id',
  name: 'Tool Name',
  // ... existing fields
  keywords: ['existing', 'short', 'keywords'],
  longTailKeywords: [
    'keyword from google autocomplete',
    'keyword from people also ask',
    // ... 10 more, all validated by web research
  ],
  searchVolume: 5000,
}
```

**Rules:**
- Always 12 keywords per tool
- English only (visible content in i18n handles other languages)
- No duplicates with existing `keywords` array
- Each keyword must be unique (no near-duplicates)
- At least 8 of 12 must come directly from web research findings
- Maximum 4 can be pattern-generated (for coverage of intent types not found in search)

### Step 4: VERIFY — Cross-check against visible content AND meta.description

#### 4A: Long-tail keyword coverage check

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
| Long-Tail Keyword | Source | Status | Found In |
|---|---|---|---|
| tool converter online free | Google autocomplete | COVERED | meta.description |
| how to convert tool data | People Also Ask | NOT COVERED | missing from instructions |
```

#### 4B: meta.description health check

After the keyword coverage check, verify `meta.description` quality:

**1. Length check:**
- Count exact characters of `meta.description`
- Target: **150-160 characters** (Google's SERP snippet display range)
- Under 130 = TOO SHORT (Google will likely rewrite it)
- 130-149 = SLIGHTLY SHORT (acceptable but suboptimal)
- 150-160 = OPTIMAL
- 161-170 = SLIGHTLY LONG (may get truncated with "...")
- Over 170 = TOO LONG (will be truncated)

**2. Coherence check with pageDescription:**
- `meta.description` must be a **short, persuasive summary** of `pageDescription`
- It must NOT be a copy-paste or truncated version
- Core concepts from `pageDescription` (tool function, format, key benefit) must appear
- If `pageDescription` was updated in Step 5 with new concepts, `meta.description` may need updating too

**3. Top keyword coverage:**
- Identify the **3 most important transactional long-tail keywords** (those with highest search intent)
- Check if their core concepts appear in `meta.description`
- Google **bolds matching terms** in SERP snippets — having keyword concepts in meta.description increases CTR
- At minimum, the primary tool action + "free" + "online" should appear

**Output a meta.description status block:**

```
### meta.description Check
- **Current**: "Convert Base64 to GIF online. Decode Base64 and save as GIF image. Free converter tool with preview support for animated GIFs."
- **Length**: 130 chars (TOO SHORT — target 150-160)
- **Coherence**: Missing "no registration" concept added to pageDescription
- **Top-3 keywords covered**: 2/3 — missing "instant preview" concept
- **Status**: NEEDS UPDATE
```

### Step 5: FIX — Enrich content for uncovered keywords AND fix meta.description

#### 5A: Fix keyword coverage gaps

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

#### 5B: Fix meta.description

If Step 4B found issues, rewrite `meta.description` following these rules:

**Writing rules:**
1. **Length**: MUST be 150-160 characters (count carefully before applying)
2. **Structure**: `[Primary action] + [key benefit] + [differentiator]. [Secondary benefit] + [soft CTA].`
3. **Must include**: tool primary action, "free", "online", and 1-2 concepts from top transactional long-tail keywords
4. **Must be coherent** with `pageDescription` — same messaging, shorter form
5. **Must NOT be**: a truncated copy of `pageDescription`, generic filler, or keyword-stuffed

**Template patterns (adapt per tool type):**

For **converters**:
```
"Convert [input] to [output] online free. [Key feature] with instant preview and download. [Differentiator]. No signup required."
```

For **generators**:
```
"Generate [output type] online free. [Key feature] with [customization option]. [Differentiator]. No signup required."
```

For **formatters/validators**:
```
"[Action] [format] online free. [Key feature] with [benefit]. [Differentiator]. No signup required."
```

**Process:**
1. Draft new `meta.description` following the rules
2. Count characters (MUST be 150-160)
3. Verify it includes concepts from the top 3 transactional long-tail keywords
4. Verify coherence with `pageDescription`
5. Apply the edit to the i18n JSON file

**Example fix:**
```
BEFORE (130 chars — too short):
"Convert Base64 to GIF online. Decode Base64 and save as GIF image. Free converter tool with preview support for animated GIFs."

AFTER (158 chars — optimal):
"Convert Base64 to GIF online free with instant preview and download. Decode animated GIFs in your browser — no signup or upload required. Secure and fast."
```

---

## Output Format

After running all 5 steps, output:

```
## Long-Tail SEO Report: [tool-id]

### Web Research Summary
- **Searches performed**: 5
- **Raw candidates found**: N keywords
- **Sources**: Google autocomplete (X), People Also Ask (Y), Related searches (Z), Competitor analysis (W)

### Keywords Added (12)
| # | Keyword | Source | Intent |
|---|---|---|---|
| 1 | keyword from autocomplete | Google autocomplete | transactional |
| 2 | keyword from PAA | People Also Ask | informational |
...

### Coverage Check
| # | Long-Tail Keyword | Source | Status | Found In |
|---|---|---|---|---|
| 1 | keyword one | Google autocomplete | COVERED | pageDescription |
| 2 | keyword two | People Also Ask | FIXED | Added to instructions.features |
...

### meta.description Check
- **Current**: "..." (N chars)
- **Length**: N chars — STATUS
- **Coherence**: OK / Missing concept X
- **Top-3 keyword coverage**: N/3
- **Action**: NONE / REWRITTEN (old → new, N chars)

### Summary
- Total: 12 keywords
- From web research: X/12
- Pattern-generated: Y/12
- Covered: X/12
- Fixed: Y/12
- Coverage: 100%
- meta.description: OK / FIXED (old length → new length)

### Content Changes Made
- [file]: added "phrase" to [field]
- [file]: rewrote meta.description (N chars → M chars)
```

---

## Audit Mode (`--audit`)

When run with `--audit`, check ALL tools that already have `longTailKeywords` defined:

1. Read all tool entries from `lib/tools.ts` that have `longTailKeywords`
2. For each, run Step 4A (keyword coverage) AND Step 4B (meta.description health check)
3. Output a summary table:

```
| Tool | Keywords | Covered | Gaps | meta.description | Length | Status |
|---|---|---|---|---|---|---|
| base64-to-jpg | 12 | 12 | 0 | 147 chars | SLIGHTLY SHORT | OK |
| lorem-ipsum | 12 | 11 | 1 | 157 chars | OPTIMAL | OK |
| base64-to-gif | 12 | 12 | 0 | 130 chars | TOO SHORT | NEEDS FIX |
```

4. For any keyword gaps found, run Step 5A (FIX content)
5. For any meta.description issues found, run Step 5B (FIX meta.description)

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
| `lib/i18n/dictionaries/en/tools/[tool-id].json` | `pageDescription`, `instructions` enriched (if keyword gaps found); `meta.description` rewritten (if length/coherence issues found) |

**Files NOT modified** (automatic pipeline handles them):
- `app/tools/[tool]/page.tsx` — reads `longTailKeywords` automatically for meta tags
- `app/[locale]/tools/[tool]/page.tsx` — same
- `lib/tool-schema.ts` — reads `longTailKeywords` automatically for JSON-LD
