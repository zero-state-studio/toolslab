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

---

## STEP 1 — Registra in `/lib/tools.ts`

Aggiungi il tool al registry centrale. Usa questo template:

```typescript
{
  id: 'TOOL_ID',
  name: 'Tool Name',
  description: 'Descrizione breve e chiara del tool',
  icon: '📋',           // scegli emoji appropriata
  route: '/tools/TOOL_ID',
  categories: ['CATEGORY'],
  keywords: ['keyword1', 'keyword2', 'TOOL_ID'],
  isPopular: false,
  searchVolume: 1000,   // stima volume ricerca mensile
  label: '',            // SEMPRE stringa vuota per nuovi tool
},
```

**⚠️ REGOLA**: `label` deve essere sempre `''`. Mai usare `'new'`.

---

## STEP 2 — Crea contenuti SEO in `/lib/tool-seo.ts`

```typescript
{
  id: 'TOOL_ID',
  tagline: 'Verb + funzione + beneficio (8-12 parole)',
  seoDescription: 'Cosa fa + per chi + perché è meglio + CTA soft (30-70 parole). Includi "free", "secure", "browser-based". Keyword principale nelle prime 15 parole.',
},
```

---

## STEP 3 — Definisci istruzioni in `/lib/tool-instructions.ts`

```typescript
{
  id: 'TOOL_ID',
  title: 'How to use Tool Name',
  steps: [
    { title: 'Step 1', description: 'Descrizione specifica per questo tool' },
    { title: 'Step 2', description: '...' },
    { title: 'Step 3', description: '...' },
    // 3-5 step specifici, NON generici
  ],
  features: [
    'Feature tecnica 1',
    'Feature tecnica 2',
    // 4-8 features uniche del tool
  ],
  useCases: [
    'Use case reale 1',
    'Use case reale 2',
    // 5-8 scenari reali
  ],
  proTips: [
    'Tip avanzato 1',
    // 4-6 pro tips
  ],
  troubleshooting: [
    'Problema comune 1 e soluzione',
    // 3-5 problemi comuni
  ],
  // keyboardShortcuts: opzionale se il tool ha shortcuts
},
```

---

## STEP 4 — Crea i test in `__tests__/unit/tools/TOOL_ID.test.ts`

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

## STEP 5 — Implementa la logica in `lib/tools/TOOL_ID.ts`

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

---

## STEP 6 — Crea il componente UI in `components/tools/implementations/ToolName.tsx`

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

**⚠️ Se usi `useToolStore` o `useCrontabStore`**: aggiungi sempre `useHydration` e accedi ai dati con pattern `isHydrated ? data : []`.

---

## STEP 7 — Registra in `components/tools/LazyToolLoader.tsx`

```typescript
const toolComponents = {
  // ... tool esistenti
  TOOL_ID: lazy(() => import('./implementations/ToolName')),
};
```

---

## STEP 8 — 🚨 CRITICO: Registra in `/lib/i18n/load-tools.ts`

```typescript
const toolIds = [
  // ... tool esistenti
  'TOOL_ID', // ⚠️ DEVE matchare l'ID in tools.ts
];
```

**Se dimentichi questo step, le traduzioni non vengono caricate e il tool mostra testi generici!**

---

## STEP 9 — Crea traduzioni per tutte le 6 lingue

Crea i file JSON in `/lib/i18n/dictionaries/{en,it,es,fr,de,pt}/tools/TOOL_ID.json`:

```json
{
  "title": "Tool Name",
  "description": "Descrizione tradotta",
  "placeholder": "Enter your input...",
  "meta": {
    "title": "Tool Name - Free Online Tool | ToolsLab",
    "description": "SEO description tradotta (max 160 char)"
  },
  "tagline": "Tagline tradotta",
  "pageDescription": "Descrizione pagina tradotta",
  "instructions": {
    "steps": [...],
    "features": [...],
    "useCases": [...],
    "proTips": [...],
    "troubleshooting": [...]
  }
}
```

**Lingue richieste**: `en`, `it`, `es`, `fr`, `de`, `pt` — tutte e 6 obbligatorie.

---

## STEP 10 — Verifica routing (nessuna azione richiesta)

❌ NON creare `app/tools/TOOL_ID/page.tsx`
✅ Il sistema dinamico `app/tools/[tool]/page.tsx` gestisce il routing automaticamente.

---

## STEP 11 — Verifica sitemap (nessuna azione richiesta)

La sitemap viene aggiornata automaticamente leggendo `/lib/tools.ts` a ogni build.

---

## STEP 12 — Analytics (verificato al STEP 6)

Se hai usato `addToHistory()` nel componente, il tracking è automatico. Nessuna altra azione richiesta.

---

## STEP 13 — Auto-scroll (verificato al STEP 6)

Se hai usato `useScrollToResult` con `onlyIfNotVisible: false` nel componente, è a posto.

---

## Checklist finale

Prima di considerare il tool completo, verifica:

- [ ] `lib/tools.ts` — tool registrato con `label: ''`
- [ ] `lib/tool-seo.ts` — tagline e seoDescription presenti
- [ ] `lib/tool-instructions.ts` — steps, features, useCases, proTips, troubleshooting
- [ ] `__tests__/unit/tools/TOOL_ID.test.ts` — test creati
- [ ] `lib/tools/TOOL_ID.ts` — logica implementata
- [ ] `components/tools/implementations/ToolName.tsx` — componente con hydration, analytics, auto-scroll
- [ ] `components/tools/LazyToolLoader.tsx` — tool registrato nel lazy loader
- [ ] `lib/i18n/load-tools.ts` — tool ID aggiunto ⚠️
- [ ] `lib/i18n/dictionaries/{en,it,es,fr,de,pt}/tools/TOOL_ID.json` — 6 file JSON

Dopo aver completato tutti gli step, di' all'utente:

> "Scaffold completato. Invoco il tool-completeness-reviewer per verifica finale."

Poi invoca il subagent `tool-completeness-reviewer` passandogli il tool-id.
