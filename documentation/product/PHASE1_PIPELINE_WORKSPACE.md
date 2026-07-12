# Fase 1 — Pipeline Workspace

> Visione: trasformare ToolsLab da collezione di landing SEO a **workspace locale-first
> per la manipolazione dati** — pipeline componibili, salvabili e condivisibili,
> eseguite al 100% nel browser. Questo documento copre SOLO la Fase 1.

**Stato**: draft · **Owner**: Gianluca · **Creato**: 2026-07-08

---

## 1. Perché (contesto dati, lug 2026)

Analytics ultimi 30gg (~10.4k visitatori):

| Segnale | Valore | Lettura |
|---|---|---|
| Organic search | 82% | funnel di acquisizione OK, ma hit & run |
| **Direct** | **16% (1.7k)** | esiste già un seme di utenti che tornano |
| `/it/tools/instagram-font-generator` | **68% del traffico** | audience consumer, NON target del workspace |
| base64-to-pdf (en+pt+es) | ~18% | audience dev, il vero target |
| hash-generator, excel-filter, list-compare | ~9% | dev, task ripetitivi → candidati pipeline |

Conclusioni operative:
- Il prodotto pipeline si progetta per il **segmento dev** (~30% del traffico attuale).
- La pagina instagram-font-generator **non si tocca**: finanzia (ads) ma non guida il design.
- Metrica regina della fase: **far salire Direct/returning**, non i visitatori totali.

Minaccia di fondo: gli LLM erodono le utility one-shot; il moat di ToolsLab è
l'**esecuzione locale** (nessuno incolla JWT di prod o Excel da 200MB in ChatGPT).
Le pipeline rendono questo moat un prodotto.

## 2. Obiettivo Fase 1

Un utente può: **comporre** una pipeline da 2+ tool → **eseguirla** →
**salvarla** (localStorage) → **ricondividerla via URL** → chi apre il link la
esegue con i propri dati.

Esempi target (dai tool già usati oggi):
- CSV → filtra colonne → JSON → download
- Base64 → decode → hash SHA-256
- Lista A/B → compare → dedup → CSV
- JSON → formatta → estrai campo → URL-encode

## 3. Non-goals (Fase 1)

- ❌ Account, sync cloud, backend (resta tutto client-side)
- ❌ CLI, desktop Tauri, PWA offline completa (Fase 2)
- ❌ Teams/self-hosted (Fase 3)
- ❌ AI / smart paste (layer successivo)
- ❌ Toccare le pagine SEO esistenti o i loro contenuti (NON NEGOZIABILE)
- ❌ Migrare tutti gli 83 tool: bastano 12-15 adapter ben scelti

## 4. Architettura (leva sull'esistente)

La codebase è già predisposta:

| Esistente | Ruolo nella Fase 1 |
|---|---|
| `lib/tools/*.ts` funzioni pure `(input, options) → ToolResult` | I nodi della pipeline: zero riscrittura della logica |
| `lib/hooks/useToolChaining.ts` + `ToolChainSuggestions` | Base UX del passaggio output→input (oggi solo suggerimento) |
| `lib/store/toolStore.ts` (zustand + persist) | Storage pipeline salvate (nuova slice `pipelines`) |
| `LazyToolLoader` | Lazy-load dei nodi: la pagina pipeline resta leggera |
| Registry `lib/tools.ts` | Metadati nodi (nome, categoria, icona) |

Nuovi pezzi:

```
lib/pipeline/
├── types.ts        # PipelineStep { toolId, options }, Pipeline { id, name, steps }
├── adapters.ts     # registry: toolId → { run(input, opts), inputType, outputType, optionsSchema }
├── engine.ts       # esecuzione sequenziale, error handling per step, tipi compatibili
└── url-codec.ts    # Pipeline ↔ querystring/hash compresso (condivisione senza backend)

app/(en)/pipeline/  # route builder: /pipeline e /pipeline#<encoded>
components/pipeline/ # Builder UI: lista step verticali, add-step (palette tool), run, share
```

Principi:
- **Tipi di dato espliciti** (`text | json | csv | binary`): l'add-step propone solo
  tool compatibili con l'output dello step precedente.
- **Condivisione = URL** (stato compresso nel fragment `#`, mai inviato al server):
  coerente con la promessa privacy, zero costi Vercel.
- Adapter = wrapper sottile sulle funzioni pure; niente logica duplicata.

## 5. Tool della prima ondata (12 adapter)

Scelti per: uso attuale, chainability testo→testo, costo adapter basso.

1. base64-encode / decode
2. json-formatter (format + minify)
3. csv-to-json
4. json-to-csv
5. hash-generator
6. url-encode / decode
7. jwt-decoder
8. list-compare
9. text-diff
10. yaml-json converter
11. xml-to-json
12. sql-formatter (formatta come step finale)

File-based (base64-to-pdf, excel-filter, image) → seconda ondata: richiedono
tipo `binary` e UX upload/download per step.

## 6. Milestone

| M | Deliverable | Stima |
|---|---|---|
| **M1** | `lib/pipeline/` (types, engine, url-codec) + 12 adapter + unit test | 1 settimana |
| **M2** | Builder UI `/pipeline`: componi, esegui, vedi output per step | 1-2 settimane |
| **M3** | Salvataggio in Lab (slice zustand) + "Save as pipeline" dal tool chaining esistente | 3-4 giorni |
| **M4** | Condivisione URL + pagina di atterraggio link condiviso + CTA "Crea pipeline" sulle tool page dev (sotto il workspace, non tocca SEO) | 1 settimana |

Rollout: `/pipeline` inizialmente `noindex` (niente rischi SEO); si indicizza
solo quando la UX regge. Gli eventi Umami (`pipeline.create/run/share/open-shared`)
entrano da M2 via `addToHistory`/`trackEngagement` esistenti.

## 7. KPI di validazione (90 giorni dal lancio M4)

| KPI | Baseline | Target |
|---|---|---|
| Canale Direct | 16% | ≥ 22% |
| Utenti con ≥1 pipeline salvata | 0 | 300 |
| Pipeline share aperte da terzi | 0 | 150 |
| Returning sul segmento dev (Umami userLevel) | da misurare | +50% |

Se dopo 90 giorni share e returning non si muovono → si ferma la Fase 2 e si
rivaluta (il costo affondato resta piccolo: ~4 settimane).

## 8. Rischi

- **Scope creep**: il builder tenta di diventare un node-editor visuale → tenerlo
  lista verticale di step, drag&drop solo per riordino (dnd già in bundle).
- **Cannibalizzazione percepita SEO**: nessuna: le tool page restano identiche,
  la CTA pipeline è sotto il workspace.
- **Persona sbagliata**: il 68% del traffico (instagram fonts) non convertirà —
  atteso e accettato; misurare i KPI SOLO sul segmento dev.
- **Peso bundle**: la route `/pipeline` carica gli adapter lazy (stesso pattern
  LazyToolLoader); budget: ≤ +15 kB gz sul first load della route.
