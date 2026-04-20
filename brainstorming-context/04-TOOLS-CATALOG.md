# 04 — Tools Catalog

**Count:** 69 tools shipped, organized in 10 categories. Source: `lib/tools.ts` (snapshot 2026-04-18).

## Category system

| ID | Display Name | Icon | Purpose |
|----|--------------|------|---------|
| `data` | Data & Conversion | 📊 | JSON/CSV/XML/SQL transforms |
| `encoding` | Encoding & Security | 🔐 | Base64, hash, JWT, encryption |
| `base64` | Base64 | 🔤 | Base64 → file format decoders |
| `text` | Text & Format | 📝 | Diff, markdown, case, lorem |
| `generators` | Generators | ⚡ | UUID, password, QR, barcode |
| `web` | Web & Design | 🎨 | Color, gradient, favicon, images |
| `dev` | Dev Utilities | 🔧 | Regex, crontab, cURL, unix ts |
| `formatters` | Formatters | 🪄 | Pretty-print JSON/XML/SQL/CSS/JS |
| `social` | Social Media | 📱 | Instagram, WhatsApp, LinkedIn, UTM |
| `pdf` | PDF Tools | 📄 | Image↔PDF, PDF↔Word |

Tools can belong to multiple categories (e.g. `json-formatter ∈ {data, formatters}`).

## All tools by search volume (tier)

### Tier S — ≥ 500K/mo (giants)

| Tool | ID | SV | Categories |
|---|---|---|---|
| JPG to PDF | `jpg-to-pdf` | 1 500 000 | pdf |
| PDF to Word | `pdf-to-word` | 1 000 000 | pdf |
| PNG to PDF | `png-to-pdf` | 600 000 | pdf |
| QR Code Generator | `qr-generator` | 550 000 | generators |

### Tier A — 100K – 500K/mo

| Tool | ID | SV | Categories |
|---|---|---|---|
| JSON Formatter | `json-formatter` | 400 000 | data, formatters |
| Password Generator | `password-generator` | 350 000 | generators |
| Barcode Generator | `barcode-generator` | 350 000 | generators |
| Color Picker | `color-picker` | 350 000 | web |
| Image to PDF | `image-to-pdf` | 300 000 | pdf |
| Image Optimizer | `image-optimizer` | 150 000 | web |
| Base64 Encoder/Decoder | `base64-encode` | 150 000 | encoding, base64 |
| UUID Generator | `uuid-generator` | 100 000 | generators |
| Instagram Font Generator | `instagram-font-generator` | 95 000 | social |
| JSON Validator | `json-validator` | 90 000 | data |

### Tier B — 30K – 100K/mo

| Tool | ID | SV | Categories |
|---|---|---|---|
| WhatsApp Link Generator | `whatsapp-link-generator` | 70 000 | social |
| Text Diff Checker | `text-diff` | 60 000 | text |
| URL Encoder/Decoder | `url-encode` | 50 000 | encoding |
| Color Format Converter | `color-format-converter` | 45 000 | web |
| List Compare & Diff | `list-compare` | 45 000 | dev |
| XML Formatter | `xml-formatter` | 40 000 | data, formatters |
| Gradient Generator | `gradient-generator` | 40 000 | web |
| Regex Tester | `regex-tester` | 39 000 | dev |
| UTM Link Builder | `utm-builder` | 35 000 | social |
| JSON to CSV | `json-to-csv` | 32 000 | data |
| Favicon Generator | `favicon-generator` | 32 000 | web |
| Markdown Preview | `markdown-preview` | 30 000 | text |

### Tier C — 10K – 30K/mo

| Tool | ID | SV | Categories |
|---|---|---|---|
| Binary to Text | `binary-to-text` | 27 000 | encoding |
| String Case Converter | `string-case-converter` | 25 000 | text |
| JS Minifier/Beautifier | `js-minifier` | 22 000 | formatters |
| CSV to JSON | `csv-to-json` | 20 000 | data |
| SQL Formatter | `sql-formatter` | 20 000 | data, formatters |
| JWT Encoder/Decoder | `jwt-decoder` | 20 000 | encoding |
| Unix Timestamp Converter | `unix-timestamp-converter` | 20 000 | dev |
| AI Prompt Token Counter | `ai-prompt-token-counter` | 20 000 | dev |
| YAML ↔ JSON Converter | `yaml-json-converter` | 18 000 | data |
| CSS Minifier/Beautifier | `css-minifier` | 15 000 | formatters |
| Lorem Ipsum Generator | `lorem-ipsum-generator` | 12 500 | text |
| Excel Filter Tool | `excel-filter` | 8 000 (cat=data), fix | data |
| Chmod Calculator | `chmod-calculator` | 11 000 | dev |
| YAML Validator | `yaml-validator` | 11 000 | data |
| JSON to TypeScript | `json-to-typescript` | 11 000 | dev |
| HTML Encoder/Decoder | `html-encode-decode` | 12 000 | encoding |
| Hash Generator | `hash-generator` | 12 000 | encoding |
| XML to JSON | `xml-to-json-converter` | 12 000 | data |
| Crontab Expression Builder | `crontab-builder` | 12 000 | dev |
| HTML to Markdown | `html-to-markdown` | 10 000 | text, formatters |
| cURL to Code | `curl-to-code` | 10 000 | dev |

### Tier D — < 10K/mo (long tail)

| Tool | ID | SV |
|---|---|---|
| Htaccess Generator | `htaccess-generator` | 8 000 |
| Excel Filter Tool | `excel-filter` | 8 000 |
| Base64 to PDF | `base64-to-pdf` | 7 000 |
| YouTube Timestamp Generator | `youtube-timestamp-generator` | 6 000 |
| JS Object → JSON | `js-object-to-json` | 6 000 |
| GIF to PDF | `gif-to-pdf` | 5 000 |
| Bcrypt Hash Generator | `bcrypt-hash-generator` | 5 000 |
| LinkedIn Post Formatter | `linkedin-post-formatter` | 5 000 |
| Base64 to JPG | `base64-to-jpg` | 4 500 |
| Base64 to PNG | `base64-to-png` | 3 800 |
| Base64 to WebP | `base64-to-webp` | 2 200 |
| EML to HTML | `eml-to-html` | 2 000 |
| Base64 to GIF | `base64-to-gif` | 1 800 |

## Cross-cutting observations

- **PDF tools dominate raw volume** but have lower intent quality (many mobile non-dev users).
- **Formatters + data** are the developer heartland — lower SV individually but higher stickiness and longer sessions.
- **Generators** (password, UUID, QR, barcode) bring huge one-shot traffic; poor conversion to "workflow" use.
- **Base64-to-<fmt>** suite is complete except SVG (in backlog as RIC-17).
- **Color tools** cluster (picker, format converter, gradient) have strong cross-pollination.

## Label policy

All tools default to `label: ''`. Values:
- `''` — default
- `'popular'` — only when editorially promoted
- `'coming-soon'` — placeholder for unreleased (excluded from search)
- `'test'` — dev-only, never in production lists
- ⛔ Never `'new'`

## Tools still missing from high-value backlog

See `09-ROADMAP-AND-BACKLOG.md` for Phase 1–4 pipeline (63 more tools planned).
