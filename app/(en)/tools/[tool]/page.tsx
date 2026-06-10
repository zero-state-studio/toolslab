import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import ToolPageClient from '@/components/tools/ToolPageClient';
import { tools, getToolById, categories } from '@/lib/tools';
import { getToolLongTailKeywords } from '@/lib/tools-seo';
import { generateToolSchema } from '@/lib/tool-schema';
import { loadToolTranslation } from '@/lib/i18n/load-tools';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { generateHreflangAlternates } from '@/lib/seo/hreflang-utils';

// Static: pages are fully static at build time and served from CDN
// No ISR needed — tool content never changes between deploys
export const revalidate = false;

// Force static generation at build time for all tools
export const dynamicParams = false;

interface ToolPageProps {
  params: {
    tool: string;
  };
}

export async function generateMetadata({
  params,
}: ToolPageProps): Promise<Metadata> {
  const tool = getToolById(params.tool);

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

  // Load SEO data from granular JSON files
  const toolData = await loadToolTranslation('en', params.tool);

  // Get primary category name
  const primaryCategory = categories.find(
    (cat) => cat.id === tool.categories[0]
  );
  const categoryName = primaryCategory?.name || 'Tools';

  // Generate comprehensive keywords (short-tail + long-tail)
  const keywords = [
    tool.name.toLowerCase(),
    ...tool.keywords,
    ...getToolLongTailKeywords(params.tool),
    'online tool',
    'free tool',
    'developer tool',
    'web tool',
    categoryName.toLowerCase(),
    'toolslab',
  ];

  // Use meta.description (optimized, ~155 chars) for the meta tag.
  // pageDescription is the long visible text on the page, not for the meta tag.
  const seoDescription = toolData?.meta?.description
    || toolData?.pageDescription
    || `${tool.description}. Use our free online ${tool.name.toLowerCase()} tool. No installation required, works in your browser. Fast, secure, and free.`;

  // Use meta title from JSON if available
  const metaTitle = toolData?.meta?.title;

  // Optimize title length to stay under 70 characters (layout template adds "| ToolsLab")
  const baseTitle = tool.name;
  const longTitle = `${tool.name} - Free Online ${categoryName} Tool`;
  const shortTitle = `${tool.name} - Free ${categoryName} Tool`;

  // Choose title based on length (accounting for template "| ToolsLab" = 12 chars)
  const templateSuffix = ' | ToolsLab';
  let finalTitle: string;

  if (metaTitle) {
    finalTitle = metaTitle.replace(' | ToolsLab', ''); // Remove suffix if already in meta
  } else if ((longTitle + templateSuffix).length <= 70) {
    finalTitle = longTitle;
  } else if ((shortTitle + templateSuffix).length <= 70) {
    finalTitle = shortTitle;
  } else {
    finalTitle = baseTitle;
  }

  return {
    title: finalTitle,
    description: seoDescription,
    keywords: keywords.join(', '),

    openGraph: {
      title: `${tool.name} - Free Online Tool | ToolsLab`,
      description: toolData?.meta?.description || tool.description,
      type: 'website',
      url: `https://toolslab.dev/tools/${params.tool}`,
      images: [
        {
          url: `/tools/${params.tool}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: `${tool.name} - ToolsLab`,
        },
      ],
      siteName: 'ToolsLab',
    },

    twitter: {
      card: 'summary_large_image',
      title: `${tool.name} - ToolsLab`,
      description: toolData?.meta?.description || tool.description,
      images: [`/tools/${params.tool}/twitter-image`],
      creator: '@toolslab',
    },

    alternates: {
      canonical: `https://toolslab.dev/tools/${params.tool}`,
      languages: generateHreflangAlternates({
        pageType: 'tool',
        path: params.tool,
      }),
    },

    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },

    authors: [{ name: 'ToolsLab' }],
    creator: 'ToolsLab',
    publisher: 'ToolsLab',
    category: 'technology',
  };
}

export async function generateStaticParams() {
  return tools.map((tool) => ({
    tool: tool.id,
  }));
}

export default async function ToolPage({ params }: ToolPageProps) {
  const tool = getToolById(params.tool);

  if (!tool) {
    notFound();
  }

  // Load base sections and tool translation in parallel (avoids loading all 59 tools)
  const [baseDict, singleToolData, structuredData] = await Promise.all([
    getDictionary('en', [
      'common',
      'home',
      'categories',
      'footer',
      'seo',
      'lab',
    ]),
    loadToolTranslation('en', params.tool),
    generateToolSchema(params.tool),
  ]);

  const dict = {
    ...baseDict,
    tools: { [params.tool]: singleToolData },
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

  return (
    <>
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      )}
      <Suspense
        fallback={
          <div className="min-h-screen animate-pulse bg-gray-50 dark:bg-background" />
        }
      >
        <ToolPageClient
          toolId={params.tool}
          locale="en"
          dictionary={dict}
          toolTranslations={toolTranslations}
        />
      </Suspense>
    </>
  );
}
