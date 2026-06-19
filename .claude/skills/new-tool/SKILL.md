---
name: new-tool
description: Scaffold completo per un nuovo tool in ToolsLab. Segue i 13 step obbligatori definiti in CLAUDE.md. Invoca con /new-tool [tool-id] [Tool Name] [category].
---

# /new-tool — Scaffold Nuovo Tool ToolsLab

Sei stato invocato per creare un nuovo tool in ToolsLab. Segui i 13 step in ordine senza saltarne nessuno. Al termine, invoca automaticamente il subagent `tool-completeness-reviewer` per verificare che nulla sia mancante.

## Parametri attesi

L'utente deve fornire:

- **tool-id**: slug kebab-case (es. `json-diff`)
- **Tool Name**: nome display (es. `JSON Diff`)
- **category**: una tra `data`, `encoding`, `base64`, `text`, `generators`, `web`, `dev`, `formatters`, `pdf`
- **descrizione breve** del tool (opzionale, puoi chiederla)

Se l'utente non ha fornito questi dati, chiedili prima di procedere.

> ⚠️ **Architettura aggiornata.** I vecchi file `lib/tool-seo.ts` e `lib/tool-instructions.ts` **NON esistono più** — eliminati. Tutto il contenuto SEO (`tagline`, `pageDescription`, `meta`) e le `instructions` ora vivono nei file i18n per-tool (`lib/i18n/dictionaries/{locale}/tools/TOOL_ID.json`). La sitemap è **rigenerata via script**, non editata a mano.

---

## STEP 1 — Registra in `/lib/tools.ts`

Aggiungi il tool al registry centrale. Usa questo template:

```typescript
{
  id: 'TOOL_ID',
  name: 'Tool Name',
  description: 'Descrizione breve e chiara del tool',
  icon: '📋',           // scegli emoji appropriata (usata per OG/Twitter image)
  route: '/tools/TOOL_ID',
  categories: ['CATEGORY'],
  keywords: ['keyword1', 'keyword2', 'TOOL_ID'],
  isPopular: false,
  searchVolume: 1000,   // stima volume ricerca mensile
  label: '',            // SEMPRE stringa vuota per nuovi tool
},
```

**⚠️ REGOLE:**
- `label` deve essere sempre `''`. Mai usare `'new'`.
- **NON aggiungere `longTailKeywords` qui.** `lib/tools.ts` è bundlato client-side; long-tail vanno in `lib/tools-seo.ts` (server-only). Vedi STEP 9.
- Aggiungi anche l'icona SVG: mappa `TOOL_ID` → componente Lucide in `lib/tool-icons.ts` (UI usa `components/ui/ToolIcon.tsx`).

---

## STEP 2 — Implementa la logica in `lib/tools/TOOL_ID.ts`

```typescript
export interface ToolNameResult {
  success: boolean;
  result?: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

export function processToolName(input: string, options?: Record<string, unknown>): ToolNameResult {
  try {
    if (!input) {
      return { success: false, error: 'Input required' };
    }
    const result = /* logica principale */;
    return { success: true, result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
```

Funzioni pure, TypeScript strict, Zod per validazione runtime dove serve.

---

## STEP 3 — Crea i test in `__tests__/unit/tools/TOOL_ID.test.ts`

```typescript
import { processToolName } from '@/lib/tools/TOOL_ID';

describe('Tool Name', () => {
  it('processes valid input', () => {
    /* ... */
  });
  it('handles empty input', () => {
    /* ... */
  });
  it('handles malformed input', () => {
    /* ... */
  });
  // Edge cases: null, undefined, unicode, very large input
});
```

Coverage minima: 80% branches, functions, lines.

---

## STEP 4 — Crea il componente UI in `components/tools/implementations/ToolName.tsx`

Template base con hydration, analytics e auto-scroll:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useToolStore } from '@/lib/store/toolStore';
import { useHydration } from '@/lib/hooks/useHydration';
import { useScrollToResult } from '@/lib/hooks/useScrollToResult';
import { processToolName } from '@/lib/tools/TOOL_ID';

export default function ToolName() {
  const isHydrated = useHydration();
  const { addToHistory } = useToolStore();
  const { resultRef, scrollToResult } = useScrollToResult({ onlyIfNotVisible: false });

  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');

  // Auto-scroll quando output cambia
  useEffect(() => {
    if (output) scrollToResult();
  }, [output, scrollToResult]);

  const handleProcess = () => {
    const startTime = Date.now(); // ⚠️ timestamp PRIMA del processing
    const result = processToolName(input);

    if (result.success) {
      setOutput(result.result ?? '');
      setError('');
      // ✅ Analytics auto-tracking
      addToHistory({
        id: crypto.randomUUID(),
        tool: 'TOOL_ID', // DEVE matchare ID in tools.ts
        input,
        output: result.result ?? '',
        timestamp: startTime,
      });
    } else {
      setError(result.error ?? 'Error');
    }
  };

  return (
    <div>
      {/* Input area */}
      <textarea value={input} onChange={e => setInput(e.target.value)} />
      <button onClick={handleProcess}>Process</button>

      {/* Output area - ref per auto-scroll */}
      <div ref={resultRef}>
        {error && <p className="text-red-500">{error}</p>}
        {output && <pre>{output}</pre>}
      </div>
    </div>
  );
}
```

**⚠️ Se usi `useToolStore` o `useCrontabStore`**: aggiungi sempre `useHydration` e accedi ai dati con pattern `isHydrated ? data : []`. Senza questo → React Error #425 in produzione.

Il componente DEVE includere:
- `useHydration` se accede allo store
- `addToHistory()` con `timestamp` = inizio processing (analytics auto-tracking)
- `useScrollToResult({ onlyIfNotVisible: false })` + `useEffect` su output (auto-scroll)

---

## STEP 5 — Registra in `components/tools/LazyToolLoader.tsx`

```typescript
const toolComponents = {
  // ... tool esistenti
  'TOOL_ID': lazy(() => import('./implementations/ToolName')),
};
```

---

## STEP 6 — 🚨 CRITICO: Registra in `/lib/i18n/load-tools.ts`

```typescript
const toolIds = [
  // ... tool esistenti
  'TOOL_ID', // ⚠️ DEVE matchare l'ID in tools.ts
];
```

**Se dimentichi questo step, le traduzioni non vengono caricate e il tool mostra testi generici!**

---

## STEP 7 — Crea traduzioni + SEO + istruzioni per tutte le 6 lingue

Crea un file JSON in `/lib/i18n/dictionaries/{en,it,es,fr,de,pt}/tools/TOOL_ID.json` per **ciascuna** delle 6 lingue. Questo file contiene TUTTO: UI, SEO content e instructions (i vecchi `lib/tool-seo.ts` / `lib/tool-instructions.ts` non esistono più).

```json
{
  "title": "Tool Name",
  "description": "Descrizione tradotta",
  "placeholder": "Enter your input...",
  "meta": {
    "title": "Tool Name - Free Online Tool | ToolsLab",
    "description": "SEO description tradotta (max 160 char), keyword principale nelle prime 15 parole"
  },
  "tagline": "Verb + funzione + beneficio (8-12 parole)",
  "pageDescription": "Cosa fa + per chi + perché è meglio + CTA soft (30-70 parole). Includi 'free', 'secure', 'browser-based'.",
  "instructions": {
    "title": "How to use Tool Name",
    "steps": [
      { "title": "Step 1", "description": "Descrizione SPECIFICA per questo tool, non generica" }
    ],
    "features": ["Feature tecnica 1", "Feature tecnica 2"],
    "useCases": ["Use case reale 1", "Use case reale 2"],
    "proTips": ["Tip avanzato 1"],
    "troubleshooting": ["Problema comune 1 e soluzione"]
  }
}
```

**Requisiti contenuti:**
- `instructions.steps`: minimo 4 step, tool-specifici (mai "Enter your data" generico)
- `features`: 4-8 capacità tecniche uniche
- `useCases`: 5-8 scenari reali
- `proTips`: 4-6 consigli avanzati
- `troubleshooting`: 3-5 problemi comuni (obbligatorio per tool complessi)
- `placeholder`: esente per pure-generator (vedi `/i18n-check` per la lista esentati)

**Lingue richieste**: `en`, `it`, `es`, `fr`, `de`, `pt` — tutte e 6 obbligatorie.

---

## STEP 8 — Verifica routing (nessuna azione richiesta)

❌ NON creare `app/tools/TOOL_ID/page.tsx`
✅ Il sistema dinamico `app/tools/[tool]/page.tsx` gestisce il routing automaticamente.

---

## STEP 9 — (Opzionale) Long-tail keywords in `/lib/tools-seo.ts`

Se vuoi aggiungere long-tail keyword EN per il tool, **NON** metterli in `lib/tools.ts`. Invece:

1. Apri `lib/tools-seo.ts` (file con `import 'server-only'`)
2. Aggiungi entry nel mapping `toolLongTailKeywords`:

```typescript
export const toolLongTailKeywords: Record<string, string[]> = {
  // ... entry esistenti ...
  'TOOL_ID': [
    'how to convert X online free',
    'best free X tool',
    // ... 8-12 frasi
  ],
};
```

**Motivazione:** `lib/tools.ts` è importato da `SearchBar`, `Header`, `HeroSection`, `CategoryGrid`, `ToolLayout` (tutti `'use client'`). Webpack bundles il modulo intero in ogni route chunk client. Mettere longTailKeywords in `tools.ts` ha causato regressione INP mobile aprile 2026 (CrUX p75 225ms). Il file `tools-seo.ts` ha `import 'server-only'` → Webpack errore se importato accidentalmente da client.

Lo skill `/long-tail-seo` (con multilingua) gestisce automaticamente il file giusto. Per long-tail in lingue non-EN, vanno in `lib/i18n/dictionaries/{locale}/tools/TOOL_ID.json`.

---

## STEP 10 — 🔍 SEO obbligatorio: programmatic-seo + seo-audit

Dopo lo scaffold, esegui in ordine (vedi CLAUDE.md sezione "SEO OBBLIGATORIO dopo /new-tool"):

1. **`programmatic-seo`** — ottimizza `meta.title`, `meta.description`, `tagline`, `pageDescription` e keywords usando il playbook. Aggiorna i file i18n (almeno EN, idealmente tutte 6).
2. **`seo-audit`** — verifica: tool in sitemap, schema JSON-LD corretto (`lib/tool-schema.ts`), canonical/hreflang presenti, OG/Twitter con meta description ottimizzata.

---

## STEP 11 — 🚨 Rigenera la sitemap (via script, NON a mano)

La sitemap è composta da file statici in `public/` rigenerati da uno script. **NON editare a mano i file XML** — perderesti la logica anti-churn `lastmod` e la priority auto-assegnata da `searchVolume`.

```bash
npm run sitemap:generate    # legge lib/tools.ts → riscrive public/sitemap-{en,it,es,fr,de,pt}.xml + sitemap.xml
npm run sitemap:validate
```

Verifica finale:

```bash
grep -c "TOOL_ID" public/sitemap-en.xml  # deve restituire > 0
```

Poi committa i file `public/sitemap-*.xml` modificati.

---

## STEP 12 — Type-check + verifica build

Nessun hook automatico configurato. Esegui manualmente:

```bash
npm run type-check
npm run test:unit -- TOOL_ID    # i test creati allo STEP 3
```

Analytics e auto-scroll sono già verificati allo STEP 4 (se hai usato `addToHistory()` e `useScrollToResult`).

---

## STEP 13 — Verifica finale con tool-completeness-reviewer

Dopo aver completato tutti gli step, di' all'utente:

> "Scaffold completato. Invoco il tool-completeness-reviewer per verifica finale."

Poi invoca il subagent `tool-completeness-reviewer` passandogli il tool-id.

---

## Checklist finale

Prima di considerare il tool completo, verifica:

- [ ] `lib/tools.ts` — tool registrato con `label: ''` (NIENTE longTailKeywords qui!)
- [ ] `lib/tool-icons.ts` — icona Lucide mappata per TOOL_ID
- [ ] `lib/tools/TOOL_ID.ts` — logica implementata (funzione pura)
- [ ] `__tests__/unit/tools/TOOL_ID.test.ts` — test creati, coverage ≥80%
- [ ] `components/tools/implementations/ToolName.tsx` — componente con hydration, analytics, auto-scroll
- [ ] `components/tools/LazyToolLoader.tsx` — tool registrato nel lazy loader
- [ ] `lib/i18n/load-tools.ts` — tool ID aggiunto ⚠️
- [ ] `lib/i18n/dictionaries/{en,it,es,fr,de,pt}/tools/TOOL_ID.json` — 6 file con UI + meta + tagline + pageDescription + instructions
- [ ] (Opzionale) `lib/tools-seo.ts` — entry in `toolLongTailKeywords` se aggiungi long-tail EN
- [ ] `programmatic-seo` + `seo-audit` eseguiti
- [ ] `npm run sitemap:generate` eseguito + `public/sitemap-*.xml` committati ⚠️
- [ ] `npm run type-check` pulito
