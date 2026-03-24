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

      <div className="min-h-screen bg-background">
        {/* Grid pattern */}
        <div
          className="fixed inset-0 opacity-50"
          style={{
            backgroundImage: `
              linear-gradient(rgba(139,92,246,0.035) 1px, transparent 1px),
              linear-gradient(90deg, rgba(139,92,246,0.035) 1px, transparent 1px)
            `,
            backgroundSize: '64px 64px',
            pointerEvents: 'none',
          }}
        />

        {/* ── HERO ──────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden pb-6 pt-4 sm:pb-8 sm:pt-5">
          {/* Ambient glows */}
          <div className="pointer-events-none absolute -left-32 -top-16 h-64 w-64 rounded-full bg-violet-600/10 blur-3xl" />
          <div className="pointer-events-none absolute -right-32 top-0 h-56 w-56 rounded-full bg-amber-500/[0.07] blur-3xl" />

          <div className="relative z-10 mx-auto max-w-7xl px-4">
            {/* Breadcrumb */}
            <nav className="mb-3 flex" aria-label="Breadcrumb">
              <ol className="flex items-center gap-2 text-sm">
                <li>
                  <Link href={createHref('/')} className="text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
                    {t.home}
                  </Link>
                </li>
                <li><ChevronRight className="h-3.5 w-3.5 text-slate-400" /></li>
                <li>
                  <Link href={createHref('/categories')} className="text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
                    {t.categories}
                  </Link>
                </li>
                <li><ChevronRight className="h-3.5 w-3.5 text-slate-400" /></li>
                <li className="font-medium text-slate-900 dark:text-white">{categoryName}</li>
              </ol>
            </nav>

            {/* Category badge + icon */}
            <div className="mb-3 flex items-center gap-3">
              <div className={`inline-flex rounded-xl bg-gradient-to-br ${gradient} p-3 text-white shadow-lg`}>
                <span className="text-xl leading-none">{category.icon}</span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/25 bg-violet-500/10 px-3 py-1">
                <span className="font-mono text-xs font-medium uppercase tracking-widest text-violet-600 dark:text-violet-300">
                  {tools.length} tools
                </span>
              </div>
            </div>

            {/* H1 */}
            <h1 className="mb-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              {seoContent.h1Title.includes(category.name) ? (
                <>
                  {seoContent.h1Title.split(category.name)[0]}
                  <span className={`bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
                    {categoryName}
                  </span>
                  {seoContent.h1Title.split(category.name)[1] || ''}
                </>
              ) : (
                <span className={`bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
                  {categoryName}
                </span>
              )}
            </h1>

            {/* Tagline */}
            <p className="mb-2 text-base font-medium text-slate-700 dark:text-slate-300 sm:text-lg">
              {seoContent.tagline}
            </p>

            {/* Description */}
            <p className="mb-4 max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-400 md:line-clamp-none line-clamp-3">
              {seoContent.description}
            </p>

            {/* Benefits chips */}
            {seoContent.benefits && seoContent.benefits.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {seoContent.benefits.slice(0, 4).map((benefit, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs text-slate-700 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-slate-300"
                  >
                    <span className="h-1 w-1 rounded-full bg-violet-400" />
                    {benefit}
                  </span>
                ))}
              </div>
            )}

            {/* Use cases */}
            {seoContent.useCases && seoContent.useCases.length > 0 && (
              <div className="hidden flex-wrap items-center gap-x-2 gap-y-1 md:flex">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-500">
                  {t.perfectFor}
                </span>
                {seoContent.useCases.map((useCase, index) => (
                  <span key={index} className="text-xs text-slate-500 dark:text-slate-500">
                    {useCase}{index < seoContent.useCases.length - 1 && <span className="ml-2 text-slate-300 dark:text-slate-700">·</span>}
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── TOOLS ──────────────────────────────────────────────────── */}
        <section className="relative z-10 mx-auto max-w-7xl px-4 pb-16">

          {/* Popular Tools */}
          {popularTools.length > 0 && (
            <div className="mb-10">
              <div className="mb-4 flex items-center gap-3">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white sm:text-xl">
                  {t.popularTitle}
                </h2>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                  <Star className="h-3 w-3 fill-current" />
                  {t.topPicks}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {popularTools.map((tool) => (
                  <ToolCardWrapper key={tool.id} tool={tool} />
                ))}
              </div>
            </div>
          )}

          {/* Other Tools */}
          {otherTools.length > 0 && (
            <div className="mb-10">
              <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white sm:text-xl">
                {t.allTools}
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {otherTools.map((tool) => (
                  <ToolCardWrapper key={tool.id} tool={tool} />
                ))}
              </div>
            </div>
          )}

          {/* ── FAQ ──────────────────────────────────────────────────── */}
          {localizedFaqs && localizedFaqs.length > 0 && (
            <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/[0.06] dark:bg-white/[0.02]">
              <h2 className="mb-5 text-lg font-semibold text-slate-900 dark:text-white">
                {t.faqTitle}
              </h2>
              <div className="space-y-0">
                {localizedFaqs.map((faq, index) => (
                  <div
                    key={index}
                    className="border-b border-slate-100 last:border-0 dark:border-white/[0.04]"
                  >
                    <button
                      onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                      className="flex w-full items-start justify-between gap-4 py-4 text-left"
                    >
                      <h3 className="text-sm font-medium text-slate-900 dark:text-white">
                        {faq.question}
                      </h3>
                      <ChevronRight
                        className={`mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400 transition-transform duration-200 ${
                          expandedFaq === index ? 'rotate-90 text-violet-500' : ''
                        }`}
                      />
                    </button>
                    {expandedFaq === index && (
                      <p className="pb-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
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
              <h2 className="mb-3 text-base font-semibold text-slate-900 dark:text-white">
                {t.relatedCategories}
              </h2>
              <div className="flex flex-wrap gap-2">
                {seoContent.relatedCategories.map((relatedId) => {
                  const relatedCategory = categories.find((c) => c.id === relatedId);
                  if (!relatedCategory) return null;
                  const relGradient = categoryGradients[relatedId] || 'from-violet-500 to-purple-500';
                  const relatedName = dictionary.categories[relatedId]?.name || relatedCategory.name;
                  return (
                    <Link
                      key={relatedId}
                      href={createHref(`/category/${relatedId}`)}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-100 hover:shadow-sm dark:border-white/[0.06] dark:bg-white/[0.02] dark:text-slate-300 dark:hover:border-white/[0.10] dark:hover:bg-white/[0.04]"
                    >
                      <span className={`inline-flex rounded-lg bg-gradient-to-br ${relGradient} p-1 text-white`}>
                        <span className="text-xs leading-none">{relatedCategory.icon}</span>
                      </span>
                      <span>{relatedName}</span>
                      <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── CTA ──────────────────────────────────────────────────── */}
          <section className="mt-12 rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center dark:border-white/[0.06] dark:bg-white/[0.01]">
            <h2 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">
              {t.ctaTitle}
            </h2>
            <p className="mb-6 text-slate-600 dark:text-slate-400">
              {t.ctaDesc}
            </p>
            <Link
              href={createHref('/tools')}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_0_24px_rgba(139,92,246,0.35)] transition-all hover:-translate-y-0.5 hover:shadow-[0_0_32px_rgba(139,92,246,0.45)]"
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
