// ============================================================
// DIRECTION A — "Playground" — Tool Page + The Lab
// ============================================================

// Tool page — JPG to PDF style but with a big workarea and minimal SEO chrome.
function PGToolPage({ theme = 'dark', state = 'empty' }) {
  const c = pgColors(theme);
  return (
    <PGShell theme={theme} style={{ overflow: 'auto' }}>
      <PGNav theme={theme} active="tools"/>
      <div style={{ padding: '20px 40px 40px', maxWidth: 1280, margin: '0 auto' }}>
        {/* Tight breadcrumb */}
        <div style={{ fontSize: 12, color: c.muted, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>Home</span><span>›</span>
          <span style={{ color: `oklch(${theme === 'dark' ? '0.8' : '0.5'} 0.2 8)` }}>PDF Tools</span><span>›</span>
          <span style={{ color: c.text }}>JPG to PDF</span>
        </div>

        {/* Compact header — title + tagline + actions inline */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: `oklch(${theme === 'dark' ? '0.3' : '0.92'} 0.12 8)`,
            color: `oklch(${theme === 'dark' ? '0.8' : '0.5'} 0.2 8)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <TLIcon name="doc" size={22} strokeWidth={1.8}/>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.5, margin: 0 }}>JPG to PDF</h1>
              <PGBadge hue={8} theme={theme}>PDF Tools</PGBadge>
              <span style={{ fontSize: 12, color: c.dim }}>·</span>
              <span style={{ fontSize: 12, color: c.dim, fontVariantNumeric: 'tabular-nums' }}>8.2k runs this month</span>
            </div>
            <div style={{ fontSize: 14, color: c.muted, marginTop: 2 }}>Convert JPG & JPEG images to PDF with custom page sizes.</div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <div style={{ padding: '8px 10px', borderRadius: 8, background: c.surface, border: `1px solid ${c.border}`, fontSize: 12, color: c.muted, display: 'flex', alignItems: 'center', gap: 6 }}>
              <TLIcon name="star" size={14}/> Save
            </div>
            <div style={{ padding: '8px 10px', borderRadius: 8, background: c.surface, border: `1px solid ${c.border}`, fontSize: 12, color: c.muted, display: 'flex', alignItems: 'center', gap: 6 }}>
              <TLIcon name="arrow" size={14}/> Share
            </div>
          </div>
        </div>

        {/* Main workarea — big 2-col, tool dominates */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16 }}>
          {/* LEFT — the actual tool */}
          <div style={{
            background: c.surface, border: `1px solid ${c.border}`, borderRadius: 16,
            overflow: 'hidden', display: 'flex', flexDirection: 'column',
            boxShadow: '0 20px 60px -24px rgba(0,0,0,.3)',
          }}>
            {/* Tool toolbar */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px',
              borderBottom: `1px solid ${c.border}`, background: c.bg2,
            }}>
              <div style={{ display: 'flex', gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: 5, background: '#ff5f57' }}/>
                <span style={{ width: 10, height: 10, borderRadius: 5, background: '#febc2e' }}/>
                <span style={{ width: 10, height: 10, borderRadius: 5, background: '#28c840' }}/>
              </div>
              <div style={{ fontSize: 12, color: c.muted, marginLeft: 8 }}>workspace.jpg2pdf</div>
              <div style={{ flex: 1 }}/>
              <div style={{ fontSize: 11, color: c.dim, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: 3, background: c.accent4 }}/>
                offline · files stay local
              </div>
            </div>

            {/* Dropzone / canvas */}
            {state === 'empty' ? (
              <div style={{
                margin: 20, padding: '80px 20px', borderRadius: 14,
                border: `2px dashed ${c.borderHi}`, background: c.bg2,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14,
                minHeight: 380,
              }}>
                <div style={{ position: 'relative' }}>
                  <TLMascot size={100} mood="happy"/>
                  <div style={{ position: 'absolute', top: -6, right: -30, background: c.surface, border: `1px solid ${c.borderHi}`, borderRadius: 12, padding: '6px 10px', fontSize: 12, whiteSpace: 'nowrap' }}>
                    Drop your JPGs! <span style={{ color: c.accent2 }}>✨</span>
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>Drop JPGs here</div>
                  <div style={{ fontSize: 13, color: c.muted }}>or <span style={{ color: c.accent, textDecoration: 'underline' }}>browse files</span> · up to 10MB each</div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                  {['JPG', 'JPEG', 'PNG→JPG'].map((f) => (
                    <span key={f} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, background: c.surface, color: c.muted, border: `1px solid ${c.border}`, fontFamily: pgFont('mono') }}>{f}</span>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ padding: 20, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, minHeight: 380 }}>
                {[1,2,3,4,5,6,7,8].map((i) => (
                  <div key={i} style={{
                    aspectRatio: '3/4', borderRadius: 10, border: `1px solid ${c.border}`,
                    background: `linear-gradient(135deg, oklch(0.6 0.2 ${i * 40}) 0%, oklch(0.7 0.2 ${i * 40 + 30}) 100%)`,
                    position: 'relative', overflow: 'hidden',
                  }}>
                    <div style={{ position: 'absolute', top: 6, left: 6, background: 'rgba(0,0,0,.6)', color: '#fff', fontSize: 10, padding: '2px 6px', borderRadius: 4, fontFamily: pgFont('mono') }}>{String(i).padStart(2, '0')}</div>
                    <div style={{ position: 'absolute', bottom: 6, left: 6, right: 6, fontSize: 10, color: '#fff', opacity: .8, fontFamily: pgFont('mono') }}>img_{String(i).padStart(3, '0')}.jpg</div>
                  </div>
                ))}
              </div>
            )}

            {/* Settings bar */}
            <div style={{ padding: 16, borderTop: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              {[
                { l: 'Page size', v: 'A4' },
                { l: 'Orientation', v: 'Portrait' },
                { l: 'Fit', v: 'Contain' },
                { l: 'Margin', v: '12mm' },
              ].map((s) => (
                <div key={s.l} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <div style={{ fontSize: 10, color: c.dim, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.l}</div>
                  <div style={{ fontSize: 13, padding: '6px 10px', borderRadius: 8, background: c.bg2, border: `1px solid ${c.border}`, minWidth: 90, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {s.v}<TLIcon name="chev-d" size={12} color={c.muted}/>
                  </div>
                </div>
              ))}
              <div style={{ flex: 1 }}/>
              <div style={{
                padding: '12px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600,
                background: state === 'empty' ? c.surfaceHi : `linear-gradient(135deg, ${c.accent} 0%, ${c.accent2} 100%)`,
                color: state === 'empty' ? c.dim : '#fff',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <TLIcon name="download" size={14}/>
                Generate PDF {state === 'empty' ? '(0)' : '(8 images)'}
              </div>
            </div>
          </div>

          {/* RIGHT — related tools + tip */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ padding: 14, borderRadius: 12, background: c.surface, border: `1px solid ${c.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Related tools</div>
              {TL_TOOLS_BY_CAT.pdf.slice(1, 5).map((t) => (
                <div key={t.slug} style={{ padding: '8px 0', display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${c.border}` }}>
                  <div style={{ width: 28, height: 28, borderRadius: 6,
                    background: `oklch(${theme === 'dark' ? '0.3' : '0.92'} 0.1 8)`,
                    color: `oklch(${theme === 'dark' ? '0.8' : '0.5'} 0.2 8)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <TLIcon name="doc" size={14}/>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 500 }}>{t.name}</div>
                    <div style={{ fontSize: 11, color: c.dim, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ padding: 14, borderRadius: 12, background: `linear-gradient(135deg, ${c.accent2}22 0%, ${c.accent3}22 100%)`, border: `1px solid ${c.accent2}33` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <TLMascot size={28}/>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Pro tip</div>
              </div>
              <div style={{ fontSize: 12, color: c.muted, lineHeight: 1.5 }}>Drag files in any order — then reorder them by dragging the thumbnails.</div>
            </div>
            <div style={{ padding: 14, borderRadius: 12, background: c.surface, border: `1px solid ${c.border}` }}>
              <div style={{ fontSize: 12, color: c.muted, marginBottom: 8 }}>Keyboard</div>
              {[
                { k: '⌘ O', d: 'Open files' },
                { k: '⌘ Enter', d: 'Generate' },
                { k: '⌘ K', d: 'Search tools' },
              ].map((s) => (
                <div key={s.k} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 12 }}>
                  <span style={{ color: c.muted }}>{s.d}</span>
                  <span style={{ fontFamily: pgFont('mono'), color: c.text }}>{s.k}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PGShell>
  );
}

// The Lab — experimental/featured
function PGLab({ theme = 'dark' }) {
  const c = pgColors(theme);
  const experiments = [
    { name: 'AI Regex Builder',   desc: 'Describe what you want to match, get the regex',     tag: 'beta',     hue: 280 },
    { name: 'Image Background Remover', desc: 'One click, fully local, no upload',            tag: 'new',      hue: 200 },
    { name: 'SVG Animator',       desc: 'Animate SVG paths with a timeline UI',               tag: 'alpha',    hue: 45 },
    { name: 'Color Palette Gen',  desc: 'Extract palettes from any image, OKLCH ready',       tag: 'stable',   hue: 150 },
    { name: 'Markdown ↔ Slides',  desc: 'Turn markdown into a presentation, live preview',    tag: 'beta',     hue: 330 },
    { name: 'Database Schema Viz',desc: 'Paste SQL, get an ER diagram',                       tag: 'alpha',    hue: 8 },
  ];
  return (
    <PGShell theme={theme} style={{ overflow: 'auto' }}>
      <PGNav theme={theme} active="lab"/>
      <div style={{ padding: '48px 40px 64px', maxWidth: 1200, margin: '0 auto', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20, marginBottom: 40 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 999,
              background: `${c.accent2}22`, color: c.accent2, fontSize: 12, fontWeight: 600, marginBottom: 12 }}>
              <TLIcon name="sparkles" size={12}/> EXPERIMENTAL
            </div>
            <h1 style={{ fontSize: 52, fontWeight: 700, letterSpacing: -1.5, margin: '0 0 10px', lineHeight: 1 }}>
              The Lab
            </h1>
            <p style={{ fontSize: 17, color: c.muted, maxWidth: 520, margin: 0 }}>
              Where we cook up weird, ambitious tools. Some will graduate — others will blow up. All of them run locally.
            </p>
          </div>
          <TLMascot size={140} mood="curious"/>
        </div>

        {/* Featured big card */}
        <div style={{
          padding: 32, borderRadius: 20, marginBottom: 24,
          background: `linear-gradient(135deg, ${c.accent}33 0%, ${c.accent2}33 50%, ${c.accent3}22 100%)`,
          border: `1px solid ${c.borderHi}`, position: 'relative', overflow: 'hidden',
        }}>
          <div aria-hidden style={{ position: 'absolute', top: -60, right: -60, width: 300, height: 300, borderRadius: '50%',
            background: `radial-gradient(circle, ${c.accent2}60 0%, transparent 70%)`, filter: 'blur(40px)' }}/>
          <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24, alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 11, color: c.accent3, fontWeight: 700, letterSpacing: 1, marginBottom: 10 }}>⚡ FEATURED THIS MONTH</div>
              <h2 style={{ fontSize: 30, fontWeight: 700, letterSpacing: -0.6, margin: '0 0 10px' }}>AI Regex Builder</h2>
              <p style={{ fontSize: 15, color: c.muted, margin: '0 0 20px', lineHeight: 1.5 }}>
                Describe the pattern in plain English. We'll give you the regex, a live test bed, and explain each group.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ padding: '10px 16px', borderRadius: 10, background: c.text, color: c.bg, fontSize: 13, fontWeight: 600 }}>Try it →</div>
                <div style={{ padding: '10px 16px', borderRadius: 10, background: 'transparent', border: `1px solid ${c.borderHi}`, fontSize: 13, color: c.text }}>How it works</div>
              </div>
            </div>
            <div style={{ background: c.bg, borderRadius: 12, padding: 16, fontFamily: pgFont('mono'), fontSize: 12, border: `1px solid ${c.border}` }}>
              <div style={{ color: c.dim, marginBottom: 8 }}># describe</div>
              <div style={{ color: c.text, marginBottom: 12 }}>email addresses from common providers</div>
              <div style={{ color: c.dim, marginBottom: 8 }}># regex</div>
              <div style={{ color: c.accent4 }}>/^[\w.-]+@(gmail|outlook|yahoo)\.\w+$/</div>
            </div>
          </div>
        </div>

        {/* Grid of experiments */}
        <div style={{ fontSize: 13, color: c.muted, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.8 }}>All experiments</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {experiments.map((e) => (
            <div key={e.name} style={{
              padding: 18, borderRadius: 14,
              background: c.surface, border: `1px solid ${c.border}`, position: 'relative', overflow: 'hidden',
            }}>
              <div aria-hidden style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%',
                background: `oklch(0.6 0.2 ${e.hue})40`, filter: 'blur(20px)' }}/>
              <div style={{ position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: `oklch(${theme === 'dark' ? '0.3' : '0.92'} 0.1 ${e.hue})`,
                    color: `oklch(${theme === 'dark' ? '0.85' : '0.5'} 0.2 ${e.hue})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <TLIcon name="sparkles" size={16}/>
                  </div>
                  <span style={{
                    fontSize: 10, padding: '3px 8px', borderRadius: 4, fontWeight: 700, letterSpacing: 0.5,
                    background: e.tag === 'alpha' ? c.accent2 + '22' : e.tag === 'beta' ? c.accent3 + '22' : e.tag === 'new' ? c.accent + '22' : c.accent4 + '22',
                    color: e.tag === 'alpha' ? c.accent2 : e.tag === 'beta' ? c.accent3 : e.tag === 'new' ? c.accent : c.accent4,
                  }}>{e.tag.toUpperCase()}</span>
                </div>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{e.name}</div>
                <div style={{ fontSize: 13, color: c.muted, lineHeight: 1.4 }}>{e.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Suggestion box */}
        <div style={{
          marginTop: 32, padding: 24, borderRadius: 16,
          background: c.surface, border: `1px dashed ${c.borderHi}`,
          display: 'flex', alignItems: 'center', gap: 20,
        }}>
          <TLMascot size={64} mood="happy"/>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>Got an idea for a tool?</div>
            <div style={{ fontSize: 13, color: c.muted }}>Drop it on GitHub — the weirder, the better. Top voted ideas ship next.</div>
          </div>
          <div style={{ padding: '10px 16px', borderRadius: 10, background: c.text, color: c.bg, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            <TLIcon name="github" size={14}/> Suggest a tool
          </div>
        </div>
      </div>
    </PGShell>
  );
}

Object.assign(window, { PGToolPage, PGLab });
