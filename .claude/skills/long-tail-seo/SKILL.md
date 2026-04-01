---
name: long-tail-seo
description: "Research, assign, and verify long-tail SEO keywords for ToolsLab tools. Supports EN and all 5 other locales (it, es, fr, de, pt). Uses real web research in the target language for data-driven keyword selection. Triggers: 'long-tail keywords', 'keyword research for tool', 'SEO keywords for [tool]', 'check keyword coverage', 'add long-tail to [tool]', 'long-tail italiano', 'long-tail per tutte le lingue'."
metadata:
  version: 3.1.0
---

# /long-tail-seo — Long-Tail Keyword Research & Verification (Multilingual)

Automated workflow for researching, assigning, and verifying long-tail SEO keywords for ToolsLab tools. **Uses real web research in the target language** (Google autocomplete, People Also Ask, competitor analysis, related searches). Ensures keywords are both stored AND covered in visible page content for every locale.

## Usage

```
/long-tail-seo [tool-id]                        # EN only (default, backwards compatible)
/long-tail-seo [tool-id] --locale it            # Single locale (it, es, fr, de, pt)
/long-tail-seo [tool-id] --locale en            # EN explicit (same as default)
/long-tail-seo [tool-id] --all                  # EN + all 5 other locales

/long-tail-seo --audit                          # Audit EN for all tools with existing keywords
/long-tail-seo --audit --locale it              # Audit IT for all tools
/long-tail-seo --audit --all                    # Audit all locales for all tools

/long-tail-seo --find-missing                   # Tools without EN longTailKeywords
/long-tail-seo --find-missing --locale it       # Tools without IT longTailKeywords
/long-tail-seo --find-missing --all             # Tools missing keywords in any locale
```

---

## Architecture

### Where long-tail keywords live

```
EN (existing):
  lib/tools.ts                                        → longTailKeywords: string[]
  lib/i18n/dictionaries/en/tools/[tool-id].json       → pageDescription, instructions, meta.description

Non-EN locales (new):
  lib/i18n/dictionaries/{it,es,fr,de,pt}/tools/[tool-id].json → longTailKeywords: string[]
                                                               → pageDescription, instructions, meta.description
```

**Why different storage for EN vs non-EN?**
EN keywords live in `tools.ts` for backwards compatibility (already injected into meta tags and JSON-LD automatically). Non-EN keywords live in the locale dictionary file — same file that holds all other locale content, consistent with the i18n architecture.

### Locale configuration

| Locale | Language   | Search language | `meta.description` "free" equivalent |
|--------|-----------|-----------------|---------------------------------------|
| `en`   | English    | English         | "free"                                |
| `it`   | Italian    | Italian         | "gratuito" / "gratis"                 |
| `es`   | Spanish    | Spanish         | "gratis" / "gratuito"                 |
| `fr`   | French     | French          | "gratuit" / "en ligne"                |
| `de`   | German     | German          | "kostenlos" / "gratis"                |
| `pt`   | Portuguese | Portuguese      | "grátis" / "gratuito"                 |

### SEO weight of each location

| Location | SEO Weight | Why |
|---|---|---|
| `pageDescription` (visible text) | **HIGH** | Google indexes visible content |
| `meta.description` | **HIGH** | Controls SERP snippet (Google bolds matching terms) |
| `instructions` (steps, features, useCases) | **HIGH** | Visible, indexable content |
| H1/H2 headings | **HIGH** | Strong ranking signal |
| `longTailKeywords` in dict/tools.ts | **LOW** | Strategic inventory; value comes from visible content |
| `<meta name="keywords">` tag | **ZERO** | Google ignores since 2009 |

---

## Workflow: 5 Steps

Run these 5 steps for each locale being processed. For `--all`, run the full workflow for EN first, then each non-EN locale sequentially.

### Step 1: GATHER — Read tool and locale data

1. Read tool `name`, `description`, `keywords`, `searchVolume` from `lib/tools.ts`
2. If **EN**: read `pageDescription`, `tagline`, `meta.description`, `instructions` from `lib/i18n/dictionaries/en/tools/[tool-id].json`
3. If **non-EN**: read same fields from `lib/i18n/dictionaries/{locale}/tools/[tool-id].json`
4. Check if `longTailKeywords` already exists in the target location (tools.ts for EN, locale JSON for non-EN)
5. Note the tool's core function, input/output, unique features, and target audience
6. For non-EN, also read the EN version to understand the base content and intent
7. **🔍 Language integrity check (MANDATORY)** — For each field (`tagline`, `pageDescription`, `meta.description`, `meta.title`, all `instructions.*` strings), verify:
   - **Wrong language**: Text is in a different language than the target locale (e.g., Italian text in the ES/FR/DE/PT file). Flag as `WRONG_LANGUAGE`.
   - **Broken/mixed language**: Text mixes the target language with English or another language unnaturally (e.g., "Professioneller Farbe Wähler für developers mit HEX formats"). Flag as `BROKEN_LANGUAGE`.
   - **Generic template content**: Instructions are not tool-specific — they use generic phrases like "Paste your content", "Configure options", "Review the output" that could apply to any tool. Flag as `GENERIC_CONTENT`.

   Report all issues found in a **Language Integrity Report** block before proceeding to Step 2:
   ```
   ### Language Integrity Report ([locale])
   - tagline: OK / WRONG_LANGUAGE (found: Italian) / BROKEN_LANGUAGE
   - pageDescription: OK / WRONG_LANGUAGE (found: Italian) / BROKEN_LANGUAGE
   - meta.description: OK / WRONG_LANGUAGE / BROKEN_LANGUAGE / TOO SHORT / TOO LONG
   - meta.title: OK / WRONG_LANGUAGE
   - instructions.steps: OK / GENERIC_CONTENT / WRONG_LANGUAGE
   - instructions.features: OK / GENERIC_CONTENT / WRONG_LANGUAGE
   - instructions.useCases: OK / GENERIC_CONTENT / WRONG_LANGUAGE
   - instructions.proTips: OK / GENERIC_CONTENT / WRONG_LANGUAGE
   - instructions.troubleshooting: OK / GENERIC_CONTENT / WRONG_LANGUAGE
   ```

   Any field flagged here MUST be rewritten in Step 5, regardless of keyword coverage results.

### Step 2: RESEARCH — Web research in the target language

**This is the critical step. Do NOT translate EN keywords — research native-language queries.**

Run **5 parallel web searches** using the WebSearch tool. All queries must be in the target language.

#### Search 1: Autocomplete-style queries
```
EN:  "[tool name] online free" OR "[tool name] generator online"
IT:  "[nome strumento] online gratis" OR "[nome strumento] gratuito"
ES:  "[nombre herramienta] online gratis" OR "[nombre herramienta] gratuito"
FR:  "[nom outil] en ligne gratuit" OR "[nom outil] gratuit"
DE:  "[werkzeug name] online kostenlos" OR "[werkzeug name] kostenlos"
PT:  "[nome ferramenta] online grátis" OR "[nome ferramenta] gratuito"
```

#### Search 2: How-to / informational queries
```
EN:  "how to [primary action]" OR "[tool name] how to use"
IT:  "come [azione principale]" OR "come usare [nome strumento]"
ES:  "cómo [acción principal]" OR "cómo usar [nombre herramienta]"
FR:  "comment [action principale]" OR "comment utiliser [nom outil]"
DE:  "wie [hauptaktion]" OR "wie man [werkzeug name] verwendet"
PT:  "como [ação principal]" OR "como usar [nome ferramenta]"
```

#### Search 3: Competitor and alternative queries
```
EN:  "best free [tool name] online" OR "[tool name] alternative"
IT:  "migliore [nome strumento] online gratis" OR "[nome strumento] alternativa"
ES:  "mejor [nombre herramienta] online gratis" OR "[nombre herramienta] alternativa"
FR:  "meilleur [nom outil] gratuit en ligne" OR "[nom outil] alternative"
DE:  "bestes [werkzeug name] online kostenlos" OR "[werkzeug name] alternative"
PT:  "melhor [nome ferramenta] online grátis" OR "[nome ferramenta] alternativa"
```

#### Search 4: Use-case specific queries (in target language)
```
Adapt to the tool type and target language. Examples for JSON Formatter:
EN:  "json formatter for developers" / "format json without software"
IT:  "formattare json senza installare nulla" / "json formatter per sviluppatori"
ES:  "formatear json sin instalar software" / "validar json online"
```

#### Search 5: Format/feature-specific queries (in target language)
```
Adapt to the tool's unique features. Examples for base64 converters:
EN:  "convert base64 to image online" / "decode base64 string instantly"
IT:  "convertire base64 in immagine online" / "decodificare base64 gratis"
ES:  "convertir base64 a imagen online" / "decodificar base64 gratis"
```

**How to adapt by tool type (apply in any language):**
- **Converters**: Focus on format pairs + "converti/convertir/convert X in/a/to Y online"
- **Generators**: Focus on "genera/genera/generate X online", "generatore/generador/generator X"
- **Formatters**: Focus on "formatta/formatear/format X online", "abbellire/embellecer/beautify X"
- **Validators**: Focus on "valida/validar/validate X online", "verifica/verificar/check X"
- **Encoders/Decoders**: Focus on "codifica/codificar/encode X gratis", "decodifica/decodificar/decode"

**Processing web results:**
1. Extract autocomplete suggestions (real high-volume queries)
2. Extract "People Also Ask" / "Le persone chiedono anche" / "La gente también pregunta" questions
3. Extract related searches at bottom of SERP
4. Note competitor page titles and H1s in the target language
5. Note any forum/Reddit/Stack Overflow queries in that language

### Step 3: SELECT & ASSIGN — Choose 12 keywords and store them

From web research, select **12 best long-tail keywords** using:

**Selection criteria (priority order):**
1. **Found in real search results** in the target language — highest priority
2. **Contains 3-6 words** (true long-tail territory; Italian/German/FR tend to be shorter than EN)
3. **Clear search intent** (transactional, informational, or navigational)
4. **Natural phrasing** in that language (how a native speaker types in Google)
5. **Diverse intent mix:**
   - 4 transactional (`[tool] online gratis`, `[tool] senza registrazione`)
   - 3 informational (`come [azione]`, `cos'è [strumento]`)
   - 3 feature-specific (`[tool] con [funzione]`, `[tool] per [caso d'uso]`)
   - 2 comparison/alternative (`miglior [tool] gratuito`, `[tool] senza [limitazione]`)

**Store keywords:**

For **EN** — add to `lib/tools.ts`:
```typescript
longTailKeywords: [
  'json formatter online free',
  'how to format json online',
  // ... 10 more
],
```

For **non-EN** — add to `lib/i18n/dictionaries/{locale}/tools/[tool-id].json`:
```json
{
  "longTailKeywords": [
    "formattatore json online gratis",
    "come formattare json online",
    "validare json senza registrazione",
    ...
  ],
  "pageDescription": "...",
  "meta": { ... }
}
```

**Rules:**
- Always 12 keywords per locale
- Keywords MUST be in the target language (not translated EN keywords)
- No duplicates within the same locale's keyword list
- At least 8 of 12 must come directly from web research findings
- Maximum 4 can be pattern-generated (for intent coverage not found in search)

### Step 4: VERIFY — Cross-check coverage AND meta.description health

#### 4A: Keyword coverage check

For each of the 12 keywords, check if the key concepts appear in the locale's visible content:
1. `pageDescription`
2. `meta.description`
3. `tagline`
4. `instructions.steps[].description`
5. `instructions.features[]`
6. `instructions.useCases[]`
7. `instructions.proTips[]`

**Verification rules:**
- A keyword is "covered" if its 2-3 most distinctive concepts appear in visible content
- Example (IT): `"formattatore json online gratis"` → check for "formattatore" + "online" + "gratis/gratuito"
- Generic words ("il", "la", "di", "the", "de", "le") don't count
- Exact phrase not required — conceptual coverage is sufficient

**Coverage table:**
```
| Long-Tail Keyword | Source | Status | Found In |
|---|---|---|---|
| formattatore json online gratis | Google IT autocomplete | COVERED | pageDescription |
| come formattare json velocemente | People Also Ask IT | NOT COVERED | missing from instructions |
```

#### 4B: meta.description health check

**1. Length check:**
- Target: **150-160 characters** (universal across all languages)
- Under 130 = TOO SHORT
- 130-149 = SLIGHTLY SHORT
- 150-160 = OPTIMAL
- Over 160 = TOO LONG

**2. Language quality check (for non-EN):**
- Must be fluent, natural prose in the target language
- NOT a literal translation of the EN meta.description
- Should use natural phrasing a native speaker would use
- Must include the locale's "free" equivalent naturally (gratis/gratuit/kostenlos/grátis)

**3. Top-3 keyword coverage:**
- Identify the 3 most important transactional keywords for this locale
- Check if their core concepts appear in meta.description
- Google bolds matching terms in SERP → having keywords in meta.description increases CTR

**meta.description status block:**
```
### meta.description Check (IT)
- **Current**: "Formatta, valida e abbellisci dati JSON con evidenziazione sintassi..." (88 chars)
- **Length**: 88 chars — TOO SHORT (target 150-160)
- **Language quality**: OK — natural Italian
- **Top-3 keywords covered**: 1/3 — missing "online gratis" and "senza registrazione"
- **Status**: NEEDS UPDATE
```

#### 4C: Language integrity re-check

Re-verify all fields flagged in Step 1's Language Integrity Report. Additionally, for any content that was NOT flagged in Step 1 but was modified during Step 3 (keyword assignment), verify the modifications didn't introduce language issues.

**This check catches:**
- Fields that were in the wrong language from the start (flagged in Step 1)
- Fields where generic template content makes keyword coverage impossible (flagged in Step 1)
- Any regression introduced by keyword-related edits

**Output:**
```
### Language Integrity Status ([locale])
| Field | Step 1 Flag | Current Status | Action Needed |
|-------|-------------|----------------|---------------|
| tagline | WRONG_LANGUAGE (Italian) | NEEDS REWRITE | Rewrite in [locale] in Step 5C |
| pageDescription | OK | OK | None |
| instructions.steps | GENERIC_CONTENT | NEEDS REWRITE | Rewrite tool-specific in Step 5C |
```

### Step 5: FIX — Enrich content and fix meta.description

#### 5A: Fix keyword coverage gaps

For each NOT COVERED keyword:
1. Identify the missing concept
2. Add it naturally to the most appropriate field in the locale's dictionary file
3. Priority order for additions:
   - `pageDescription` → core feature/benefit
   - `instructions.features[]` → specific capability
   - `instructions.useCases[]` → use case scenario
   - `instructions.proTips[]` → advanced usage
4. Never keyword-stuff — must read naturally in the target language
5. For non-EN: do NOT copy-translate from EN; write native content

#### 5B: Fix meta.description

If Step 4B found issues, rewrite following these rules:

**Universal rules (all languages):**
1. **Length**: MUST be 150-160 characters (count carefully)
2. **Include**: tool primary action + locale's "free" word + "online" + 1-2 top keyword concepts
3. **Tone**: persuasive, natural in the target language
4. **Must NOT be**: a translation of EN meta.description, truncated pageDescription, or keyword-stuffed

**Template patterns per language (adapt per tool type):**

```
EN:  "Convert [input] to [output] online free. [Key feature] with instant preview. [Differentiator]. No signup required."
IT:  "Converti [input] in [output] online gratis. [Funzione chiave] con anteprima istantanea. [Differenziatore]. Nessuna registrazione."
ES:  "Convierte [input] a [output] online gratis. [Función clave] con vista previa instantánea. [Diferenciador]. Sin registro."
FR:  "Convertir [input] en [output] en ligne gratuit. [Fonction clé] avec aperçu instantané. [Différenciateur]. Sans inscription."
DE:  "[Input] in [output] online kostenlos konvertieren. [Hauptfunktion] mit sofortiger Vorschau. [Unterscheidungsmerkmal]. Ohne Anmeldung."
PT:  "Converter [input] para [output] online grátis. [Função chave] com pré-visualização instantânea. [Diferenciador]. Sem cadastro."
```

#### 5C: Fix language integrity issues

For every field flagged in Step 1 / Step 4C, apply the appropriate fix:

**WRONG_LANGUAGE** — The field contains text in a completely different language:
1. Do NOT translate the existing text — it may be low-quality or generic
2. Read the EN version of the same field for intent reference
3. Write new, native content in the target language from scratch
4. Ensure the new text naturally includes relevant keyword concepts from Step 3

**BROKEN_LANGUAGE** — The field mixes the target language with English or has unnatural grammar:
1. Identify all non-native words and awkward constructions
2. Rewrite entirely in natural, fluent prose in the target language
3. Technical terms that are universally used in English are acceptable (e.g., "HEX", "RGB", "CSS", "API", "WCAG") — but surrounding prose must be native

**GENERIC_CONTENT** — Instructions are template boilerplate, not tool-specific:
1. Rewrite ALL instruction sections (steps, features, useCases, proTips, troubleshooting) to be specific to the tool's actual functionality
2. Steps should describe the tool's real workflow (not "paste content" → "configure" → "review output")
3. Features should list the tool's actual capabilities
4. Use cases should reflect real-world scenarios for the tool's target audience
5. Content must be in the target locale's language and naturally incorporate keyword concepts

**Output per fixed field:**
```
- [field]: [FLAG] → FIXED — Rewrote in [locale] with [N] keyword concepts integrated
```

---

## Output Format

```
## Long-Tail SEO Report: [tool-id] — [locale]

### Web Research Summary
- **Language**: [target language]
- **Searches performed**: 5
- **Raw candidates found**: N keywords
- **Sources**: Autocomplete (X), People Also Ask (Y), Related searches (Z), Competitor analysis (W)

### Language Integrity Report
- tagline: OK / WRONG_LANGUAGE / BROKEN_LANGUAGE
- pageDescription: OK / WRONG_LANGUAGE / BROKEN_LANGUAGE
- meta.description: OK / WRONG_LANGUAGE
- instructions: OK / GENERIC_CONTENT / WRONG_LANGUAGE
- **Issues found**: N fields need rewrite → will be fixed in Step 5C

### Keywords Added (12)
| # | Keyword | Source | Intent |
|---|---|---|---|
| 1 | keyword in target language | Google [locale] autocomplete | transactional |
| 2 | keyword in target language | People Also Ask | informational |
...

### Coverage Check
| # | Keyword | Source | Status | Found In |
|---|---|---|---|---|
| 1 | keyword one | autocomplete | COVERED | pageDescription |
| 2 | keyword two | PAA | FIXED | Added to instructions.features |

### meta.description Check
- **Current**: "..." (N chars)
- **Length**: N chars — STATUS
- **Language quality**: OK / Issues found
- **Top-3 keywords covered**: N/3
- **Action**: NONE / REWRITTEN → "new text" (N chars)

### Summary
- Keywords: 12 added (X from research, Y pattern-generated)
- Coverage: X/12 covered, Y/12 fixed
- meta.description: OK / FIXED (N chars → M chars)

### Files Modified
- `lib/tools.ts` → added longTailKeywords (EN only)
- `lib/i18n/dictionaries/[locale]/tools/[tool-id].json` → added longTailKeywords, enriched pageDescription, fixed meta.description
```

For `--all` mode, output one report per locale, then a final summary table:
```
## Summary: [tool-id] — All Locales

| Locale | Keywords | Coverage | meta.description | Status |
|--------|----------|----------|-----------------|--------|
| en     | 12       | 12/12    | 157 chars ✅    | OK     |
| it     | 12       | 11/12    | 152 chars ✅    | FIXED  |
| es     | 12       | 12/12    | 143 chars ⚠️   | FIXED  |
| fr     | 12       | 12/12    | 155 chars ✅    | OK     |
| de     | 12       | 10/12    | 158 chars ✅    | FIXED  |
| pt     | 12       | 12/12    | 149 chars ⚠️   | FIXED  |
```

---

## Audit Mode (`--audit [--locale xx] [--all]`)

**`--audit`** (EN): Check all tools that have `longTailKeywords` in `tools.ts`
**`--audit --locale it`**: Check all tools that have `longTailKeywords` in `dictionaries/it/tools/*.json`
**`--audit --all`**: Check all locales for all tools

For each tool, run Step 4A (coverage) AND Step 4B (meta.description health), then apply Step 5 fixes.

Audit summary table:
```
| Tool | Locale | Keywords | Covered | Gaps | meta.desc | Length | Status |
|------|--------|----------|---------|------|-----------|--------|--------|
| json-formatter | en | 12 | 12 | 0 | 157 chars | ✅ | OK |
| json-formatter | it | 12 | 11 | 1 | 88 chars  | ❌ | NEEDS FIX |
| lorem-ipsum    | en | 12 | 12 | 0 | 152 chars | ✅ | OK |
```

---

## Find Missing Mode (`--find-missing [--locale xx] [--all]`)

**`--find-missing`**: Tools in `tools.ts` without `longTailKeywords` (EN), sorted by searchVolume desc
**`--find-missing --locale it`**: Tools in `dictionaries/it/tools/` without `longTailKeywords` field
**`--find-missing --all`**: Full matrix — which tools are missing keywords in which locales

```
## Missing Long-Tail Keywords

| Tool | searchVolume | en | it | es | fr | de | pt |
|------|--------------|----|----|----|----|----|-----|
| fancy-text-generator | 82,000 | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| curl-to-code | 45,000 | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| color-picker | 33,000 | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
```

---

## Files Modified by This Skill

| File | When modified |
|------|--------------|
| `lib/tools.ts` | EN only — adds `longTailKeywords` array |
| `lib/i18n/dictionaries/en/tools/[tool-id].json` | EN — enriches `pageDescription`, `instructions`, `meta.description` |
| `lib/i18n/dictionaries/{it,es,fr,de,pt}/tools/[tool-id].json` | Non-EN — adds `longTailKeywords`, enriches `pageDescription`, `instructions`, `meta.description` |

**Files NOT modified** (automatic pipeline handles them):
- `app/tools/[tool]/page.tsx` — reads `longTailKeywords` from `tools.ts` automatically
- `app/[locale]/tools/[tool]/page.tsx` — same
- `lib/tool-schema.ts` — reads `longTailKeywords` from `tools.ts` for JSON-LD

---

## Integration with Other Skills

- **`seo-audit`** — Run first to check overall SEO health per locale, then long-tail-seo for keyword depth
- **`programmatic-seo`** — Use long-tail findings per locale to inform content strategy
- **`i18n-check`** — Run after long-tail-seo to verify all locale files are complete and consistent
- **`page-cro`** — Long-tail keywords inform what content drives conversions per market
