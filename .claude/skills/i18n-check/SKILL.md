---
name: i18n-check
description: Verifica che tutti i tool ToolsLab abbiano traduzioni complete per tutte le 6 lingue (en, it, es, fr, de, pt). Riporta i file mancanti con il path esatto.
---

# /i18n-check — Verifica Traduzioni ToolsLab

Esegui una verifica completa delle traduzioni. Controlla che ogni tool registrato in `/lib/tools.ts` abbia un file JSON di traduzione per ognuna delle 6 lingue supportate.

## Lingue supportate

```
en, it, es, fr, de, pt
```

## Directory delle traduzioni

```
lib/i18n/dictionaries/
├── en/tools/
├── it/tools/
├── es/tools/
├── fr/tools/
├── de/tools/
└── pt/tools/
```

## Procedura di verifica

### 1. Leggi tutti i tool ID da `/lib/tools.ts`

Estrai tutti i valori del campo `id` dall'array dei tool registrati.

### 2. Controlla la registrazione in `/lib/i18n/load-tools.ts`

Verifica che ogni tool ID sia presente nell'array `toolIds`. Se manca, il tool non caricherà le traduzioni anche se i file JSON esistono.

### 3. Per ogni tool ID, verifica l'esistenza dei 6 file JSON

Per ogni `tool-id` estratto, verifica che esista:

- `lib/i18n/dictionaries/en/tools/tool-id.json`
- `lib/i18n/dictionaries/it/tools/tool-id.json`
- `lib/i18n/dictionaries/es/tools/tool-id.json`
- `lib/i18n/dictionaries/fr/tools/tool-id.json`
- `lib/i18n/dictionaries/de/tools/tool-id.json`
- `lib/i18n/dictionaries/pt/tools/tool-id.json`

### 4. Per ogni file esistente, verifica i campi obbligatori

Ogni file JSON deve contenere:

- `title` — nome del tool tradotto
- `description` — descrizione tradotta
- `placeholder` — testo placeholder per l'input (vedi esenzioni sotto)
- `meta.title` — meta title SEO (max 60 char)
- `meta.description` — meta description SEO (max 160 char)
- `tagline` — tagline tradotta
- `pageDescription` — descrizione pagina tradotta
- `instructions` — oggetto con steps, features, useCases, proTips, troubleshooting

#### Esenzione `placeholder`

I tool **pure-generator** non hanno campi di input testo libero (solo checkbox, slider, select, pulsanti). Per questi `placeholder` è intenzionalmente assente e **non deve essere segnalato** come campo mancante. Decisione presa in RIC-6.

Lista tool esentati da `placeholder`:

```
lorem-ipsum-generator
password-generator
uuid-generator
qr-generator
barcode-generator
hash-generator
bcrypt-hash-generator
```

Se aggiungi un nuovo tool pure-generator, estendi questa lista. Gli altri tool (anche quelli con interfaccia complessa come `string-case-converter`, `text-diff`, `crontab-builder`) hanno un textarea di input e DEVONO avere `placeholder` in tutti 6 i locali.

### 5. Genera il report

Struttura il report in questo formato:

```
## Report i18n — [data]

### ✅ Tool completi: X/Y
### ⚠️ Tool con problemi: Z

---

### 🚨 Traduzioni completamente mancanti
| Tool ID | Lingue mancanti |
|---------|----------------|
| tool-id | es, fr, de     |

### ⚠️ File presenti ma incompleti (campi mancanti)
| Tool ID | Lingua | Campi mancanti |
|---------|--------|----------------|
| tool-id | it     | tagline, pageDescription |

### 🔴 Non registrati in load-tools.ts
| Tool ID |
|---------|
| tool-id |

---

### 📋 Azioni consigliate (in ordine di priorità)
1. Aggiungi X a load-tools.ts (blocca tutte le traduzioni)
2. Crea it/tools/tool-id.json (manca completo)
3. Aggiungi campo `tagline` a es/tools/other-tool.json
```

### 6. Proponi azioni correttive

Dopo il report, chiedi all'utente:

> "Vuoi che corregga automaticamente i problemi trovati? Posso:
>
> - Aggiungere i tool ID mancanti a `load-tools.ts`
> - Creare i file JSON mancanti basandomi sui contenuti esistenti in inglese
> - Completare i campi mancanti nei file esistenti"

## Note operative

- Usa `Glob` per trovare i file esistenti: pattern `lib/i18n/dictionaries/*/tools/*.json`
- Usa `Grep` per estrarre gli ID da `tools.ts`: pattern `id: '`
- Usa `Read` per verificare i campi nei JSON solo se strettamente necessario (campione)
- Priorità: segnala prima i tool completamente senza traduzioni, poi quelli parziali
