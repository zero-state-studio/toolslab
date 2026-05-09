// Shared data + icons used by both directions.

const TL_CATEGORIES = [
  { id: 'pdf',     name: 'PDF Tools',       hue: 8,   count: 12, icon: 'doc',     desc: 'Convert, merge, split, compress' },
  { id: 'image',   name: 'Image Tools',     hue: 280, count: 18, icon: 'image',   desc: 'Resize, convert, optimize, crop' },
  { id: 'text',    name: 'Text & String',   hue: 200, count: 24, icon: 'text',    desc: 'Case, diff, count, slugify' },
  { id: 'data',    name: 'Data & Format',   hue: 150, count: 16, icon: 'braces',  desc: 'JSON, YAML, CSV, XML' },
  { id: 'encode',  name: 'Encoders',        hue: 45,  count: 14, icon: 'lock',    desc: 'Base64, URL, hash, JWT' },
  { id: 'web',     name: 'Web & Network',   hue: 330, count: 9,  icon: 'globe',   desc: 'cURL, headers, DNS, regex' },
  { id: 'time',    name: 'Time & Date',     hue: 95,  count: 7,  icon: 'clock',   desc: 'Timestamp, timezone, cron' },
  { id: 'dev',     name: 'Dev Utilities',   hue: 20,  count: 11, icon: 'terminal',desc: 'UUID, color, QR, lorem' },
];

const TL_TOOLS_BY_CAT = {
  pdf: [
    { slug: 'jpg-to-pdf',     name: 'JPG to PDF',        desc: 'Convert JPG & JPEG images to PDF',  hot: true },
    { slug: 'pdf-to-jpg',     name: 'PDF to JPG',        desc: 'Extract pages as JPG images' },
    { slug: 'merge-pdf',      name: 'Merge PDF',         desc: 'Combine multiple PDFs into one', hot: true },
    { slug: 'split-pdf',      name: 'Split PDF',         desc: 'Break PDF into individual pages' },
    { slug: 'compress-pdf',   name: 'Compress PDF',      desc: 'Reduce PDF file size' },
    { slug: 'pdf-to-text',    name: 'PDF to Text',       desc: 'Extract text content from PDF' },
    { slug: 'base64-to-pdf',  name: 'Base64 to PDF',     desc: 'Decode Base64 data to PDF' },
    { slug: 'rotate-pdf',     name: 'Rotate PDF',        desc: 'Rotate pages in a PDF document' },
    { slug: 'watermark-pdf',  name: 'Watermark PDF',     desc: 'Add text watermark to pages' },
    { slug: 'protect-pdf',    name: 'Protect PDF',       desc: 'Add password protection' },
    { slug: 'unlock-pdf',     name: 'Unlock PDF',        desc: 'Remove password from PDF' },
    { slug: 'pdf-metadata',   name: 'PDF Metadata',      desc: 'Inspect & edit document info' },
  ],
  image: [
    { slug: 'resize-image',   name: 'Resize Image',      desc: 'Scale images to any size', hot: true },
    { slug: 'convert-image',  name: 'Convert Format',    desc: 'PNG, JPG, WebP, AVIF' },
    { slug: 'compress-image', name: 'Compress Image',    desc: 'Smart lossy / lossless compression', hot: true },
    { slug: 'crop-image',     name: 'Crop Image',        desc: 'Freeform or fixed aspect crop' },
  ],
  text: [
    { slug: 'case-converter', name: 'Case Converter',    desc: 'UPPER / lower / Title / camelCase' },
    { slug: 'word-counter',   name: 'Word Counter',      desc: 'Words, chars, reading time' },
    { slug: 'text-diff',      name: 'Text Diff',         desc: 'Compare two blocks side-by-side' },
    { slug: 'slugify',        name: 'Slugify',           desc: 'Make URL-friendly strings' },
  ],
  data: [
    { slug: 'json-formatter', name: 'JSON Formatter',    desc: 'Pretty-print & validate JSON', hot: true },
    { slug: 'yaml-to-json',   name: 'YAML ↔ JSON',       desc: 'Convert between YAML and JSON' },
    { slug: 'csv-to-json',    name: 'CSV ↔ JSON',        desc: 'Convert tabular data' },
    { slug: 'xml-formatter',  name: 'XML Formatter',     desc: 'Indent, minify, validate' },
  ],
  encode: [
    { slug: 'base64',         name: 'Base64',            desc: 'Encode / decode Base64', hot: true },
    { slug: 'url-encoder',    name: 'URL Encoder',       desc: 'Percent-encode URLs' },
    { slug: 'jwt-decoder',    name: 'JWT Decoder',       desc: 'Decode and inspect tokens' },
    { slug: 'hash-generator', name: 'Hash Generator',    desc: 'MD5, SHA-1, SHA-256, SHA-512' },
  ],
  web: [
    { slug: 'curl-to-code',   name: 'cURL to Code',      desc: 'Convert cURL to fetch, axios, ...', hot: true },
    { slug: 'regex-tester',   name: 'Regex Tester',      desc: 'Test patterns with live matches' },
    { slug: 'user-agent',     name: 'User-Agent Parser', desc: 'Decode UA strings' },
  ],
  time: [
    { slug: 'unix-timestamp', name: 'Unix Timestamp',    desc: 'Convert between Unix & human dates' },
    { slug: 'cron-parser',    name: 'Cron Parser',       desc: 'Explain cron expressions' },
  ],
  dev: [
    { slug: 'uuid-generator', name: 'UUID Generator',    desc: 'v1, v4, v7 UUIDs', hot: true },
    { slug: 'qr-generator',   name: 'QR Generator',      desc: 'Generate QR codes' },
    { slug: 'color-picker',   name: 'Color Picker',      desc: 'HEX, RGB, HSL, OKLCH' },
    { slug: 'lorem-ipsum',    name: 'Lorem Ipsum',       desc: 'Placeholder text generator' },
  ],
};

const TL_ALL_TOOLS = (() => {
  const out = [];
  for (const c of TL_CATEGORIES) {
    for (const t of (TL_TOOLS_BY_CAT[c.id] || [])) out.push({ ...t, cat: c });
  }
  return out;
})();

// Icons as React elements. size + color overridable.
function TLIcon({ name, size = 20, color = 'currentColor', strokeWidth = 1.6 }) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'doc':      return <svg {...p}><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z"/><path d="M14 3v5h5"/></svg>;
    case 'image':    return <svg {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/></svg>;
    case 'text':     return <svg {...p}><path d="M4 7V5h16v2"/><path d="M9 5v14"/><path d="M15 5v14"/><path d="M6 19h6"/><path d="M12 19h6"/></svg>;
    case 'braces':   return <svg {...p}><path d="M8 3H7a2 2 0 0 0-2 2v4a2 2 0 0 1-2 2 2 2 0 0 1 2 2v4a2 2 0 0 0 2 2h1"/><path d="M16 3h1a2 2 0 0 1 2 2v4a2 2 0 0 0 2 2 2 2 0 0 0-2 2v4a2 2 0 0 1-2 2h-1"/></svg>;
    case 'lock':     return <svg {...p}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
    case 'globe':    return <svg {...p}><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18z"/></svg>;
    case 'clock':    return <svg {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>;
    case 'terminal': return <svg {...p}><path d="m4 17 6-6-6-6"/><path d="M12 19h8"/></svg>;
    case 'search':   return <svg {...p}><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>;
    case 'upload':   return <svg {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/></svg>;
    case 'download': return <svg {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/></svg>;
    case 'github':   return <svg {...p}><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>;
    case 'heart':    return <svg {...p}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>;
    case 'zap':      return <svg {...p}><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>;
    case 'shield':   return <svg {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
    case 'sparkles': return <svg {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.5 5.5l2.8 2.8M15.7 15.7l2.8 2.8M5.5 18.5l2.8-2.8M15.7 8.3l2.8-2.8"/></svg>;
    case 'arrow':    return <svg {...p}><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>;
    case 'star':     return <svg {...p}><path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/></svg>;
    case 'flask':    return <svg {...p}><path d="M9 2v6l-5 9a3 3 0 0 0 2.6 4.5h10.8A3 3 0 0 0 20 17l-5-9V2"/><path d="M7 2h10"/><path d="M6 13h12"/></svg>;
    case 'plus':     return <svg {...p}><path d="M12 5v14M5 12h14"/></svg>;
    case 'check':    return <svg {...p}><path d="M20 6 9 17l-5-5"/></svg>;
    case 'x':        return <svg {...p}><path d="M18 6 6 18M6 6l12 12"/></svg>;
    case 'sun':      return <svg {...p}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>;
    case 'moon':     return <svg {...p}><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>;
    case 'command':  return <svg {...p}><path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/></svg>;
    case 'filter':   return <svg {...p}><path d="M22 3H2l8 9.5V19l4 2v-8.5L22 3z"/></svg>;
    case 'heart-f':  return <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>;
    case 'chev-r':   return <svg {...p}><path d="m9 6 6 6-6 6"/></svg>;
    case 'chev-d':   return <svg {...p}><path d="m6 9 6 6 6-6"/></svg>;
    default:         return <svg {...p}><circle cx="12" cy="12" r="9"/></svg>;
  }
}

// Mascot — the ToolsLab "beaker bot" (little robot in an Erlenmeyer flask).
// Variant: 'playground' uses soft colors + round; 'terminal' uses mono lines.
function TLMascot({ size = 80, variant = 'playground', mood = 'happy' }) {
  if (variant === 'terminal') {
    return (
      <svg width={size} height={size * 1.1} viewBox="0 0 80 88" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M28 8v16L12 58a8 8 0 0 0 7 12h42a8 8 0 0 0 7-12L52 24V8"/>
        <path d="M24 8h32"/>
        <path d="M18 48h44"/>
        {/* bot inside */}
        <rect x="28" y="40" width="24" height="20" rx="3"/>
        <circle cx="34" cy="49" r="1.5" fill="currentColor"/>
        <circle cx="46" cy="49" r="1.5" fill="currentColor"/>
        <path d="M36 55h8"/>
        <path d="M40 40v-4"/>
        <circle cx="40" cy="35" r="2"/>
        {/* bubbles */}
        <circle cx="24" cy="64" r="1.5"/>
        <circle cx="56" cy="66" r="2"/>
        <circle cx="38" cy="68" r="1"/>
      </svg>
    );
  }
  // playground — soft
  return (
    <svg width={size} height={size * 1.1} viewBox="0 0 80 88" fill="none">
      <defs>
        <linearGradient id={`flask-${size}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#a78bfa" stopOpacity=".25"/>
          <stop offset="1" stopColor="#ec4899" stopOpacity=".6"/>
        </linearGradient>
      </defs>
      {/* flask body */}
      <path d="M28 8v16L12 58a8 8 0 0 0 7 12h42a8 8 0 0 0 7-12L52 24V8" fill={`url(#flask-${size})`} stroke="#1f1b2e" strokeWidth="2.4" strokeLinejoin="round"/>
      <path d="M24 8h32" stroke="#1f1b2e" strokeWidth="2.4" strokeLinecap="round"/>
      {/* liquid surface */}
      <path d="M18 48h44" stroke="#1f1b2e" strokeWidth="1.4" strokeDasharray="2 3" opacity=".5"/>
      {/* bot body */}
      <rect x="28" y="40" width="24" height="20" rx="5" fill="#fde68a" stroke="#1f1b2e" strokeWidth="2"/>
      {/* eyes */}
      {mood === 'happy' ? (
        <>
          <path d="M33 49a2 2 0 0 0 2 2 2 2 0 0 0 2-2" stroke="#1f1b2e" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
          <path d="M43 49a2 2 0 0 0 2 2 2 2 0 0 0 2-2" stroke="#1f1b2e" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
        </>
      ) : (
        <>
          <circle cx="35" cy="49" r="1.7" fill="#1f1b2e"/>
          <circle cx="45" cy="49" r="1.7" fill="#1f1b2e"/>
        </>
      )}
      {/* mouth */}
      <path d="M37 55c1 1 5 1 6 0" stroke="#1f1b2e" strokeWidth="1.6" strokeLinecap="round" fill="none"/>
      {/* antenna */}
      <path d="M40 40v-4" stroke="#1f1b2e" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="40" cy="35" r="2.5" fill="#f472b6" stroke="#1f1b2e" strokeWidth="1.8"/>
      {/* bubbles */}
      <circle cx="22" cy="64" r="2" fill="#a78bfa" opacity=".7"/>
      <circle cx="58" cy="66" r="2.6" fill="#f472b6" opacity=".7"/>
      <circle cx="38" cy="70" r="1.4" fill="#fde68a" opacity=".9"/>
    </svg>
  );
}

Object.assign(window, { TL_CATEGORIES, TL_TOOLS_BY_CAT, TL_ALL_TOOLS, TLIcon, TLMascot });
