'use client';

import Link from 'next/link';
import { useState } from 'react';
import { categories, getToolsByCategory } from '@/lib/tools';
import { ToolCardWrapper } from '@/components/tools/ToolCardWrapper';
import {
  type CategorySEO,
  generateCategoryStructuredData,
} from '@/lib/category-seo';
import { getToolById } from '@/lib/tools';
import {
  ChevronRight,
  ArrowRight,
  Star,
} from 'lucide-react';
import Script from 'next/script';
import { type Locale } from '@/lib/i18n/config';
import { type Dictionary } from '@/lib/i18n/get-dictionary';
import { useLocale } from '@/hooks/useLocale';
import { ToolIcon } from '@/components/ui/ToolIcon';
import { getCategoryTheme, catColor } from '@/lib/categoryTheme';

// ── Design tokens (match CategoriesHubContentSimple) ─────────────
const categoryGradients: Record<string, string> = {
  data: 'from-blue-500 to-cyan-500',
  encoding: 'from-emerald-500 to-green-500',
  base64: 'from-teal-500 to-cyan-500',
  text: 'from-purple-500 to-pink-500',
  web: 'from-pink-500 to-rose-500',
  dev: 'from-amber-500 to-orange-500',
  generators: 'from-orange-500 to-red-500',
  formatters: 'from-indigo-500 to-purple-500',
  social: 'from-rose-500 to-pink-500',
  pdf: 'from-red-600 to-orange-600',
};
// ──────────────────────────────────────────────────────────────────

interface LocaleCategoryPageContentProps {
  categoryId: string;
  locale: Locale;
  dictionary: Dictionary;
  seoContent: CategorySEO;
}

export default function LocaleCategoryPageContent({
  categoryId,
  locale,
  dictionary,
  seoContent,
}: LocaleCategoryPageContentProps) {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const { createHref } = useLocale();

  const category = categories.find((cat) => cat.id === categoryId);

  if (!category) {
    return <div>Category not found</div>;
  }

  const tools = getToolsByCategory(category.id);
  const structuredData = generateCategoryStructuredData(seoContent);
  const gradient = categoryGradients[categoryId] || 'from-violet-500 to-purple-500';

  const categoryDict = dictionary.categories[categoryId];
  const categoryName = categoryDict?.name || category.name;

  // Localized FAQs
  const getLocalizedFaqs = () => {
    if (locale === 'it') {
      const italianFaqs: Record<string, Array<{ question: string; answer: string }>> = {
        text: [
          {
            question: 'Quali formati di testo posso elaborare?',
            answer: 'I nostri strumenti supportano testo semplice, Markdown, HTML, e vari formati di codice con evidenziazione della sintassi e validazione in tempo reale.',
          },
          {
            question: 'Posso elaborare file di testo di grandi dimensioni?',
            answer: "Sì, puoi elaborare file fino a 50MB direttamente nel tuo browser. Tutta l'elaborazione avviene localmente per massima velocità e privacy.",
          },
          {
            question: 'È sicuro elaborare documenti sensibili?',
            answer: 'Assolutamente. Tutto avviene localmente nel tuo browser. I tuoi dati non lasciano mai il tuo dispositivo, garantendo completa privacy e sicurezza.',
          },
        ],
        data: [
          {
            question: 'Quali formati di file posso convertire?',
            answer: 'I nostri strumenti supportano JSON, CSV, XML, YAML, Base64 e formati di testo semplice con rilevamento automatico e validazione.',
          },
          {
            question: "C'è un limite di dimensione del file?",
            answer: "Puoi elaborare file fino a 50MB direttamente nel tuo browser. Tutta l'elaborazione avviene localmente per massima velocità e privacy.",
          },
          {
            question: 'Quanto è sicuro il processo di conversione?',
            answer: 'Tutte le conversioni avvengono localmente nel tuo browser. I tuoi dati non lasciano mai il tuo dispositivo, garantendo completa privacy e sicurezza.',
          },
        ],
        encoding: [
          {
            question: 'Quali standard di codifica supportate?',
            answer: 'Supportiamo Base64, URL encoding, JWT, hash (SHA, MD5, bcrypt) e molti altri standard di codifica e sicurezza.',
          },
          {
            question: 'Posso decodificare token JWT?',
            answer: 'Sì, il nostro JWT Decoder analizza e visualizza header, payload e signature. Ricorda che tutti i processi avvengono localmente nel tuo browser.',
          },
          {
            question: 'Come funziona la generazione di hash?',
            answer: 'Supportiamo vari algoritmi (MD5, SHA-1, SHA-256, SHA-512, bcrypt). Tutti gli hash vengono generati localmente nel tuo browser per massima sicurezza.',
          },
        ],
        generators: [
          {
            question: 'Quali tipi di dati posso generare?',
            answer: 'Puoi generare UUID, password sicure, hash, colori, QR code, dati mock e molto altro con opzioni personalizzabili.',
          },
          {
            question: 'I dati generati sono sicuri da usare?',
            answer: 'Sì, utilizziamo algoritmi crittografici sicuri. UUID e password sono generati con entropia elevata per massima sicurezza.',
          },
          {
            question: 'Posso personalizzare le opzioni di generazione?',
            answer: 'Assolutamente! Ogni generatore offre opzioni avanzate per lunghezza, caratteri speciali, formati e altri parametri specifici.',
          },
        ],
        dev: [
          {
            question: 'Quali utilità per sviluppatori offrite?',
            answer: 'Offriamo crontab builder, regex tester, diff checker, validatori di codice e molti altri strumenti essenziali per lo sviluppo.',
          },
          {
            question: 'Posso testare espressioni regolari complesse?',
            answer: 'Sì, il nostro Regex Tester supporta tutti i pattern con evidenziazione dei match in tempo reale, spiegazioni e test cases.',
          },
          {
            question: 'Il crontab builder supporta tutti i formati?',
            answer: 'Sì, supporta la sintassi standard cron con validazione in tempo reale e descrizioni leggibili delle espressioni generate.',
          },
        ],
        pdf: [
          {
            question: 'Quanto è accurata la conversione da PDF a Word?',
            answer: 'Il nostro convertitore PDF to Word utilizza algoritmi avanzati per preservare formattazione, immagini, tabelle e layout del testo con oltre il 90% di accuratezza.',
          },
          {
            question: 'Quali sono i limiti di dimensione del file?',
            answer: "Puoi elaborare file PDF fino a 10MB. Tutte le conversioni avvengono su server sicuri con pulizia automatica dopo l'elaborazione.",
          },
          {
            question: 'I miei dati sono sicuri durante la conversione?',
            answer: "Sì, tutte le conversioni avvengono su server sicuri con trasmissione crittografata. I file vengono automaticamente eliminati dopo l'elaborazione.",
          },
        ],
      };
      return italianFaqs[categoryId] || seoContent.faqs;
    }

    if (locale === 'es') {
      const spanishFaqs: Record<string, Array<{ question: string; answer: string }>> = {
        pdf: [
          {
            question: '¿Qué tan precisa es la conversión de PDF a Word?',
            answer: 'Nuestro convertidor de PDF a Word utiliza algoritmos avanzados para preservar el formato, imágenes, tablas y diseño del texto con más del 90% de precisión.',
          },
          {
            question: '¿Cuáles son los límites de tamaño de archivo?',
            answer: 'Puedes procesar archivos PDF de hasta 10MB. Todas las conversiones se realizan en servidores seguros con limpieza automática después del procesamiento.',
          },
          {
            question: '¿Mis datos están seguros durante la conversión?',
            answer: 'Sí, todas las conversiones se realizan en servidores seguros con transmisión encriptada. Los archivos se eliminan automáticamente después del procesamiento.',
          },
        ],
      };
      return spanishFaqs[categoryId] || seoContent.faqs;
    }

    if (locale === 'fr') {
      const frenchFaqs: Record<string, Array<{ question: string; answer: string }>> = {
        pdf: [
          {
            question: 'Quelle est la précision de la conversion PDF vers Word ?',
            answer: "Notre convertisseur PDF vers Word utilise des algorithmes avancés pour préserver la mise en forme avec plus de 90% de précision.",
          },
          {
            question: 'Quelles sont les limites de taille de fichier ?',
            answer: "Vous pouvez traiter des fichiers PDF jusqu'à 10MB sur des serveurs sécurisés avec nettoyage automatique.",
          },
          {
            question: 'Mes données sont-elles sécurisées pendant la conversion ?',
            answer: "Oui, toutes les conversions se font sur des serveurs sécurisés. Les fichiers sont automatiquement supprimés après le traitement.",
          },
        ],
      };
      return frenchFaqs[categoryId] || seoContent.faqs;
    }

    if (locale === 'de') {
      const germanFaqs: Record<string, Array<{ question: string; answer: string }>> = {
        pdf: [
          {
            question: 'Wie genau ist die PDF-zu-Word-Konvertierung?',
            answer: 'Unser PDF-zu-Word-Konverter verwendet fortschrittliche Algorithmen mit über 90% Genauigkeit.',
          },
          {
            question: 'Welche Dateigrößenlimits gibt es?',
            answer: 'Sie können PDF-Dateien bis zu 10MB auf sicheren Servern verarbeiten.',
          },
          {
            question: 'Sind meine Daten während der Konvertierung sicher?',
            answer: 'Ja, alle Konvertierungen erfolgen auf sicheren Servern. Dateien werden nach der Verarbeitung automatisch gelöscht.',
          },
        ],
      };
      return germanFaqs[categoryId] || seoContent.faqs;
    }

    return seoContent.faqs;
  };

  const localizedFaqs = getLocalizedFaqs();

  const getToolLabelForTool = (toolId: string) => {
    const tool = getToolById(toolId);
    return tool?.label || '';
  };

  const popularTools = tools.filter(
    (tool) => getToolLabelForTool(tool.id) === 'popular'
  );
  const otherTools = tools.filter((tool) => {
    const label = getToolLabelForTool(tool.id);
    return !label || (label !== 'popular' && label !== 'coming-soon' && label !== 'test');
  });

  const totalTools = categories.reduce((sum, c) => sum + c.tools.length, 0);

  // Localized text
  const t = {
    home: 'Home',
    categories: dictionary.common?.nav?.categories || 'Categories',
    tools: dictionary.common?.nav?.allTools || 'Tools',
    popularTitle: locale === 'it' ? 'Più Popolari' : locale === 'es' ? 'Más Populares' : locale === 'fr' ? 'Les Plus Populaires' : locale === 'de' ? 'Beliebteste' : locale === 'pt' ? 'Mais Populares' : 'Most Popular',
    topPicks: locale === 'it' ? 'I Migliori' : locale === 'es' ? 'Top' : locale === 'fr' ? 'Top' : locale === 'de' ? 'Top' : locale === 'pt' ? 'Destaques' : 'Top Picks',
    allTools: locale === 'it' ? `Tutti gli Strumenti ${categoryName}` : locale === 'es' ? `Todas las Herramientas de ${categoryName}` : locale === 'fr' ? `Tous les Outils ${categoryName}` : locale === 'de' ? `Alle ${categoryName}-Tools` : locale === 'pt' ? `Todas as Ferramentas de ${categoryName}` : `All ${categoryName} Tools`,
    faqTitle: locale === 'it' ? `Domande Frequenti sugli Strumenti ${categoryName}` : locale === 'es' ? `Preguntas Frecuentes sobre las Herramientas de ${categoryName}` : locale === 'fr' ? `Questions Fréquentes sur les Outils ${categoryName}` : locale === 'de' ? `Häufig gestellte Fragen zu ${categoryName}-Tools` : locale === 'pt' ? `Perguntas Frequentes sobre Ferramentas de ${categoryName}` : `Frequently Asked Questions about ${categoryName} Tools`,
    relatedCategories: locale === 'it' ? 'Categorie Correlate' : locale === 'es' ? 'Categorías Relacionadas' : locale === 'fr' ? 'Catégories Associées' : locale === 'de' ? 'Verwandte Kategorien' : locale === 'pt' ? 'Categorias Relacionadas' : 'Related Categories',
    ctaTitle: locale === 'it' ? 'Cerchi altri strumenti?' : locale === 'es' ? '¿Buscas más herramientas?' : locale === 'fr' ? 'Vous cherchez plus d\'outils ?' : locale === 'de' ? 'Weitere Tools gesucht?' : locale === 'pt' ? 'Procurando mais ferramentas?' : 'Looking for more tools?',
    ctaDesc: locale === 'it' ? `Sfoglia tutti i ${totalTools}+ strumenti disponibili.` : locale === 'es' ? `Explora todas las ${totalTools}+ herramientas disponibles.` : locale === 'fr' ? `Parcourez tous les ${totalTools}+ outils disponibles.` : locale === 'de' ? `Durchsuchen Sie alle ${totalTools}+ verfügbaren Tools.` : locale === 'pt' ? `Navegue por todas as ${totalTools}+ ferramentas disponíveis.` : `Browse all ${totalTools}+ tools across every category.`,
    ctaBtn: locale === 'it' ? 'Tutti gli Strumenti' : locale === 'es' ? 'Ver todos los herramientas' : locale === 'fr' ? 'Voir tous les outils' : locale === 'de' ? 'Alle Tools durchsuchen' : locale === 'pt' ? 'Ver todas as ferramentas' : 'Browse all tools',
    perfectFor: locale === 'it' ? 'Perfetto per:' : locale === 'es' ? 'Perfecto para:' : locale === 'fr' ? 'Parfait pour:' : locale === 'de' ? 'Perfekt für:' : locale === 'pt' ? 'Perfeito para:' : 'Perfect for:',
  };

  return (
    <>
      <Script
        id="category-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            ...structuredData,
            name: categoryName,
            inLanguage: locale === 'it' ? 'it-IT' : locale === 'es' ? 'es-ES' : locale === 'fr' ? 'fr-FR' : locale === 'de' ? 'de-DE' : locale === 'pt' ? 'pt-PT' : 'en-US',
          }),
        }}
      />

      <div className="min-h-screen bg-[color:var(--pg-bg)]">
        {/* ── HERO ──────────────────────────────────────────────────── */}
        {(() => { const _theme = getCategoryTheme(category.id); return (
        <section className="pg-container pb-6 pt-8">
          <nav className="mb-4 flex text-[13px] text-pg-muted" aria-label="Breadcrumb">
            <ol className="flex items-center gap-2">
              <li><Link href={createHref('/')} className="hover:text-pg-text">{t.home}</Link></li>
              <li><ChevronRight className="h-3.5 w-3.5" /></li>
              <li><Link href={createHref('/categories')} className="hover:text-pg-text">{t.categories}</Link></li>
              <li><ChevronRight className="h-3.5 w-3.5" /></li>
              <li className="font-medium text-pg-text">{categoryName}</li>
            </ol>
          </nav>

          <div
            className="relative overflow-hidden rounded-pg-hero p-7"
            style={{
              background: `linear-gradient(135deg, ${catColor(_theme.hue, 'bgHero', 'dark')} 0%, var(--pg-surface) 100%)`,
              border: `1px solid ${catColor(_theme.hue, 'borderHero', 'dark')}`,
            }}
          >
            <span
              aria-hidden
              className="pointer-events-none absolute -right-10 -top-10 h-60 w-60 rounded-full opacity-25 blur-2xl"
              style={{ background: catColor(_theme.hue, 'text', 'dark') }}
            />
            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
              <span
                className="flex h-[72px] w-[72px] flex-shrink-0 items-center justify-center rounded-[18px]"
                style={{
                  background: catColor(_theme.hue, 'bgChip', 'dark'),
                  color: catColor(_theme.hue, 'text', 'dark'),
                }}
              >
                <_theme.icon className="h-9 w-9" strokeWidth={1.6} />
              </span>
              <div className="flex-1">
                <h1 className="text-[clamp(28px,4vw,36px)] font-bold leading-tight tracking-[-0.02em] text-pg-text">
                  {categoryName}
                </h1>
                <p className="mt-1 text-[15px] text-pg-muted">
                  {seoContent.tagline || category.description}
                </p>
                <p className="mt-1 text-[13px] text-pg-dim">
                  {tools.length} tools · all free and client-side.
                </p>
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-pg-card border border-pg-border bg-pg-surface px-3.5 py-2.5 text-[13px] text-pg-muted transition-colors hover:border-pg-border-hi hover:text-pg-text"
              >
                <Star className="h-3.5 w-3.5" /> Star category
              </button>
            </div>

            {seoContent.benefits && seoContent.benefits.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {seoContent.benefits.slice(0, 4).map((benefit, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1.5 rounded-full border border-pg-border bg-pg-surface px-3 py-1 text-[12px] text-pg-muted"
                  >
                    <span className="h-1 w-1 rounded-full bg-pg-accent" />
                    {benefit}
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>
        ); })()}

        {/* ── TOOLS ──────────────────────────────────────────────────── */}
        <section className="pg-container pb-16">

          {/* Popular Tools */}
          {popularTools.length > 0 && (
            <div className="mb-10 mt-8">
              <div className="mb-4 flex items-center gap-3">
                <h2 className="text-[18px] font-semibold text-pg-text sm:text-[20px]">
                  {t.popularTitle}
                </h2>
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide"
                  style={{
                    background: 'color-mix(in oklab, var(--pg-accent-3) 22%, transparent)',
                    color: 'var(--pg-accent-3)',
                  }}
                >
                  <Star className="h-3 w-3 fill-current" />
                  {t.topPicks}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {popularTools.map((tool) => (
                  <ToolCardWrapper key={tool.id} tool={tool} />
                ))}
              </div>
            </div>
          )}

          {/* Other Tools */}
          {otherTools.length > 0 && (
            <div className="mb-10 mt-8">
              <h2 className="mb-4 text-[18px] font-semibold text-pg-text sm:text-[20px]">
                {t.allTools}
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {otherTools.map((tool) => (
                  <ToolCardWrapper key={tool.id} tool={tool} />
                ))}
              </div>
            </div>
          )}

          {/* ── FAQ ──────────────────────────────────────────────────── */}
          {localizedFaqs && localizedFaqs.length > 0 && (
            <section className="mt-4 rounded-pg-panel border border-pg-border bg-pg-surface p-6">
              <h2 className="mb-5 text-[18px] font-semibold text-pg-text">
                {t.faqTitle}
              </h2>
              <div className="space-y-0">
                {localizedFaqs.map((faq, index) => (
                  <div
                    key={index}
                    className="border-b border-pg-border last:border-0"
                  >
                    <button
                      onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                      className="flex w-full items-start justify-between gap-4 py-4 text-left"
                    >
                      <h3 className="text-[14px] font-medium text-pg-text">
                        {faq.question}
                      </h3>
                      <ChevronRight
                        className={`mt-0.5 h-4 w-4 flex-shrink-0 text-pg-muted transition-transform duration-200 ${
                          expandedFaq === index ? 'rotate-90 text-pg-accent' : ''
                        }`}
                      />
                    </button>
                    {expandedFaq === index && (
                      <p className="pb-4 text-[14px] leading-relaxed text-pg-muted">
                        {faq.answer}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── RELATED CATEGORIES ───────────────────────────────────── */}
          {seoContent.relatedCategories && seoContent.relatedCategories.length > 0 && (
            <section className="mt-8">
              <h2 className="mb-3 text-[16px] font-semibold text-pg-text">
                {t.relatedCategories}
              </h2>
              <div className="flex flex-wrap gap-2">
                {seoContent.relatedCategories.map((relatedId) => {
                  const relatedCategory = categories.find((c) => c.id === relatedId);
                  if (!relatedCategory) return null;
                  const relTheme = getCategoryTheme(relatedId);
                  const relatedName = dictionary.categories[relatedId]?.name || relatedCategory.name;
                  return (
                    <Link
                      key={relatedId}
                      href={createHref(`/category/${relatedId}`)}
                      className="inline-flex items-center gap-2 rounded-pg-card border border-pg-border bg-pg-surface px-3 py-2 text-[13px] text-pg-muted transition-colors hover:border-pg-border-hi hover:text-pg-text"
                    >
                      <span
                        className="inline-flex h-6 w-6 items-center justify-center rounded-md"
                        style={{
                          background: catColor(relTheme.hue, 'bgChip', 'dark'),
                          color: catColor(relTheme.hue, 'text', 'dark'),
                        }}
                      >
                        <relTheme.icon className="h-3.5 w-3.5" strokeWidth={1.8} />
                      </span>
                      <span>{relatedName}</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── CTA ──────────────────────────────────────────────────── */}
          <section className="mt-12 rounded-pg-panel border border-pg-border bg-pg-surface p-8 text-center">
            <h2 className="mb-2 text-[24px] font-bold text-pg-text">{t.ctaTitle}</h2>
            <p className="mb-6 text-pg-muted">{t.ctaDesc}</p>
            <Link
              href={createHref('/tools')}
              className="inline-flex items-center gap-2 rounded-pg-card px-6 py-3 text-[14px] font-semibold text-white shadow-[var(--pg-shadow-search-glow)] transition-transform hover:-translate-y-0.5"
              style={{
                backgroundImage: 'linear-gradient(135deg, var(--pg-accent) 0%, var(--pg-accent-2) 100%)',
              }}
            >
              {t.ctaBtn}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </section>
        </section>
      </div>
    </>
  );
}
