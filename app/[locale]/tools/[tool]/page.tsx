import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import ToolPageClient from '@/components/tools/ToolPageClient';
import { tools, getToolById, categories } from '@/lib/tools';
import { getToolLongTailKeywords } from '@/lib/tools-seo';
import { generateToolSchema } from '@/lib/tool-schema';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { loadToolTranslation, loadToolSummaries } from '@/lib/i18n/load-tools';
import { getSmartRelatedTools } from '@/lib/seo/related-tools-engine';
import { locales, type Locale, localeToOGLocale } from '@/lib/i18n/config';
import { generateHreflangAlternates } from '@/lib/seo/hreflang-utils';
import { getLocalizedPath } from '@/lib/i18n/helpers';

// Static: pages are fully static at build time and served from CDN
// No ISR needed — tool content never changes between deploys
export const revalidate = false;

// Force static generation at build time for all tools
export const dynamicParams = false;

interface LocaleToolPageProps {
  params: {
    locale: string;
    tool: string;
  };
}

export async function generateMetadata({
  params,
}: LocaleToolPageProps): Promise<Metadata> {
  const { locale, tool: toolId } = params;

  // Validate locale
  if (!locales.includes(locale as Locale)) {
    return {};
  }

  const tool = getToolById(toolId);
  if (!tool) {
    return {
      title: 'Tool Not Found - ToolsLab',
      description: 'The requested tool was not found.',
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  // Load locale dict and English fallback in parallel to eliminate waterfall
  const [dict, enDict] = await Promise.all([
    getDictionary(locale as Locale),
    locale !== 'en' ? getDictionary('en') : Promise.resolve(null),
  ]);
  const toolDict = dict.tools?.[toolId];

  if (!toolDict) {
    // Fallback to English if locale translation is missing
    const hasEnglishFallback = enDict?.tools?.[toolId];
    if (!hasEnglishFallback) {
      return {
        title: `${tool.name} - ToolsLab`,
        description: tool.description,
      };
    }
  }

  // Get primary category name
  const primaryCategory = categories.find(
    (cat) => cat.id === tool.categories[0]
  );
  const categoryDict = dict.categories[primaryCategory?.id || 'dev'];
  const categoryName = categoryDict?.name || primaryCategory?.name || 'Tools';

  // Generate comprehensive keywords with proper translations
  const getTranslatedKeywords = (locale: string) => {
    switch (locale) {
      case 'it':
        return {
          onlineTool: 'strumento online',
          freeTool: 'strumento gratuito',
          developerTool: 'strumento sviluppatore',
          webTool: 'strumento web',
        };
      case 'es':
        return {
          onlineTool: 'herramienta en línea',
          freeTool: 'herramienta gratuita',
          developerTool: 'herramienta para desarrolladores',
          webTool: 'herramienta web',
        };
      case 'fr':
        return {
          onlineTool: 'outil en ligne',
          freeTool: 'outil gratuit',
          developerTool: 'outil développeur',
          webTool: 'outil web',
        };
      case 'de':
        return {
          onlineTool: 'Online-Tool',
          freeTool: 'kostenloses Tool',
          developerTool: 'Entwickler-Tool',
          webTool: 'Web-Tool',
        };
      case 'pt':
        return {
          onlineTool: 'ferramenta online',
          freeTool: 'ferramenta gratuita',
          developerTool: 'ferramenta para desenvolvedores',
          webTool: 'ferramenta web',
        };
      default:
        return {
          onlineTool: 'online tool',
          freeTool: 'free tool',
          developerTool: 'developer tool',
          webTool: 'web tool',
        };
    }
  };

  const translatedKeywords = getTranslatedKeywords(locale);

  // Generate comprehensive keywords (short-tail + long-tail)
  const keywords = [
    toolDict?.title.toLowerCase() || tool.name.toLowerCase(),
    ...tool.keywords,
    ...getToolLongTailKeywords(toolId),
    translatedKeywords.onlineTool,
    translatedKeywords.freeTool,
    translatedKeywords.developerTool,
    translatedKeywords.webTool,
    categoryName.toLowerCase(),
    'toolslab',
  ];

  const getLocalizedSubtitle = (loc: string) => {
    switch (loc) {
      case 'it':
        return 'Strumento Online Gratuito';
      case 'es':
        return 'Herramienta Online Gratuita';
      case 'fr':
        return 'Outil en Ligne Gratuit';
      case 'de':
        return 'Kostenloses Online-Tool';
      case 'pt':
        return 'Ferramenta Online Gratuita';
      default:
        return 'Free Online Tool';
    }
  };

  const rawMetaTitle = toolDict?.meta?.title;
  const metaTitle = rawMetaTitle
    ? rawMetaTitle.replace(/\s*\|\s*(?:ToolsLab|OctoTools)\s*$/, '')
    : `${toolDict?.title || tool.name} - ${getLocalizedSubtitle(locale)}`;
  const metaDescription =
    toolDict?.meta?.description || toolDict?.description || tool.description;

  return {
    title: metaTitle,
    description: metaDescription,
    keywords: keywords.join(', '),
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      type: 'website',
      locale: localeToOGLocale[locale as Locale],
      url: `https://toolslab.dev${getLocalizedPath(`/tools/${toolId}`, locale as Locale)}`,
      images: [
        {
          url: `/tools/${toolId}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: `${toolDict?.title || tool.name} - ToolsLab`,
        },
      ],
      siteName: 'ToolsLab',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${toolDict?.title || tool.name} - ToolsLab`,
      description: toolDict?.description || tool.description,
      images: [`/tools/${toolId}/twitter-image`],
      creator: '@toolslab',
    },
    alternates: {
      canonical: `https://toolslab.dev${getLocalizedPath(`/tools/${toolId}`, locale as Locale)}`,
      languages: generateHreflangAlternates({
        pageType: 'tool',
        path: toolId,
      }),
    },
    robots: {
      index: true,
      follow: true,
      nocache: false,
      googleBot: {
        index: true,
        follow: true,
        noimageindex: false,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export default async function LocaleToolPage({ params }: LocaleToolPageProps) {
  const { locale, tool: toolId } = params;

  // Validate locale
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const tool = getToolById(toolId);
  if (!tool) {
    notFound();
  }

  // Tool ids shown in the related/same-category sections (mirrors the
  // client-side logic in ToolPageClient) — their title/description must be
  // localized too, or the cards render in English on locale pages.
  const sameCategoryIds = tools
    .filter(
      (t) =>
        t.categories.includes(tool.categories[0]) &&
        t.id !== tool.id &&
        t.label !== 'coming-soon'
    )
    .slice(0, 6)
    .map((t) => t.id);
  const relatedIds = (getSmartRelatedTools(toolId, 4) || []).filter((id) => {
    const t = getToolById(id);
    return t && t.label !== 'coming-soon';
  });
  const summaryIds = Array.from(new Set([...relatedIds, ...sameCategoryIds]));

  // Load base sections and tool translation in parallel (avoids loading all 59 tools)
  const [baseDict, singleToolData, toolSchema, relatedSummaries] =
    await Promise.all([
      getDictionary(locale as Locale, [
        'common',
        'home',
        'categories',
        'footer',
        'seo',
        'lab',
      ]),
      loadToolTranslation(locale as Locale, toolId),
      generateToolSchema(toolId, locale as Locale),
      loadToolSummaries(locale as Locale, summaryIds),
    ]);

  const dict = {
    ...baseDict,
    tools: { ...relatedSummaries, [toolId]: singleToolData },
  };

  // Extract tool-specific translations
  const toolData = singleToolData as any;

  const toolTranslations = {
    title: toolData?.title || tool.name,
    description: toolData?.description || tool.description,
    tagline: toolData?.tagline,
    pageDescription: toolData?.pageDescription,
    placeholder: toolData?.placeholder,
    instructions: toolData?.instructions,
  };

  // Map locale to inLanguage format
  const localeToLanguageMap: Record<string, string> = {
    en: 'en-US',
    it: 'it-IT',
    es: 'es-ES',
    fr: 'fr-FR',
    de: 'de-DE',
    pt: 'pt-PT',
  };

  // Generate localized schema - properly update @graph items
  const localizedSchema = toolSchema
    ? {
        '@context': toolSchema['@context'],
        '@graph': toolSchema['@graph'].map((item: any) => {
          const localizedUrl = `https://toolslab.dev/${locale}/tools/${toolId}`;

          // Update WebApplication schema
          if (item['@type'] === 'WebApplication') {
            return {
              ...item,
              '@id': `${localizedUrl}#webapp`,
              name: toolTranslations.title,
              description:
                toolTranslations.pageDescription ||
                toolTranslations.description,
              url: localizedUrl,
              inLanguage: localeToLanguageMap[locale] || 'en-US',
              mainEntityOfPage: {
                '@type': 'WebPage',
                '@id': localizedUrl,
              },
            };
          }

          // Update BreadcrumbList schema with localized URLs
          if (item['@type'] === 'BreadcrumbList') {
            const baseUrl = 'https://toolslab.dev';
            const localePath = locale === 'en' ? '' : `/${locale}`;

            return {
              ...item,
              '@id': `${localizedUrl}#breadcrumb`,
              itemListElement: item.itemListElement.map((listItem: any) => {
                // Update each breadcrumb item with localized path
                let localizedItemUrl = listItem.item;

                if (listItem.position === 1) {
                  // Home
                  localizedItemUrl =
                    locale === 'en' ? baseUrl : `${baseUrl}${localePath}`;
                } else if (listItem.position === 2) {
                  // Tools
                  localizedItemUrl = `${baseUrl}${localePath}/tools`;
                } else if (listItem.position === 3) {
                  // Category
                  const categorySlug = listItem.item.split('/category/')[1];
                  localizedItemUrl = `${baseUrl}${localePath}/category/${categorySlug}`;
                } else if (listItem.position === 4) {
                  // Tool page
                  localizedItemUrl = localizedUrl;
                }

                return {
                  ...listItem,
                  item: localizedItemUrl,
                };
              }),
            };
          }

          // Update FAQPage schema
          if (item['@type'] === 'FAQPage') {
            return {
              ...item,
              '@id': `${localizedUrl}#faq`,
            };
          }

          // Update SoftwareApplication schema
          if (item['@type'] === 'SoftwareApplication') {
            return {
              ...item,
              '@id': `${localizedUrl}#software`,
              name: toolTranslations.title,
              description:
                toolTranslations.pageDescription ||
                toolTranslations.description,
              url: localizedUrl,
              downloadUrl: localizedUrl,
              installUrl: localizedUrl,
            };
          }

          // Return unchanged for other types
          return item;
        }),
      }
    : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localizedSchema) }}
      />
      <Suspense
        fallback={
          <div className="min-h-screen animate-pulse bg-gray-50 dark:bg-gray-900" />
        }
      >
        <ToolPageClient
          toolId={toolId}
          locale={locale as Locale}
          dictionary={dict}
          toolTranslations={toolTranslations}
        />
      </Suspense>
    </>
  );
}

export async function generateStaticParams() {
  // Generate paths for all tool/locale combinations
  const paths = [];

  for (const locale of locales) {
    for (const tool of tools) {
      paths.push({
        locale,
        tool: tool.id,
      });
    }
  }

  return paths;
}
