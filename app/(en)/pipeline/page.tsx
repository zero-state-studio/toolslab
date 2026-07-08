import { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import {
  Workflow,
  Shield,
  Zap,
  Link2,
  Save,
  ListOrdered,
  ArrowRight,
} from 'lucide-react';
import PipelineBuilder from '@/components/pipeline/PipelineBuilder';

const CANONICAL = 'https://toolslab.dev/pipeline';

export const metadata: Metadata = {
  title: 'Pipeline Builder - Chain Free Developer Tools Online',
  description:
    'Chain free developer tools into data pipelines that run in your browser: convert CSV to JSON, decode Base64, hash, format and more — step by step. No signup, no upload: your data never leaves your device.',
  keywords: [
    'pipeline builder online',
    'chain developer tools',
    'data transformation pipeline',
    'csv to json pipeline',
    'online data workflow',
    'browser data pipeline',
    'combine dev tools',
    'free pipeline tool',
  ],
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: 'Pipeline Builder - Chain Free Developer Tools Online | ToolsLab',
    description:
      'Build browser-based data pipelines: chain converters, formatters and hash tools step by step. Free, private, shareable as a link.',
    url: CANONICAL,
    type: 'website',
    siteName: 'ToolsLab',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pipeline Builder - Chain Free Developer Tools Online | ToolsLab',
    description:
      'Build browser-based data pipelines: chain converters, formatters and hash tools step by step. Free, private, shareable as a link.',
  },
  robots: { index: true, follow: true },
};

// Working example pipelines, pre-encoded with lib/pipeline/url-codec —
// each link loads the builder above with the steps ready to run.
const EXAMPLES = [
  {
    name: 'CSV → formatted JSON',
    description:
      'Paste CSV rows, get a clean indented JSON array. The most common conversion, ready in two steps.',
    steps: 'CSV → JSON · JSON Format',
    hash: 'JTdCJTIybmFtZSUyMiUzQSUyMkNTViUyMHRvJTIwZm9ybWF0dGVkJTIwSlNPTiUyMiUyQyUyMnN0ZXBzJTIyJTNBJTVCJTdCJTIydG9vbElkJTIyJTNBJTIyY3N2LXRvLWpzb24lMjIlMkMlMjJvcHRpb25zJTIyJTNBJTdCJTdEJTdEJTJDJTdCJTIydG9vbElkJTIyJTNBJTIyanNvbi1mb3JtYXQlMjIlMkMlMjJvcHRpb25zJTIyJTNBJTdCJTdEJTdEJTVEJTdE',
  },
  {
    name: 'CSV → SHA-256 integrity hash',
    description:
      'Normalize a CSV export to minified JSON and fingerprint it with SHA-256 to detect changes between runs.',
    steps: 'CSV → JSON · Minify · Hash',
    hash: 'JTdCJTIybmFtZSUyMiUzQSUyMkNTViUyMGludGVncml0eSUyMGhhc2glMjIlMkMlMjJzdGVwcyUyMiUzQSU1QiU3QiUyMnRvb2xJZCUyMiUzQSUyMmNzdi10by1qc29uJTIyJTJDJTIyb3B0aW9ucyUyMiUzQSU3QiU3RCU3RCUyQyU3QiUyMnRvb2xJZCUyMiUzQSUyMmpzb24tbWluaWZ5JTIyJTJDJTIyb3B0aW9ucyUyMiUzQSU3QiU3RCU3RCUyQyU3QiUyMnRvb2xJZCUyMiUzQSUyMmhhc2gtZ2VuZXJhdGUlMjIlMkMlMjJvcHRpb25zJTIyJTNBJTdCJTIyYWxnb3JpdGhtJTIyJTNBJTIyU0hBLTI1NiUyMiU3RCU3RCU1RCU3RA',
  },
  {
    name: 'Decode a Base64 API payload',
    description:
      'Turn a Base64-encoded response body into readable, formatted JSON — the everyday API debugging combo.',
    steps: 'Base64 Decode · JSON Format',
    hash: 'JTdCJTIybmFtZSUyMiUzQSUyMkRlY29kZSUyMEJhc2U2NCUyMEFQSSUyMHBheWxvYWQlMjIlMkMlMjJzdGVwcyUyMiUzQSU1QiU3QiUyMnRvb2xJZCUyMiUzQSUyMmJhc2U2NC1kZWNvZGUlMjIlMkMlMjJvcHRpb25zJTIyJTNBJTdCJTdEJTdEJTJDJTdCJTIydG9vbElkJTIyJTNBJTIyanNvbi1mb3JtYXQlMjIlMkMlMjJvcHRpb25zJTIyJTNBJTdCJTdEJTdEJTVEJTdE',
  },
  {
    name: 'YAML config → CSV',
    description:
      'Convert a YAML configuration or inventory file into a CSV you can open in any spreadsheet.',
    steps: 'YAML → JSON · JSON → CSV',
    hash: 'JTdCJTIybmFtZSUyMiUzQSUyMllBTUwlMjBjb25maWclMjB0byUyMENTViUyMiUyQyUyMnN0ZXBzJTIyJTNBJTVCJTdCJTIydG9vbElkJTIyJTNBJTIyeWFtbC10by1qc29uJTIyJTJDJTIyb3B0aW9ucyUyMiUzQSU3QiU3RCU3RCUyQyU3QiUyMnRvb2xJZCUyMiUzQSUyMmpzb24tdG8tY3N2JTIyJTJDJTIyb3B0aW9ucyUyMiUzQSU3QiU3RCU3RCU1RCU3RA',
  },
  {
    name: 'Clean up a messy list',
    description:
      'Trim whitespace, remove duplicates and sort alphabetically — one step, instant tidy list.',
    steps: 'List Transform',
    hash: 'JTdCJTIybmFtZSUyMiUzQSUyMkNsZWFuJTIwdXAlMjBhJTIwbGlzdCUyMiUyQyUyMnN0ZXBzJTIyJTNBJTVCJTdCJTIydG9vbElkJTIyJTNBJTIybGlzdC10cmFuc2Zvcm0lMjIlMkMlMjJvcHRpb25zJTIyJTNBJTdCJTIycmVtb3ZlRHVwbGljYXRlcyUyMiUzQXRydWUlMkMlMjJzb3J0JTIyJTNBJTIyYWxwaGFiZXRpY2FsJTIyJTJDJTIydHJpbSUyMiUzQXRydWUlN0QlN0QlNUQlN0Q',
  },
  {
    name: 'JWT claims → YAML',
    description:
      'Decode a JWT and view its header and payload as YAML — easier to scan than raw JSON.',
    steps: 'JWT Decode · JSON → YAML',
    hash: 'JTdCJTIybmFtZSUyMiUzQSUyMkpXVCUyMGNsYWltcyUyMHRvJTIwWUFNTCUyMiUyQyUyMnN0ZXBzJTIyJTNBJTVCJTdCJTIydG9vbElkJTIyJTNBJTIyand0LWRlY29kZSUyMiUyQyUyMm9wdGlvbnMlMjIlM0ElN0IlN0QlN0QlMkMlN0IlMjJ0b29sSWQlMjIlM0ElMjJqc29uLXRvLXlhbWwlMjIlMkMlMjJvcHRpb25zJTIyJTNBJTdCJTdEJTdEJTVEJTdE',
  },
];

const FAQS = [
  {
    q: 'What is the ToolsLab Pipeline Builder?',
    a: 'A free browser tool that chains ToolsLab developer tools into a pipeline: each step transforms the output of the previous one. You can convert CSV to JSON and hash the result, decode Base64 and format it as JSON, or build any other combination from 12 tool families — without copy-pasting between pages.',
  },
  {
    q: 'Is my data uploaded to a server?',
    a: 'No. Every step runs entirely in your browser using the same client-side logic as the individual ToolsLab tools. Nothing you paste into the input is ever sent to a server — which also means it works with sensitive data like production tokens or exports.',
  },
  {
    q: 'What does a shared pipeline link contain?',
    a: 'Only the pipeline definition: the list of steps and their options, encoded in the part of the URL after the # symbol (which browsers never send to servers). Your input data is never part of the link.',
  },
  {
    q: 'Which tools can I chain?',
    a: 'The first wave covers 12 tool families: Base64 encode/decode, JSON format/minify, CSV to JSON, JSON to CSV, hashing (SHA-256, SHA-512, SHA-1, MD5), URL encode/decode, JWT decode, YAML to JSON and back, XML to JSON, SQL formatting, string case conversion and list transforms. More tools are added over time.',
  },
  {
    q: 'Where are saved pipelines stored?',
    a: "In your browser's local storage, on your device. There is no account and no cloud sync: clearing site data removes them, and they are not visible to anyone else.",
  },
  {
    q: 'Is the Pipeline Builder free?',
    a: 'Yes — like every ToolsLab tool it is completely free, with no signup, no limits and no watermarks.',
  },
];

function jsonLd() {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'ToolsLab Pipeline Builder',
      url: CANONICAL,
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Any',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      description:
        'Chain free developer tools into browser-based data pipelines: convert, format, encode and hash data step by step. No signup, data never leaves the device.',
      featureList: [
        'Chain 12+ tool families into multi-step pipelines',
        '100% client-side execution — no data upload',
        'Save pipelines locally and share them as links',
        'Per-step output inspection and timing',
      ],
      publisher: {
        '@type': 'Organization',
        name: 'ToolsLab',
        url: 'https://toolslab.dev',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQS.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
  ];
}

const FEATURES = [
  {
    icon: Shield,
    title: '100% private',
    text: 'Every step runs in your browser. Inputs, outputs and intermediate results never touch a server — safe for tokens, exports and client data.',
  },
  {
    icon: ListOrdered,
    title: 'Step-by-step visibility',
    text: 'Inspect the output and execution time of every step, not just the final result. Debugging a transformation has never been clearer.',
  },
  {
    icon: Link2,
    title: 'Shareable as a link',
    text: 'One click turns your pipeline into a URL. Teammates open it and run the same steps on their own data — the link carries the recipe, never the data.',
  },
  {
    icon: Save,
    title: 'Saved locally',
    text: 'Keep your recurring pipelines in the browser. No account, no cloud — they load instantly next time you need them.',
  },
  {
    icon: Zap,
    title: 'Instant execution',
    text: 'No queues, no round-trips. Pipelines run at native browser speed, even offline once the page is loaded.',
  },
  {
    icon: Workflow,
    title: '12 tool families',
    text: 'Base64, JSON, CSV, YAML, XML, JWT, SQL, hashing, URL encoding, case conversion and list transforms — combined however you need.',
  },
];

export default function PipelinePage() {
  return (
    <div className="relative min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd()) }}
      />

      <div className="relative z-10 mx-auto max-w-[1200px] px-4 py-4">
        {/* Hero */}
        <div className="mb-4">
          <div className="mb-1.5 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 text-white shadow-md">
              <Workflow className="h-4 w-4" />
            </div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
              Pipeline Builder
            </h1>
            <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-violet-500">
              Beta
            </span>
          </div>
          <p className="max-w-2xl text-sm text-slate-600 dark:text-slate-400">
            Chain free developer tools into a data pipeline: each step
            transforms the output of the previous one, entirely in your
            browser. Convert, decode, format and hash in one run — then save
            the pipeline or share it as a link.
          </p>
        </div>

        {/* Builder */}
        <Suspense
          fallback={
            <div className="min-h-[400px] animate-pulse rounded-xl bg-pg-surface" />
          }
        >
          <PipelineBuilder />
        </Suspense>

        {/* ── SEO / explainer content ───────────────────────────────────── */}
        <div className="mx-auto mt-10 max-w-4xl space-y-8">
          {/* Example pipelines */}
          <section>
            <h2 className="mb-1.5 text-xl font-semibold text-slate-900 dark:text-white">
              Example pipelines to start from
            </h2>
            <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
              Every example is a working pipeline — click it and the builder
              above loads the steps, ready to run on your data.
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {EXAMPLES.map((ex) => (
                // Native anchor (not next/link): same-page hash navigation must
                // fire `hashchange` so the builder above reloads the steps
                <a
                  key={ex.name}
                  href={`#${ex.hash}`}
                  className="group rounded-xl border border-pg-border bg-pg-surface p-4 transition-colors hover:border-violet-500/50"
                >
                  <h3 className="mb-1 flex items-center justify-between gap-2 text-[14px] font-semibold text-slate-900 dark:text-white">
                    {ex.name}
                    <ArrowRight className="h-3.5 w-3.5 flex-shrink-0 text-pg-dim transition-transform group-hover:translate-x-0.5 group-hover:text-violet-500" />
                  </h3>
                  <p className="mb-2 text-[12px] leading-relaxed text-slate-600 dark:text-slate-400">
                    {ex.description}
                  </p>
                  <p className="font-mono text-[11px] text-violet-600 dark:text-violet-400">
                    {ex.steps}
                  </p>
                </a>
              ))}
            </div>
          </section>

          {/* What / why */}
          <section>
            <h2 className="mb-2 text-xl font-semibold text-slate-900 dark:text-white">
              Stop copy-pasting between tools
            </h2>
            <div className="space-y-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              <p>
                Real-world data work is rarely a single transformation. You
                export a CSV and need it as formatted JSON. You receive a
                Base64-encoded payload and want readable output. You decode a
                JWT, then need its claims in another format. Doing this with
                single-purpose tools means pasting intermediate results from
                page to page — slow, error-prone and tedious.
              </p>
              <p>
                The Pipeline Builder chains those same tools together. Paste
                your input once, add the steps you need, and run: each step
                feeds the next, and you can inspect every intermediate output
                along the way. When a pipeline is worth keeping, save it
                locally or share it with your team as a link.
              </p>
              <p>
                Like every tool on ToolsLab, pipelines run entirely
                client-side. That makes them suitable for data you would never
                paste into an online service or an AI chat: production tokens,
                customer exports, internal configuration files.
              </p>
            </div>
          </section>

          {/* How to use */}
          <section>
            <h2 className="mb-3 text-xl font-semibold text-slate-900 dark:text-white">
              How to build a pipeline
            </h2>
            <ol className="space-y-2.5">
              {[
                ['Paste your input', 'Any text data works: CSV rows, JSON, YAML, XML, Base64 strings, JWTs, plain lists.'],
                ['Add steps', 'Pick from the palette — it highlights the tools compatible with the previous step’s output type.'],
                ['Run and inspect', 'Execute the whole chain in one click and check the output and timing of every single step.'],
                ['Save or share', 'Store the pipeline in your browser for next time, or copy a link that carries the steps (never your data).'],
              ].map(([title, text], i) => (
                <li key={title} className="flex gap-3">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-violet-500/10 font-mono text-[12px] font-semibold text-violet-600 dark:text-violet-400">
                    {i + 1}
                  </span>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {title}.
                    </span>{' '}
                    {text}
                  </p>
                </li>
              ))}
            </ol>
          </section>

          {/* Features */}
          <section>
            <h2 className="mb-3 text-xl font-semibold text-slate-900 dark:text-white">
              Why use the Pipeline Builder
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  className="rounded-xl border border-pg-border bg-pg-surface p-4"
                >
                  <f.icon className="mb-2 h-5 w-5 text-violet-500" />
                  <h3 className="mb-1 text-[14px] font-semibold text-slate-900 dark:text-white">
                    {f.title}
                  </h3>
                  <p className="text-[12px] leading-relaxed text-slate-600 dark:text-slate-400">
                    {f.text}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* FAQ */}
          <section>
            <h2 className="mb-3 text-xl font-semibold text-slate-900 dark:text-white">
              Frequently asked questions
            </h2>
            <div className="space-y-2">
              {FAQS.map((f) => (
                <details
                  key={f.q}
                  className="group rounded-xl border border-pg-border bg-pg-surface px-4 py-3"
                >
                  <summary className="cursor-pointer list-none text-[14px] font-medium text-slate-900 dark:text-white">
                    <span className="flex items-center justify-between gap-2">
                      {f.q}
                      <span className="text-pg-dim transition-transform group-open:rotate-180">
                        ▾
                      </span>
                    </span>
                  </summary>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    {f.a}
                  </p>
                </details>
              ))}
            </div>
          </section>

          {/* Cross-links to tool pages */}
          <section className="rounded-xl border border-pg-border bg-pg-surface p-4">
            <h2 className="mb-2 text-[14px] font-semibold text-slate-900 dark:text-white">
              Prefer a single tool?
            </h2>
            <p className="text-[13px] leading-relaxed text-slate-600 dark:text-slate-400">
              Every pipeline step is also a full standalone tool:{' '}
              <Link href="/tools/csv-to-json" className="text-violet-600 hover:underline dark:text-violet-400">CSV to JSON</Link>,{' '}
              <Link href="/tools/json-formatter" className="text-violet-600 hover:underline dark:text-violet-400">JSON Formatter</Link>,{' '}
              <Link href="/tools/base64-encode" className="text-violet-600 hover:underline dark:text-violet-400">Base64 Encoder/Decoder</Link>,{' '}
              <Link href="/tools/hash-generator" className="text-violet-600 hover:underline dark:text-violet-400">Hash Generator</Link>,{' '}
              <Link href="/tools/jwt-decoder" className="text-violet-600 hover:underline dark:text-violet-400">JWT Decoder</Link>,{' '}
              <Link href="/tools/yaml-json-converter" className="text-violet-600 hover:underline dark:text-violet-400">YAML ↔ JSON</Link>,{' '}
              <Link href="/tools/sql-formatter" className="text-violet-600 hover:underline dark:text-violet-400">SQL Formatter</Link>{' '}
              and more — explore{' '}
              <Link href="/tools" className="text-violet-600 hover:underline dark:text-violet-400">
                all 80+ free developer tools
              </Link>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
