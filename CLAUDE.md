# CLAUDE.md - Standard Operativi per OctoTools

## 🤖 AUTOMAZIONI CLAUDE CODE ATTIVE

Progetto usa automazioni Claude Code per velocizzare sviluppo e garantire qualità. **Usale sempre.**

### 🔌 MCP Server: context7
Documentazione aggiornata librerie in uso (Next.js, Zustand, Zod, Radix UI, Tailwind, ecc.).
**Uso**: dubbi su API libreria → chiedi `use context7` nella query.
```
Esempio: "Come si usa useEffect in Next.js 14 App Router? use context7"
```

### 🎯 Skill: `/new-tool [tool-id] [Tool Name] [category]`
Scaffold automatico completo nuovo tool, segue 13 step obbligatori.
**Usa SEMPRE questa skill per nuovo tool.** Garantisce nessuno step saltato.
```
Esempio: /new-tool json-diff "JSON Diff" dev
```
Esegue automaticamente `tool-completeness-reviewer` per verifica finale.

**🔍 SEO OBBLIGATORIO dopo `/new-tool`** — Dopo scaffold, esegui SEMPRE in ordine:
1. **`programmatic-seo`** — ottimizza `meta.title`, `meta.description`, `tagline`, `pageDescription` e keywords in `tools.ts` usando playbook (Conversions, Templates, ecc.). Aggiorna anche file i18n EN.
2. **`seo-audit`** — verifica tool in sitemap (`public/sitemap-*.xml`), schema JSON-LD corretto, canonical/hreflang presenti, OG/Twitter con meta description ottimizzata.
3. **Aggiungi tool a sitemap** — file statico: aggiungere manualmente entry in tutti 5 file `public/sitemap-{en,it,es,fr,de,pt}.xml` con priority `0.8` e tutti hreflang.

### 🎯 Skill: `/i18n-check`
Verifica tutti tool abbiano traduzioni complete per tutte 6 lingue (en, it, es, fr, de, pt).
**Usa prima di ogni deploy** o quando aggiungi traduzioni.
```
Esempio: /i18n-check
```

### ⚡ Hooks attivi (automatici)
- **PostToolUse** — Dopo modifica a file `.ts/.tsx`, esegue `tsc --noEmit` automaticamente. Errori TypeScript → correggili prima di continuare.
- **PreToolUse** — Blocca modifica `.env.local` via Claude. Credenziali → usa terminale direttamente.

### 🤖 Subagent: `tool-completeness-reviewer`
Verifica tool ha completato tutti 13 step. Invocato automaticamente da `/new-tool`, usabile manualmente:
```
"Invoca tool-completeness-reviewer per verificare il tool json-diff"
```

### 📦 Skills esterne installate — Trigger automatici

Skills in `.agents/skills/` — **DEVI attivarle autonomamente** quando riconosci situazioni descritte, senza aspettare richiesta utente.

#### `vercel-react-best-practices` → attiva quando:
- Scrivi/modifichi componente React/Next.js (`.tsx`)
- Implementi data fetching, `useEffect`, o lazy loading
- Utente chiede ottimizzazione performance o bundle size
- Rilevi pattern inefficienti (waterfall, re-render eccessivi)

#### `systematic-debugging` → attiva quando:
- Errore non riproducibile locale ma presente in produzione
- Bug persiste dopo primo tentativo fix
- Errore hydration React (es. Error #425)
- Build Vercel fallisce senza causa ovvia
- Stai per applicare terzo fix stesso problema → **fermati e usa questa skill**

#### `free-tool-strategy` → attiva quando:
- Utente chiede quale tool implementare tra opzioni
- Discussione priorità roadmap (`IMPLEMENTATION_ROADMAP.md`)
- Valutazione potenziale SEO/traffic nuovo tool
- Pianificazione sprint sviluppo

#### `programmatic-seo` → attiva quando:
- Scrivi `tagline` o `seoDescription` per nuovo tool in `tool-seo.ts`
- Pianificazione nuova categoria tool o pagina aggregatrice
- Utente chiede ottimizzare ranking pagina tool
- Discussione keyword strategy o struttura URL

#### `seo-audit` → attiva quando:
- Utente chiede verificare/migliorare SEO tool o pagina
- Prima deploy importante che tocca routing, metadata o sitemap
- Dopo 5+ tool nuovi senza audit recente
- Problemi con hreflang, canonical o schema markup

#### `long-tail-seo` → attiva quando:
- Utente chiede aggiungere long-tail keywords a tool
- Creazione nuovo tool con ottimizzazione SEO keyword
- Utente chiede "keyword research" o "long-tail" per tool
- Verifica copertura keyword in contenuto visibile
- Utente chiede quali tool senza long-tail keywords

#### `page-cro` → attiva quando:
- Utente chiede migliorare tool page (conversioni, engagement, UX)
- Lavoro su tool con alto `searchVolume` in `tools.ts` (>10K)
- Scrittura/revisione CTA, headline o descrizioni pagina
- Utente menziona bounce rate, retention o miglioramento UI

---

## 🗺️ Tool Development Roadmap

**Roadmap completa implementazione nuovi tool:**
📍 **`/documentation/todo/IMPLEMENTATION_ROADMAP.md`**

Contiene:
- 87 tool da implementare per priorità (Maximum, High, Medium, Low)
- Stime difficoltà e tempo sviluppo per tool
- Fasi implementazione con timeline dettagliate
- Proiezioni revenue e metriche successo
- Tool già implementati (37) esclusi da roadmap

**Per pianificazione sviluppo, consultare sempre questo file.**

---

## 🤖 Workflow di Sviluppo con Claude Code

### 1. PRIMA DI OGNI SESSIONE

```bash
# Sincronizza con il repository
git pull origin {branch}

# Verifica lo stato del progetto
npm run status:check

# Aggiorna le dipendenze se necessario
npm update
```

### 2. DURANTE LO SVILUPPO

#### Creazione di nuovi tool

**🎯 METODO RAPIDO**: Usa skill `/new-tool [tool-id] [Tool Name] [category]` — esegue automaticamente tutti 13 step e verifica completezza. Vedi sezione "AUTOMAZIONI CLAUDE CODE ATTIVE" sopra.

**⚠️ IMPORTANTE**: Usa SOLO sistema in `/lib/tools.ts` per gestire tools e categories.

**🚨 ARCHITETTURA UNIFICATA OBBLIGATORIA (AGGIORNAMENTO 26/09/2024)**:
- **❌ MAI creare pagine dedicate** in `app/tools/[tool-name]/page.tsx`
- **✅ SEMPRE usare sistema dinamico** che gestisce tutto tramite `app/tools/[tool]/page.tsx`
- **Tutti nuovi tool DEVONO usare sistema unificato** per lazy loading e performance ottimali

**Workflow completo:**
1. **Registra tool** in `/lib/tools.ts` con tutti metadati richiesti
2. **Crea contenuti SEO** in `/lib/tool-seo.ts` con tagline e descrizione ottimizzate
3. **Definisci istruzioni** in `/lib/tool-instructions.ts` con contenuti tool-specifici
4. Crea prima test in `__tests__/unit/tools/[tool-name].test.ts`
5. Implementa logica in `lib/tools/[tool-name].ts`
6. Crea componente UI in `components/tools/implementations/[ToolName].tsx`
   **⚠️ SE componente usa `useToolStore` o `useCrontabStore`:**
   - Importa `useHydration` hook: `import { useHydration } from '@/lib/hooks/useHydration'`
   - Chiama hook: `const isHydrated = useHydration()`
   - Crea safe arrays: `const safeData = isHydrated ? storeData : []`
   - Nei `useEffect`: aggiungi `if (!isHydrated) return;` prima di accedere allo store
7. **Registra nel LazyToolLoader** in `components/tools/LazyToolLoader.tsx`:
   ```typescript
   const toolComponents = {
     // ... altri tool
     'tool-name': lazy(() => import('./implementations/ToolName')),
   }
   ```
8. **🚨 CRITICO: Registra nel sistema i18n** in `/lib/i18n/load-tools.ts`:
   ```typescript
   const toolIds = [
     // ... altri tool IDs
     'your-tool-id',  // ⚠️ DEVE matchare l'ID in tools.ts
   ];
   ```
   **⚠️ Se dimentichi questo step, traduzioni non caricate e tool mostra testi generici!**
9. **Crea traduzioni per tutte le lingue** in `/lib/i18n/dictionaries/{en,it,es,fr}/tools/`:
   - Crea `tool-name.json` per ogni lingua con: title, description, placeholder, meta, tagline, pageDescription, instructions
   - Instructions devono includere: steps, features, useCases, proTips, troubleshooting, keyboardShortcuts (opzionale)
10. **❌ NON creare route dedicata** - sistema dinamico `[tool]/page.tsx` gestisce routing automaticamente
11. **Sitemap aggiornata automaticamente** - sistema legge da `/lib/tools.ts`
12. **✅ ANALYTICS AUTO-TRACKING** - Quando tool processa dati, usa `addToHistory()`:
   ```typescript
   import { useToolStore } from '@/lib/store/toolStore';

   const { addToHistory } = useToolStore();

   const handleProcess = (input: string) => {
     const output = processYourTool(input);

     // ✅ Questo triggera tracking automatico in Umami!
     addToHistory({
       id: crypto.randomUUID(),
       tool: 'your-tool-id',  // Same as tool ID in tools.ts
       input,
       output,
       timestamp: Date.now(),
     });

     return output;
   };
   ```
   **Non serve altro!** Sistema traccia automaticamente:
   - Tool usage event in Umami
   - Input/output sizes
   - Processing time
   - User level (first-time, returning, power)
   - Session data
   - Device info & locale
13. **✅ AUTO-SCROLL TO RESULT (OBBLIGATORIO PER TUTTI I NUOVI TOOL)** - Ogni tool con risultato DEVE implementare auto-scroll:
   ```typescript
   import { useScrollToResult } from '@/lib/hooks/useScrollToResult';
   import { useEffect } from 'react';

   export default function YourTool() {
     // ⚠️ IMPORTANTE: Usa onlyIfNotVisible: false per scroll affidabile
     const { resultRef, scrollToResult } = useScrollToResult({
       onlyIfNotVisible: false,  // ← Forza scroll sempre, ignora visibilità
     });
     const [output, setOutput] = useState('');

     // ✅ PATTERN RACCOMANDATO: Scroll automatico quando output cambia
     useEffect(() => {
       if (output) {
         scrollToResult();
       }
     }, [output, scrollToResult]);

     const handleProcess = async () => {
       const result = await processData(input);
       setOutput(result); // Lo scroll avviene automaticamente via useEffect
     };

     return (
       <div>
         <button onClick={handleProcess}>Process</button>
         {/* Aggiungi ref alla sezione risultato */}
         <div ref={resultRef}>
           {output && <ResultComponent data={output} />}
         </div>
       </div>
     );
   }
   ```
   **⚠️ IMPORTANTE**:
   - Usa sempre `useEffect` per scroll, non chiamare `scrollToResult()` direttamente dopo `setOutput()` — React potrebbe non aver aggiornato DOM
   - **Usa SEMPRE `onlyIfNotVisible: false`** per scroll affidabile — default `true` causa problemi quando risultato parzialmente visibile

   **Per tool con caricamento immagini/preview (Base64, etc.):**
   ```typescript
   const [imageLoading, setImageLoading] = useState(false);
   const [imageError, setImageError] = useState(null);
   const { resultRef, scrollToResult } = useScrollToResult({
     onlyIfNotVisible: false,
   });

   // Aspetta che l'immagine sia caricata prima di scrollare
   useEffect(() => {
     if (result && result.success && !imageLoading && !imageError) {
       scrollToResult();
     }
   }, [result, imageLoading, imageError, scrollToResult]);

   // Nell'elemento <img>
   <img
     onLoad={() => setImageLoading(false)}
     onError={() => { setImageError('Error'); setImageLoading(false); }}
   />
   ```

   **Opzioni disponibili:**
   - `behavior`: 'smooth' (default) | 'instant' - Comportamento scroll
   - `delay`: 100ms (default) - Delay prima dello scroll (per aspettare DOM updates)
   - `offset`: 20px (default) - Offset dall'alto dell'elemento
   - `onlyIfNotVisible`: **false (RACCOMANDATO)** | true - Forza scroll sempre o solo se non visibile

   **Alternative - Hook auto-scroll (più semplice):**
   ```typescript
   const resultRef = useAutoScrollToResult([output], {
     shouldScroll: !!output,
     onlyIfNotVisible: false,  // ← Non dimenticare!
   });

   return <div ref={resultRef}>{output && <Result />}</div>;
   ```

   **📋 Tool con `useScrollToResult` già implementato:**
   - ✅ Base64-to-WebP, Base64-to-JPG, Base64-to-PNG, Base64-to-GIF, Base64-to-PDF

   **⚠️ Tool da aggiornare:** SQL Formatter, JSON Formatter, e altri tool con output lungo

**🚨 ERRORE CRITICO DA EVITARE - Pagine dedicate:**
```typescript
// ❌ SBAGLIATO - Causa errore Vercel build
export default function ToolPage() {
  return <ToolPageClient toolId={TOOL_ID} />;
}

// ✅ CORRETTO - Avvolgi sempre in Suspense
import { Suspense } from 'react';

export default function ToolPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ToolPageClient toolId={TOOL_ID} />
    </Suspense>
  );
}
```

**📋 Template per aggiungere tool in `/lib/tools.ts`:**
```typescript
{
  id: 'tool-slug',
  name: 'Tool Name',
  description: 'Descrizione breve e chiara del tool',
  icon: '📋', // Emoji icon
  route: '/tools/tool-slug',
  categories: ['dev'], // Array di categorie esistenti
  keywords: ['keyword1', 'keyword2', 'tool', 'specific', 'terms'],
  isPopular: true, // se è un tool popolare
  searchVolume: 5500, // volume di ricerca stimato
  label: '', // ⚠️ SEMPRE usare '' per nuovi tool. Valori: '' | 'popular' | 'coming-soon'
},
```

**⚠️ IMPORTANTE - Label Policy:**
- **NON usare mai `label: 'new'`** per nuovi tool
- Usa sempre `label: ''` (stringa vuota) di default
- Usa `label: 'popular'` solo se esplicitamente richiesto
- Usa `label: 'coming-soon'` solo per tool in sviluppo

**📚 Categorie disponibili:**
- `data`: Data & Conversion
- `encoding`: Encoding & Security
- `base64`: Base64 Tools (conversione Base64 a file)
- `text`: Text & Format
- `generators`: Generators
- `web`: Web & Design
- `dev`: Dev Utilities
- `formatters`: Formatters
- `pdf`: PDF Tools

**⛔ NON creare file in `/data/tools.ts` o `/data/categories.ts` - eliminati!**

## 📝 CONTENUTI OBBLIGATORI PER OGNI NUOVO TOOL

Per UX consistente e SEO, OGNI nuovo tool deve includere:

### 🎯 SEO Content (in `/lib/tool-seo.ts`)
```typescript
{
  id: 'tool-slug',
  tagline: 'Action verb + tool function + benefit (8-12 words)',
  seoDescription: 'What it does + who it\'s for + why better + soft CTA (30-70 words)',
}
```

### 📚 Instructions Content (in `/lib/tool-instructions.ts`)
```typescript
{
  id: 'tool-slug',
  title: 'How to use [Tool Name]',
  steps: [
    { title: 'Step title', description: 'Detailed step description' },
    // 3-5 steps specific to the tool
  ],
  features: ['Feature 1', 'Feature 2'], // 4-8 features
  useCases: ['Use case 1', 'Use case 2'], // 5-8 use cases  
  proTips: ['Tip 1', 'Tip 2'], // 4-6 pro tips
  troubleshooting: ['Issue 1', 'Issue 2'], // 3-5 common issues
  keyboardShortcuts: [
    { keys: 'Ctrl+C', description: 'Copy result' }
  ] // Optional, if applicable
}
```

### 📋 Content Guidelines
- **Tagline**: Deve includere action verb, tool function, e benefit
- **SEO Description**: Primary keyword in prime 15 parole, menzionare "free", "secure", "browser-based"
- **Instructions**: Step tool-specifici, non generici
- **Features**: Capacità tecniche uniche del tool
- **Use Cases**: Scenari reali per target audience
- **Pro Tips**: Consigli avanzati e best practices
- **Troubleshooting**: Problemi comuni e soluzioni specifiche del tool

### ❌ Content Requirements Violations
- Istruzioni generiche tipo "Enter your data" senza contesto tool-specifico
- Contenuto duplicato tra tool diversi
- SEO tagline o description mancante
- Meno di 4 instruction steps
- Nessuna sezione troubleshooting per tool complessi

#### Standard di codice

- TypeScript strict mode
- Tutti componenti con props tipizzate
- Zod per validazione runtime
- JSDoc per funzioni complesse
- Funzioni pure in `lib/tools/`

### 3. PRIMA DI OGNI COMMIT

#### Checklist obbligatoria

- [ ] Test passano localmente (`npm run test`)
- [ ] Linter senza errori (`npm run lint`)
- [ ] Build funziona (`npm run build`)
- [ ] Performance verificate (`npm run analyze:size`)
- [ ] Documentazione aggiornata

#### Processo di commit automatizzato

```bash
# Il pre-commit hook eseguirà automaticamente:
# 1. Linting e formatting
# 2. Test relativi ai file modificati
# 3. Build check
# 4. Bundle size analysis

git add .
git commit -m "tipo: descrizione breve"

# Tipi di commit:
# feat: nuova funzionalità
# fix: correzione bug
# test: aggiunta o modifica test
# docs: documentazione
# style: formattazione
# refactor: refactoring codice
# perf: miglioramento performance
# chore: manutenzione
```

### 4. TEST STANDARDS

#### Coverage minimo richiesto

- Branches: 80%
- Functions: 80%
- Lines: 80%
- Statements: 80%

#### Priorità dei test

1. **Critical Path** (DEVE avere 100% coverage):
   - Formatter/validator core logic
   - Data transformation functions
   - Security-sensitive operations (JWT, hash)

2. **High Priority** (90%+ coverage):
   - Tool chaining logic
   - Format detection
   - Error handling

3. **Medium Priority** (80%+ coverage):
   - UI components
   - Utility functions
   - Store operations

#### Test data requirements

- Sempre usare fixtures da `__tests__/fixtures/`
- Testare edge cases: empty, null, undefined, very large
- Includere caratteri unicode e special chars
- Testare input malformati per ogni tool

### 5. PERFORMANCE BENCHMARKS

Ogni tool DEVE rispettare questi limiti:

- Processing time: < 500ms per operazioni fino a 100KB
- Memory usage: < 50MB per tab
- Initial load: < 1.5s su 3G
- Time to Interactive: < 2s
- Bundle size contribution: < 50KB gzipped

### 6. VERCEL DEPLOYMENT

#### Pre-deploy checklist

```bash
# 1. Verifica environment variables
cat .env.local.example | grep NEXT_PUBLIC

# 2. Test production build
npm run build:prod
npm run start

# 3. Verifica le API routes
curl http://localhost:3000/api/health

# 4. Controlla i meta tags SEO
npm run seo:check
```

#### Deploy to production

```bash
# Automatic deploy on push to main
git push origin main

# Manual deploy
vercel --prod
```

### 7. MONITORING POST-DEPLOY

Dopo ogni deploy, verifica:

1. Umami Analytics: eventi tracciati
2. Sentry: nessun nuovo errore nelle prime 2 ore
3. Vercel Analytics: Core Web Vitals in range
4. API monitoring: response time < 200ms

### 8. ROLLBACK PROCEDURE

Problemi critici:

```bash
# 1. Immediate rollback
vercel rollback

# 2. Identify issue
npm run logs:production

# 3. Fix locally
git checkout -b hotfix/issue-name

# 4. Test thoroughly
npm run test:all

# 5. Deploy fix
git push origin hotfix/issue-name
```

### 9. WEEKLY MAINTENANCE

Ogni venerdì:

- [ ] Review Sentry errors
- [ ] Check bundle size trends
- [ ] Update dependencies (`npm outdated`)
- [ ] Review analytics per ottimizzazione
- [ ] Backup production data

### 10. SITEMAP E SEO AUTOMATICI

Sistema gestisce automaticamente generazione sitemap per tutti tool:

#### 🔄 Processo Automatico
- **Scansiona** `app/tools/` per nuovi tool directory
- **Estrae metadata** dai file `page.tsx` (title, description)
- **Prioritizza** tool featured > popular > new > altri
- **Aggiorna** sitemap ad ogni build automaticamente

#### 📊 Sorgenti Sitemap (ordine priorità)
1. **Static Data** (`lib/tools.ts`) - **FONTE UFFICIALE** per tutti tool e categorie
2. **Filesystem** (`app/tools/*/page.tsx`) - verifica esistenza tool
3. **Edge Config** (`lib/edge-config/`) - configurazione dinamica
4. **Dynamic Routes** (se presenti route `[tool]`)

#### 🎯 Priorità SEO Automatiche
- Homepage: 1.0 (massima)
- Tool Featured: 0.9
- Tool New: 0.85
- Tool Popular: 0.8
- Tool Standard: 0.7 (degradante con ordine)
- Categorie: 0.7
- Pagine statiche: 0.6-0.8

#### ⚡ Per aggiungere tool a sitemap
```bash
# 1. Crea la directory del tool
mkdir app/tools/nuovo-tool

# 2. Aggiungi page.tsx con metadati SEO
# Il sistema scannerizzerà automaticamente e aggiungerà alla sitemap

# 3. OBBLIGATORIO: Aggiungi il tool al registro ufficiale in lib/tools.ts
# con tutti i metadati: priorità, categoria, featured status, searchVolume, keywords
```

#### 🔍 Verifica Sitemap
```bash
# Durante development
curl http://localhost:3000/sitemap.xml

# In production  
curl https://toolslab.dev/sitemap.xml
```

### 11. EMERGENCY CONTACTS

- Vercel Status: https://vercel-status.com
- Umami Status: https://status.umami.is
- Domain issues: Cloudflare dashboard
- Critical bugs: Create issue con label 'critical'

## 📊 Tool Development Metrics

Metriche per ogni nuovo tool:

- Development time: target < 4 ore
- Test coverage: minimo 85%
- Bundle size impact: max +30KB
- Performance score: minimo 95/100

## 🚀 Quick Commands Reference

```bash
# Development
npm run dev                 # Start dev server
npm run dev:ads            # With ads enabled

# Testing
npm run test               # Watch mode
npm run test:ci            # CI mode with coverage
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:e2e           # E2E tests only
npm run test:all           # All test suites

# Building
npm run build              # Production build
npm run build:prod         # With ads enabled
npm run build:check        # Build without linting
npm run analyze:size       # Bundle analysis

# Quality
npm run lint               # ESLint
npm run lint:fix           # Auto-fix issues
npm run type-check         # TypeScript check
npm run format             # Prettier

# Deployment
vercel                     # Deploy preview
vercel --prod             # Deploy to production

# Maintenance
npm run status:check       # System status
npm outdated              # Check dependencies
npm audit                 # Security check
```

## 📝 Commit Message Examples

```
feat: add SQL formatter with syntax highlighting
fix: resolve JSON parsing error for unicode characters
test: add edge cases for base64 decoder
docs: update API documentation for v2 endpoints
style: improve mobile responsiveness for tool cards
refactor: extract common validation logic to utils
perf: optimize large file processing with web workers
chore: update dependencies and fix vulnerabilities
```

## 🎯 Project Information

**URL**: octotools.org
**Tech Stack**: Next.js 14 (App Router) + Tailwind CSS + shadcn/ui + Zustand
**Business Model**: Free forever + EthicalAds + Donations
**Core Principle**: Dual Mode - Serve single-task users (90%) e workflow power users (10%)

## 📦 Tool Template

Struttura per nuovo tool:

```typescript
// lib/tools/[tool-name].ts
export interface ToolResult {
  success: boolean;
  result?: string;
  error?: string;
  metadata?: Record<string, any>;
}

export function processToolName(input: string, options?: any): ToolResult {
  try {
    // Validation
    if (!input) {
      return { success: false, error: 'Input required' };
    }

    // Processing
    const result = /* your logic */;

    return { success: true, result };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
```

## 🏗️ ARCHITETTURA TOOL UNIFICATA (SISTEMA DINAMICO)

**Dal 26/09/2024 tutti tool usano sistema dinamico unificato:**

```
app/tools/
├── [tool]/           ← Sistema dinamico che gestisce TUTTI i tool
│   ├── page.tsx      ← Unica pagina che serve tutti i tool
│   ├── opengraph-image.tsx
│   └── twitter-image.tsx
├── page.tsx          ← Lista tool
└── layout.tsx        ← Layout condiviso

components/tools/
├── implementations/  ← TUTTI i componenti tool qui
│   ├── JsonFormatter.tsx
│   ├── CSSMinifier.tsx
│   └── [altri tool...]
└── LazyToolLoader.tsx ← Gestisce lazy loading

lib/
├── tools.ts          ← Registry centrale di TUTTI i tool
├── tool-seo.ts       ← SEO metadata centralizzato
└── tool-schema.ts    ← Schema generation
```

**❌ NON FARE MAI:**
- Creare `app/tools/json-formatter/page.tsx` (pagina dedicata)
- Creare route statiche per singoli tool
- Duplicare metadata SEO

**✅ FARE SEMPRE:**
- Registrare in `/lib/tools.ts`
- Aggiungere SEO in `/lib/tool-seo.ts`
- Implementare in `components/tools/implementations/`
- Registrare in `LazyToolLoader.tsx`

## 💧 GESTIONE HYDRATION (CRITICO - DICEMBRE 2024)

**⚠️ PROBLEMA RISOLTO**: Errore React #425 (hydration mismatch) causato da Zustand stores con persist middleware.

### Quando Usare useHydration

**SEMPRE** quando componente accede a `useToolStore` o `useCrontabStore`:

```typescript
'use client';

import { useToolStore } from '@/lib/store/toolStore';
import { useHydration } from '@/lib/hooks/useHydration';

export default function YourComponent() {
  const isHydrated = useHydration();
  const { favoriteTools, history } = useToolStore();

  // Safe access - aspetta hydration prima di usare i dati
  const safeFavorites = isHydrated ? favoriteTools : [];
  const safeHistory = isHydrated ? history : [];

  return (
    <div>
      <p>Favorites: {safeFavorites.length}</p>
      {safeHistory.map(item => <div key={item.id}>{item.tool}</div>)}
    </div>
  );
}
```

### Pattern useEffect con Hydration

```typescript
useEffect(() => {
  if (!isHydrated) return; // CRITICO: aspetta hydration

  // Ora è sicuro accedere allo store
  const { favoriteTools } = useToolStore.getState();
  console.log('User favorites:', favoriteTools);
}, [isHydrated]);
```

### ⚠️ Errori Comuni da Evitare

❌ **SBAGLIATO**:
```typescript
const { favoriteTools } = useToolStore();
return <div>{favoriteTools.length}</div>; // Hydration mismatch!
```

✅ **CORRETTO**:
```typescript
const isHydrated = useHydration();
const { favoriteTools } = useToolStore();
const safe = isHydrated ? favoriteTools : [];
return <div>{safe.length}</div>;
```

### Conseguenze Senza Hydration Check

- ❌ React Error #425 in produzione
- ❌ Dati persistenti (favoriti, cronologia) spariscono dopo refresh
- ❌ Build Vercel fallisce
- ❌ UX compromessa

### Componenti Aggiornati (Riferimento)

Tutti seguono pattern corretto:
- `components/layout/LabHubContent.tsx`
- `components/layout/NewLabHubContent.tsx`
- `components/layout/Header.tsx`
- `components/tools/ToolLayout.tsx`
- `components/lab/LabSidebar.tsx`
- `components/lab/LabOverview.tsx`
- `components/lab/FavoriteButton.tsx`
- `components/lab/WelcomePopup.tsx`
- `components/tools/implementations/CrontabBuilder.tsx`

**📖 Dettagli completi**: Vedi `/documentation/TOOL_DEVELOPMENT.md` sezione "State Management & Hydration"

## 🔒 Security Guidelines

1. **Mai committare segreti**: Usa variabili d'ambiente
2. **Sanitizza input utente**: Valida e sanitizza tutti input
3. **Evita eval()**: Mai usare eval o Function constructor con input utente
4. **CSP Headers**: Mantieni Content Security Policy stringente
5. **Dependencies**: Aggiorna regolarmente, controlla vulnerabilità

## 📈 ANALYTICS SYSTEM (DICEMBRE 2024) ⭐ NEW

### Sistema Centralizzato con Auto-Tracking

ToolsLab usa **sistema analytics centralizzato** basato su **Umami Cloud** che traccia automaticamente:
- ✅ Tool usage (quando usi `addToHistory()`)
- ✅ Pageview normalizzati (URL multilingua unificati)
- ✅ Session tracking (durata accurata anche se chiudi browser tramite sendBeacon)
- ✅ Performance metrics (processing time, input/output sizes)
- ✅ User segmentation (first-time, returning, power users)

### 🎯 Zero Boilerplate per Nuovi Tool

```typescript
// ✅ Tutto quello che serve:
addToHistory({
  id: crypto.randomUUID(),
  tool: 'my-tool',  // DEVE matchare ID in /lib/tools.ts
  input,
  output,
  timestamp: Date.now(),  // ⚠️ QUANDO INIZIA il processing, non quando finisce!
});

// → Evento tracciato automaticamente in Umami! 🎉
```

**Cosa succede automaticamente:**
- ✅ Event `tool.use` inviato a Umami
- ✅ Input/output byte sizes calcolati
- ✅ Processing time calcolato (`Date.now() - timestamp`)
- ✅ User level determinato (da cronologia)
- ✅ Session ID, locale, viewport aggiunti
- ✅ Batching automatico (5 eventi o 1 secondo)

### 📊 Cosa Viene Tracciato Automaticamente

**Pageview normalizzati:**
```
/tools/json-formatter       → 'tool:json-formatter'
/it/tools/json-formatter    → 'tool:json-formatter'  (stesso!)
/es/tools/json-formatter    → 'tool:json-formatter'  (stesso!)

// Locale tracciato separatamente: { page: 'tool:json-formatter', locale: 'it' }
```

**Tool usage event:**
```typescript
{
  event: 'tool.use',
  tool: 'json-formatter',
  inputSize: 1024,           // bytes
  outputSize: 2048,          // bytes
  processingTime: 45,        // milliseconds (Date.now() - timestamp)
  success: true,
  userLevel: 'power',        // first_time | returning | power
  locale: 'it',
  sessionId: 'abc-123',
  viewport: '1920x1080',
  isMobile: false,
  timestamp: 1234567890,
}
```

### 🛠️ Debug Panel

Aggiungi `?debug=analytics` all'URL per vedere:
- ✅ Real-time queue status (pending events, batch size)
- ✅ Session data (duration, pageviews, events, tools used)
- ✅ UmamiAdapter status (enabled, SDK ready)
- ✅ Manual flush button (force send pending events)
- ✅ Config viewer (log configuration to console)

```
http://localhost:3000?debug=analytics
http://localhost:3000/tools/json-formatter?debug=analytics
```

### 🔥 Features Chiave

1. **Batching Intelligente**: Eventi raggruppati (max 5 o 1 secondo) → 80-90% riduzione network requests
2. **sendBeacon Delivery**: Eventi critici (`session.end`) sopravvivono chiusura browser — 97% browser support
3. **No Retry Logic**: sendBeacon fornisce best-effort guaranteed delivery — retry disabilitata per evitare duplicati
4. **PII Sanitization**: Auto-rimozione email, IP, carte credito, API keys da tutti eventi
5. **Bot Detection**: Client-side — distingue search engines (OK) da malicious bots (bloccati)
6. **URL Normalization**: Multilingua gestito automaticamente — nessun duplicato in Umami

### 📚 Documentazione Completa

**Tutta in `/documentation/analytics/`:**

| File | Descrizione |
|------|-------------|
| **[README.md](./documentation/analytics/README.md)** | 📖 Overview generale, quick start, features |
| **[DEVELOPER_GUIDE.md](./documentation/analytics/DEVELOPER_GUIDE.md)** | 👨‍💻 **Inizia qui!** Guida pratica sviluppatori |
| **[ARCHITECTURE.md](./documentation/analytics/ARCHITECTURE.md)** | 🏗️ Design completo sistema, decisioni tecniche |
| **[PAGEVIEW_TRACKING.md](./documentation/analytics/PAGEVIEW_TRACKING.md)** | 📊 PageViewTracker, metriche avanzate, UTM |

**Learning Path consigliato:**
1. Leggi [README.md](./documentation/analytics/README.md) per overview
2. Segui [DEVELOPER_GUIDE.md](./documentation/analytics/DEVELOPER_GUIDE.md) per aggiungere tool
3. Consulta [ARCHITECTURE.md](./documentation/analytics/ARCHITECTURE.md) per dettagli tecnici

### ⚠️ Importante

- **timestamp in addToHistory**: DEVE essere quando **inizia** processing, non quando finisce
  ```typescript
  // ✅ CORRETTO
  const startTime = Date.now();
  const output = processData(input);
  addToHistory({ ..., timestamp: startTime });

  // ❌ SBAGLIATO - processing time sarà ~0
  const output = processData(input);
  addToHistory({ ..., timestamp: Date.now() });
  ```

- **Tool ID**: DEVE matchare esattamente con ID in `/lib/tools.ts` (kebab-case)

- **NON serve tracciare manualmente** — `addToHistory()` fa tutto automaticamente

- **Debug Mode**: Usa `?debug=analytics` durante development per verificare eventi tracciati

### 🔧 Configurazione

```bash
# Environment Variables (.env.local)

# 🎯 MASTER SWITCH - controlla tutto!
NEXT_PUBLIC_ANALYTICS_ENABLED=true        # true = ON, false = OFF

# Required (se analytics abilitato)
NEXT_PUBLIC_UMAMI_WEBSITE_ID=your-website-id
NEXT_PUBLIC_UMAMI_SCRIPT_URL=https://cloud.umami.is/script.js

# Optional
NEXT_PUBLIC_UMAMI_DEBUG=true              # Enable debug logs
NEXT_PUBLIC_ANALYTICS_BATCH_SIZE=5        # Eventi per batch (default: 5)
NEXT_PUBLIC_ANALYTICS_FLUSH_INTERVAL=1000 # Flush interval ms (default: 1000)
```

### 🎓 Per Saperne di Più

Documentazione completa per:
- **Come tracciare eventi custom** → [DEVELOPER_GUIDE.md](./documentation/analytics/DEVELOPER_GUIDE.md#-advanced-custom-events-optional)
- **Come funziona batching** → [ARCHITECTURE.md](./documentation/analytics/ARCHITECTURE.md#performance-optimizations)
- **Troubleshooting** → [DEVELOPER_GUIDE.md](./documentation/analytics/DEVELOPER_GUIDE.md#-troubleshooting)
- **API completa** → [DEVELOPER_GUIDE.md](./documentation/analytics/DEVELOPER_GUIDE.md#-api-reference)

## 🌍 SISTEMA MULTILINGUA (AGGIORNAMENTO DICEMBRE 2024)

### Architettura Multilingua

Sistema multilingua ToolsLab supporta **Italiano** con struttura scalabile per nuove lingue.

#### Struttura URL
- **Inglese (default)**: `/tools/json-formatter` (nessun prefisso)
- **Italiano**: `/it/tools/json-formatter`
- **Future lingue**: `/{locale}/tools/json-formatter` (fr, es, de, pt, nl, pl, tr)

⚠️ **IMPORTANTE**: Tool slug (`json-formatter`) MAI tradotto, identico in tutte lingue.

#### File e Directory

```
lib/i18n/
├── config.ts              # Configurazione locali e flags
├── get-dictionary.ts      # Caricamento dizionari
├── helpers.ts             # Funzioni utility i18n
└── dictionaries/
    ├── en.json           # Traduzioni inglesi
    └── it.json           # Traduzioni italiane

app/
├── [locale]/
│   ├── layout.tsx        # Layout per pagine localizzate
│   ├── page.tsx          # Homepage localizzata
│   └── tools/
│       └── [tool]/
│           └── page.tsx  # Pagine tool localizzate
└── components/
    └── LanguageSwitcher.tsx  # Selettore lingua
```

### Workflow per Aggiungere Traduzioni

#### 1. Aggiungere traduzioni per nuovo tool

1. **Aggiungi in `en.json`**:
```json
"tools": {
  "nuovo-tool": {
    "title": "New Tool",
    "description": "Tool description",
    "placeholder": "Enter text...",
    "meta": {
      "title": "New Tool - Free Online Tool | ToolsLab",
      "description": "SEO description for the tool"
    }
  }
}
```

2. **Aggiungi in `it.json`**:
```json
"tools": {
  "nuovo-tool": {
    "title": "Nuovo Strumento",
    "description": "Descrizione dello strumento",
    "placeholder": "Inserisci testo...",
    "meta": {
      "title": "Nuovo Strumento - Strumento Online Gratuito | ToolsLab",
      "description": "Descrizione SEO per lo strumento"
    }
  }
}
```

#### 2. Aggiungere nuova lingua

1. **Aggiorna `lib/i18n/config.ts`**:
```typescript
export type Locale = 'en' | 'it' | 'fr';  // Aggiungi nuovo locale
export const locales: Locale[] = ['en', 'it', 'fr'];

export const localeNames: Record<Locale, string> = {
  en: 'English',
  it: 'Italiano',
  fr: 'Français',  // Aggiungi nome
};

export const localeFlags: Record<Locale, string> = {
  en: '🇬🇧',
  it: '🇮🇹',
  fr: '🇫🇷',  // Aggiungi flag
};
```

2. **Crea `lib/i18n/dictionaries/fr.json`** copiando struttura da `en.json`

3. **Deploy** — sistema gestisce automaticamente routing e SEO

### SEO e Hreflang

Sistema genera automaticamente:
- Tag hreflang per ogni pagina
- Sitemap multilingua
- Meta tag tradotti
- Schema.org localizzato

Esempio hreflang generato:
```html
<link rel="alternate" hreflang="en" href="https://toolslab.dev/tools/json-formatter" />
<link rel="alternate" hreflang="it" href="https://toolslab.dev/it/tools/json-formatter" />
<link rel="alternate" hreflang="x-default" href="https://toolslab.dev/tools/json-formatter" />
```

### Best Practices Multilingua

1. **MAI tradurre slug tool** — mantenerli in inglese per consistenza
2. **Sempre includere meta.title e meta.description** per SEO ottimale
3. **Usare placeholder tradotti** per UX migliore
4. **Mantenere consistenza** termini tecnici tra lingue
5. **Testare sempre** language switcher su diverse pagine

### Verifica Traduzioni con i18n-check

**Prima di ogni deploy**, esegui `/i18n-check` per verificare tutti tool abbiano tutte 6 traduzioni complete. Riporta file mancanti, campi incompleti e tool non registrati in `load-tools.ts`.

### Testing Multilingua

```bash
# Test locale italiano
npm run dev
# Naviga a http://localhost:3000/it/tools/json-formatter

# Verifica sitemap
curl http://localhost:3000/sitemap.xml

# Verifica hreflang
# Ispeziona <head> delle pagine localizzate
```

### Componenti che Richiedono Localizzazione

Quando modifichi questi componenti, assicurati di passare traduzioni:

- `HomePageContent` — riceve `locale` e `dictionary` props
- `ToolPageClient` — riceve `locale` e `dictionary` props
- `Header/Footer` — devono usare dizionario per navigazione
- `CategoryCard` — deve mostrare nomi categoria tradotti

### Debug e Troubleshooting

Se traduzioni non appaiono:
1. Verifica file JSON valido
2. Controlla tool ID corrisponde tra `tools.ts` e dizionari
3. Verifica locale nella URL
4. Controlla log server per errori caricamento dizionario

## 📚 Documentazione Completa

Info dettagliate progetto in `/documentation`:

### 🏗️ Documentazione Tecnica
- **[Architecture Overview](./documentation/ARCHITECTURE.md)** — Architettura sistema e decisioni tecniche
- **[Tool Development Guide](./documentation/TOOL_DEVELOPMENT.md)** — Guida completa sviluppo nuovi tool
- **[API Documentation](./documentation/API_DOCUMENTATION.md)** — Documentazione completa API
- **[Tools Catalog](./documentation/TOOLS_CATALOG.md)** — Catalogo completo tool disponibili
- **[Multi Language Guide](./documentation/MULTI_LANGUAGE.md)** — Guida dettagliata sistema multilingua
- **[Blog Structure Guide](./documentation/BLOG-STRUCTURE.md)** — Struttura e gestione blog

### 🚀 Deployment e Contributing
- **[Deployment Guide](./documentation/DEPLOYMENT.md)** — Guida deployment e configurazione produzione
- **[Contributing Guidelines](./documentation/CONTRIBUTING.md)** — Linee guida per contribuire

### 📖 Overview
- **[Project README](./documentation/README.md)** — Overview completo progetto e tecnologie

💡 **Nota**: Documentazione in `/documentation` fornisce info alto livello e specifiche tecniche, questo CLAUDE.md contiene standard operativi quotidiani per sviluppo.