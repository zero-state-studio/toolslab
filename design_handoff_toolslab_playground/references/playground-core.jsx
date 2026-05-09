// ============================================================
// DIRECTION A — "Playground"
// Raycast/Arc-inspired. Playful, colorful, warm dark + clean light.
// Rounded cards, soft shadows, multi-color category accents,
// mascot (beaker bot) as recurring illustration.
// ============================================================

const PG = {
  // Dark (primary)
  dark: {
    bg:        '#0f0b1a',
    bg2:       '#1a1530',
    surface:   '#1e1835',
    surfaceHi: '#2a2248',
    border:    'rgba(167,139,250,.12)',
    borderHi:  'rgba(167,139,250,.22)',
    text:      '#f5f1ff',
    muted:     '#a19bb8',
    dim:       '#706a85',
    accent:    '#a78bfa',   // violet
    accent2:   '#f472b6',   // pink
    accent3:   '#fde68a',   // amber
    accent4:   '#6ee7b7',   // mint
  },
  light: {
    bg:        '#faf7ff',
    bg2:       '#f1ecff',
    surface:   '#ffffff',
    surfaceHi: '#f7f3ff',
    border:    'rgba(31,27,46,.08)',
    borderHi:  'rgba(31,27,46,.14)',
    text:      '#1f1b2e',
    muted:     '#5b5373',
    dim:       '#8a8299',
    accent:    '#7c3aed',
    accent2:   '#db2777',
    accent3:   '#d97706',
    accent4:   '#059669',
  },
};

// ──────────────────────────────────────────────────────────────
// Theme-aware helpers
// ──────────────────────────────────────────────────────────────
const PGCtx = React.createContext({ theme: 'dark', font: 'geist', density: 'comfortable', cardStyle: 'elevated' });

function usePG() { return React.useContext(PGCtx); }
function pgColors(t) { return PG[t]; }

function pgFont(f) {
  if (f === 'mono')    return '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace';
  if (f === 'serif')   return '"Instrument Serif", Georgia, serif';
  if (f === 'grotesk') return '"Space Grotesk", -apple-system, system-ui, sans-serif';
  return '"Geist", -apple-system, "Inter", system-ui, sans-serif';
}

function pgDens(d) {
  if (d === 'compact')  return { pad: 12, gap: 10, h: 36, radius: 8,  scale: 0.94 };
  if (d === 'spacious') return { pad: 28, gap: 20, h: 52, radius: 16, scale: 1.06 };
  return                       { pad: 18, gap: 14, h: 44, radius: 12, scale: 1.0 };
}

function pgCardStyle(style, c) {
  if (style === 'flat')     return { background: c.surface, border: 'none', boxShadow: 'none' };
  if (style === 'bordered') return { background: 'transparent', border: `1px solid ${c.borderHi}`, boxShadow: 'none' };
  return { background: c.surface, border: `1px solid ${c.border}`, boxShadow: '0 1px 0 rgba(255,255,255,.03) inset, 0 8px 32px -12px rgba(0,0,0,.4)' };
}

// ──────────────────────────────────────────────────────────────
// Atoms
// ──────────────────────────────────────────────────────────────
function PGShell({ theme = 'dark', children, style, noChrome, font, density, cardStyle }) {
  const c = pgColors(theme);
  return (
    <PGCtx.Provider value={{ theme, font: font || 'geist', density: density || 'comfortable', cardStyle: cardStyle || 'elevated' }}>
      <div style={{
        width: '100%', height: '100%',
        background: c.bg,
        color: c.text,
        fontFamily: pgFont(font || 'geist'),
        overflow: 'hidden',
        position: 'relative',
        ...style,
      }}>
        {children}
      </div>
    </PGCtx.Provider>
  );
}

function PGNav({ theme = 'dark', active = 'home', compact }) {
  const c = pgColors(theme);
  const items = [
    { id: 'tools',      label: 'Tools' },
    { id: 'categories', label: 'Categories' },
    { id: 'lab',        label: 'The Lab' },
    { id: 'about',      label: 'About' },
  ];
  return (
    <div style={{
      height: compact ? 52 : 60,
      padding: '0 24px',
      display: 'flex', alignItems: 'center', gap: 20,
      borderBottom: `1px solid ${c.border}`,
      background: `${c.bg}cc`,
      backdropFilter: 'blur(20px)',
      position: 'sticky', top: 0, zIndex: 10,
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: `linear-gradient(135deg, ${c.accent} 0%, ${c.accent2} 100%)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff',
        }}>
          <TLIcon name="flask" size={16} strokeWidth={2.2}/>
        </div>
        <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: -0.3 }}>ToolsLab</span>
        <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: c.accent4 + '22', color: c.accent4, fontWeight: 600, letterSpacing: 0.4 }}>v3</span>
      </div>

      {/* Nav */}
      <div style={{ display: 'flex', gap: 4, marginLeft: 20 }}>
        {items.map((i) => (
          <a key={i.id} style={{
            padding: '7px 12px', borderRadius: 8, fontSize: 14, fontWeight: 500,
            color: i.id === active ? c.text : c.muted,
            background: i.id === active ? c.surfaceHi : 'transparent',
            cursor: 'pointer',
          }}>{i.label}</a>
        ))}
      </div>

      <div style={{ flex: 1 }}/>

      {/* Command button */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '6px 10px 6px 10px', borderRadius: 8,
        background: c.surface, border: `1px solid ${c.border}`,
        color: c.muted, fontSize: 13, minWidth: 200, cursor: 'pointer',
      }}>
        <TLIcon name="search" size={14}/>
        <span style={{ flex: 1 }}>Search tools…</span>
        <span style={{
          fontSize: 11, padding: '2px 6px', borderRadius: 4,
          background: c.bg, border: `1px solid ${c.border}`, fontFamily: pgFont('mono'),
        }}>⌘K</span>
      </div>

      {/* GitHub stars */}
      <a style={{ display: 'flex', alignItems: 'center', gap: 6, color: c.muted, fontSize: 13, cursor: 'pointer' }}>
        <TLIcon name="github" size={16}/>
        <span style={{ color: c.accent3 }}>★</span>
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>2.4k</span>
      </a>

      {/* Theme */}
      <div style={{ width: 32, height: 32, borderRadius: 8, background: c.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.muted }}>
        <TLIcon name={theme === 'dark' ? 'moon' : 'sun'} size={14}/>
      </div>
    </div>
  );
}

function PGBadge({ children, hue = 260, theme = 'dark' }) {
  const c = pgColors(theme);
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600,
      background: `oklch(${theme === 'dark' ? '0.25' : '0.94'} 0.1 ${hue})`,
      color: `oklch(${theme === 'dark' ? '0.85' : '0.45'} 0.15 ${hue})`,
      letterSpacing: 0.2,
    }}>{children}</span>
  );
}

// ──────────────────────────────────────────────────────────────
// HOME PAGE
// ──────────────────────────────────────────────────────────────
function PGHome({ theme = 'dark' }) {
  const c = pgColors(theme);
  const featured = TL_ALL_TOOLS.filter((t) => t.hot).slice(0, 6);
  return (
    <PGShell theme={theme} style={{ overflow: 'auto' }}>
      <PGNav theme={theme} active="home"/>

      {/* Hero */}
      <div style={{ position: 'relative', padding: '56px 40px 48px', overflow: 'hidden' }}>
        {/* Playful blobs */}
        <div aria-hidden style={{ position: 'absolute', top: -40, right: -60, width: 280, height: 280, borderRadius: '50%',
          background: `radial-gradient(circle, ${c.accent2}40 0%, transparent 70%)`, filter: 'blur(30px)' }}/>
        <div aria-hidden style={{ position: 'absolute', top: 60, left: 80, width: 200, height: 200, borderRadius: '50%',
          background: `radial-gradient(circle, ${c.accent}50 0%, transparent 70%)`, filter: 'blur(30px)' }}/>

        <div style={{ position: 'relative', maxWidth: 960, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 999,
            background: c.surface, border: `1px solid ${c.border}`, fontSize: 13, marginBottom: 24, color: c.muted }}>
            <span style={{ width: 6, height: 6, borderRadius: 3, background: c.accent4 }}/>
            124 tools · runs entirely in your browser
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
            <TLMascot size={110}/>
          </div>
          <h1 style={{
            fontSize: 68, fontWeight: 700, lineHeight: 1.02, letterSpacing: -2,
            margin: '8px 0 16px',
          }}>
            Every dev tool,<br/>
            <span style={{ background: `linear-gradient(90deg, ${c.accent} 0%, ${c.accent2} 50%, ${c.accent3} 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              one tidy lab.
            </span>
          </h1>
          <p style={{ fontSize: 18, color: c.muted, maxWidth: 560, margin: '0 auto 28px', lineHeight: 1.5 }}>
            Fast, free, no sign-up. Every file stays on your machine.
          </p>

          {/* Big search */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            maxWidth: 560, margin: '0 auto',
            padding: '14px 18px', borderRadius: 14,
            background: c.surface, border: `1px solid ${c.borderHi}`,
            boxShadow: `0 20px 60px -20px ${c.accent}40, 0 1px 0 rgba(255,255,255,.03) inset`,
          }}>
            <TLIcon name="search" size={18} color={c.muted}/>
            <input placeholder="Type to find a tool — try 'json' or 'base64'"
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                color: c.text, fontSize: 16, fontFamily: 'inherit',
              }}/>
            <span style={{ padding: '4px 8px', borderRadius: 6, background: c.bg, fontSize: 12, color: c.muted, fontFamily: pgFont('mono') }}>⌘K</span>
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16, flexWrap: 'wrap' }}>
            {['JSON Formatter', 'Base64', 'JPG to PDF', 'cURL to Code', 'UUID'].map((q) => (
              <span key={q} style={{
                padding: '6px 12px', borderRadius: 999, fontSize: 12,
                background: c.surfaceHi, color: c.muted, border: `1px solid ${c.border}`, cursor: 'pointer',
              }}>{q}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Value props strip */}
      <div style={{ padding: '0 40px 40px', maxWidth: 1200, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[
            { icon: 'zap',     t: 'Instant',        d: 'No upload, zero wait',       hue: c.accent3 },
            { icon: 'shield',  t: 'Private',        d: 'Files never leave your tab', hue: c.accent4 },
            { icon: 'heart',   t: 'Free forever',   d: 'No ads, no paywalls',        hue: c.accent2 },
            { icon: 'github',  t: 'Open source',    d: 'MIT · 2.4k ★ on GitHub',     hue: c.accent  },
          ].map((v) => (
            <div key={v.t} style={{
              padding: 16, borderRadius: 12,
              background: c.surface, border: `1px solid ${c.border}`,
              display: 'flex', gap: 12, alignItems: 'flex-start',
            }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: v.hue + '22', color: v.hue, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TLIcon name={v.icon} size={16} strokeWidth={2}/>
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{v.t}</div>
                <div style={{ fontSize: 13, color: c.muted, marginTop: 2 }}>{v.d}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div style={{ padding: '0 40px 40px', maxWidth: 1200, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: -0.4 }}>Browse by category</h2>
          <a style={{ fontSize: 13, color: c.accent, cursor: 'pointer' }}>View all ›</a>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {TL_CATEGORIES.map((cat) => (
            <div key={cat.id} style={{
              padding: 18, borderRadius: 14,
              background: c.surface, border: `1px solid ${c.border}`,
              cursor: 'pointer', position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: -30, right: -30, width: 100, height: 100, borderRadius: '50%',
                background: `oklch(${theme === 'dark' ? '0.5' : '0.85'} 0.2 ${cat.hue})`, opacity: 0.15, filter: 'blur(10px)' }}/>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: `oklch(${theme === 'dark' ? '0.3' : '0.92'} 0.1 ${cat.hue})`,
                color: `oklch(${theme === 'dark' ? '0.85' : '0.5'} 0.2 ${cat.hue})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 12, position: 'relative',
              }}>
                <TLIcon name={cat.icon} size={18}/>
              </div>
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>{cat.name}</div>
              <div style={{ fontSize: 12, color: c.muted, marginBottom: 10 }}>{cat.desc}</div>
              <div style={{ fontSize: 12, color: c.dim, fontVariantNumeric: 'tabular-nums' }}>{cat.count} tools</div>
            </div>
          ))}
        </div>
      </div>

      {/* Popular this week */}
      <div style={{ padding: '0 40px 56px', maxWidth: 1200, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: -0.4 }}>Popular this week</h2>
          <span style={{ fontSize: 12, color: c.muted }}>updated 2h ago</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {featured.map((t, i) => (
            <div key={t.slug} style={{
              padding: 16, borderRadius: 12,
              background: c.surface, border: `1px solid ${c.border}`,
              display: 'flex', gap: 12, alignItems: 'flex-start', position: 'relative',
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: `oklch(${theme === 'dark' ? '0.3' : '0.92'} 0.1 ${t.cat.hue})`,
                color: `oklch(${theme === 'dark' ? '0.85' : '0.5'} 0.2 ${t.cat.hue})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <TLIcon name={t.cat.icon} size={18}/>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{t.name}</div>
                  <span style={{ fontSize: 10, color: c.accent3 }}>● trending</span>
                </div>
                <div style={{ fontSize: 12, color: c.muted, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.desc}</div>
                <div style={{ fontSize: 11, color: c.dim, marginTop: 6, fontVariantNumeric: 'tabular-nums' }}>{12400 - i * 800} runs · ↑ 24%</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '32px 40px', borderTop: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, color: c.muted, maxWidth: 1200, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <TLMascot size={32}/>
          <span>Made with <span style={{ color: c.accent2 }}>♥</span> for developers · MIT licensed</span>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <span>GitHub</span><span>Changelog</span><span>RSS</span>
        </div>
      </div>
    </PGShell>
  );
}

// ──────────────────────────────────────────────────────────────
// CATEGORIES
// ──────────────────────────────────────────────────────────────
function PGCategories({ theme = 'dark' }) {
  const c = pgColors(theme);
  return (
    <PGShell theme={theme} style={{ overflow: 'auto' }}>
      <PGNav theme={theme} active="categories"/>
      <div style={{ padding: '48px 40px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 13, color: c.muted, marginBottom: 8 }}>Home › <span style={{ color: c.text }}>Categories</span></div>
          <h1 style={{ fontSize: 44, fontWeight: 700, letterSpacing: -1, margin: '0 0 8px' }}>
            Categories<span style={{ color: c.muted, fontWeight: 500 }}> · 8</span>
          </h1>
          <p style={{ fontSize: 16, color: c.muted, margin: 0 }}>Every tool grouped by what it does. Pick a lane.</p>
        </div>

        {/* Quick filter bar */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <TLIcon name="search" size={16} color={c.muted} />
            <input placeholder="Filter categories…" style={{
              width: '100%', padding: '10px 14px 10px 38px', borderRadius: 10,
              background: c.surface, border: `1px solid ${c.border}`, color: c.text, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
            }}/>
            <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: c.muted }}>
              <TLIcon name="search" size={16}/>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 10, background: c.surface, border: `1px solid ${c.border}` }}>
            <div style={{ padding: '6px 12px', borderRadius: 6, background: c.surfaceHi, fontSize: 13, fontWeight: 500 }}>Grid</div>
            <div style={{ padding: '6px 12px', borderRadius: 6, fontSize: 13, color: c.muted }}>List</div>
          </div>
        </div>

        {/* Big category cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          {TL_CATEGORIES.map((cat) => {
            const tools = TL_TOOLS_BY_CAT[cat.id] || [];
            return (
              <div key={cat.id} style={{
                padding: 24, borderRadius: 16,
                background: c.surface, border: `1px solid ${c.border}`,
                position: 'relative', overflow: 'hidden', cursor: 'pointer',
              }}>
                <div aria-hidden style={{ position: 'absolute', top: -50, right: -50, width: 160, height: 160, borderRadius: '50%',
                  background: `radial-gradient(circle, oklch(0.6 0.2 ${cat.hue})40 0%, transparent 70%)`, filter: 'blur(30px)' }}/>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, position: 'relative' }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 12,
                    background: `oklch(${theme === 'dark' ? '0.3' : '0.9'} 0.12 ${cat.hue})`,
                    color: `oklch(${theme === 'dark' ? '0.85' : '0.5'} 0.2 ${cat.hue})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <TLIcon name={cat.icon} size={24} strokeWidth={1.8}/>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                      <div style={{ fontWeight: 700, fontSize: 18 }}>{cat.name}</div>
                      <span style={{ fontSize: 12, color: c.dim, fontVariantNumeric: 'tabular-nums' }}>{cat.count}</span>
                    </div>
                    <div style={{ fontSize: 13, color: c.muted, marginBottom: 12 }}>{cat.desc}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {tools.slice(0, 4).map((t) => (
                        <span key={t.slug} style={{
                          padding: '4px 10px', borderRadius: 6, fontSize: 12,
                          background: c.bg, color: c.muted, border: `1px solid ${c.border}`,
                        }}>{t.name}</span>
                      ))}
                      {tools.length > 4 && (
                        <span style={{ padding: '4px 10px', fontSize: 12, color: c.accent }}>+{tools.length - 4} more</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </PGShell>
  );
}

// ──────────────────────────────────────────────────────────────
// CATEGORY DETAIL (PDF Tools as example)
// ──────────────────────────────────────────────────────────────
function PGCategoryDetail({ theme = 'dark', catId = 'pdf' }) {
  const c = pgColors(theme);
  const cat = TL_CATEGORIES.find((x) => x.id === catId);
  const tools = TL_TOOLS_BY_CAT[catId] || [];
  const catColor = `oklch(${theme === 'dark' ? '0.8' : '0.5'} 0.2 ${cat.hue})`;
  return (
    <PGShell theme={theme} style={{ overflow: 'auto' }}>
      <PGNav theme={theme} active="categories"/>
      <div style={{ padding: '32px 40px 64px', maxWidth: 1200, margin: '0 auto' }}>
        {/* Breadcrumb */}
        <div style={{ fontSize: 13, color: c.muted, marginBottom: 24 }}>
          Home › <span>Categories</span> › <span style={{ color: c.text }}>{cat.name}</span>
        </div>

        {/* Category header */}
        <div style={{
          padding: 28, borderRadius: 20,
          background: `linear-gradient(135deg, oklch(${theme === 'dark' ? '0.25' : '0.95'} 0.1 ${cat.hue}) 0%, ${c.surface} 100%)`,
          border: `1px solid oklch(${theme === 'dark' ? '0.35' : '0.85'} 0.1 ${cat.hue})`,
          marginBottom: 32, position: 'relative', overflow: 'hidden',
        }}>
          <div aria-hidden style={{ position: 'absolute', top: -40, right: -40, width: 240, height: 240, borderRadius: '50%',
            background: `radial-gradient(circle, ${catColor}30 0%, transparent 70%)`, filter: 'blur(20px)' }}/>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{
              width: 72, height: 72, borderRadius: 18,
              background: `oklch(${theme === 'dark' ? '0.35' : '0.92'} 0.12 ${cat.hue})`,
              color: catColor,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <TLIcon name={cat.icon} size={36} strokeWidth={1.6}/>
            </div>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: 36, fontWeight: 700, letterSpacing: -0.8, margin: '0 0 6px' }}>{cat.name}</h1>
              <p style={{ fontSize: 15, color: c.muted, margin: 0 }}>{cat.desc} · {cat.count} tools, all free and client-side.</p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ padding: '10px 14px', borderRadius: 10, background: c.surface, border: `1px solid ${c.border}`, fontSize: 13, color: c.muted }}>★ Star category</div>
            </div>
          </div>
        </div>

        {/* Filter + search */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'center' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10,
            background: c.surface, border: `1px solid ${c.border}` }}>
            <TLIcon name="search" size={16} color={c.muted}/>
            <input placeholder={`Search ${cat.count} ${cat.name.toLowerCase()}…`} style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: c.text, fontSize: 14, fontFamily: 'inherit',
            }}/>
          </div>
          <div style={{ display: 'flex', gap: 6, padding: 4, borderRadius: 10, background: c.surface, border: `1px solid ${c.border}` }}>
            <span style={{ padding: '6px 10px', borderRadius: 6, fontSize: 12, color: c.muted }}>Popular</span>
            <span style={{ padding: '6px 10px', borderRadius: 6, fontSize: 12, background: c.surfaceHi, fontWeight: 500 }}>A–Z</span>
            <span style={{ padding: '6px 10px', borderRadius: 6, fontSize: 12, color: c.muted }}>New</span>
          </div>
        </div>

        {/* Tools grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {tools.map((t) => (
            <div key={t.slug} style={{
              padding: 16, borderRadius: 12,
              background: c.surface, border: `1px solid ${c.border}`,
              display: 'flex', flexDirection: 'column', gap: 8, cursor: 'pointer', position: 'relative',
            }}>
              {t.hot && (
                <div style={{ position: 'absolute', top: 12, right: 12, fontSize: 10, padding: '2px 6px', borderRadius: 4, background: c.accent3 + '22', color: c.accent3, fontWeight: 700, letterSpacing: 0.5 }}>HOT</div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: `oklch(${theme === 'dark' ? '0.3' : '0.92'} 0.1 ${cat.hue})`,
                  color: catColor, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <TLIcon name={cat.icon} size={16}/>
                </div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{t.name}</div>
              </div>
              <div style={{ fontSize: 13, color: c.muted, lineHeight: 1.4 }}>{t.desc}</div>
              <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8 }}>
                <span style={{ fontSize: 11, color: c.dim, fontVariantNumeric: 'tabular-nums' }}>~{Math.floor(Math.random() * 9 + 1)}k runs</span>
                <TLIcon name="chev-r" size={14} color={c.muted}/>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PGShell>
  );
}

Object.assign(window, { PG, PGCtx, usePG, pgColors, pgFont, pgDens, pgCardStyle, PGShell, PGNav, PGBadge, PGHome, PGCategories, PGCategoryDetail });
