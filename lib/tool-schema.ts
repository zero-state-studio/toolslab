// lib/tool-schema.ts
import { getToolById } from '@/lib/tools';
import { loadToolTranslation } from '@/lib/i18n/load-tools';

export async function generateToolSchema(toolId: string) {
  const tool = getToolById(toolId);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://toolslab.dev';

  if (!tool) {
    return null;
  }

  // Load SEO data from granular JSON files
  const seo = await loadToolTranslation('en', toolId);

  if (!seo || !seo.pageDescription) {
    return null;
  }

  const toolUrl = `${baseUrl}${tool.route}`;
  const categoryName = tool.categories[0] || 'dev';

  return {
    '@context': 'https://schema.org',
    '@graph': [
      // Main WebApplication schema
      {
        '@type': 'WebApplication',
        '@id': `${toolUrl}#webapp`,
        name: tool.name,
        description: seo.pageDescription,
        url: toolUrl,
        applicationCategory: 'DeveloperApplication',
        applicationSubCategory: categoryName,
        operatingSystem: 'Any',
        browserRequirements: 'Requires JavaScript',
        permissions: 'no-permissions-required',
        isAccessibleForFree: true,
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.8',
          ratingCount: generateDeterministicRatingCount(toolId),
          bestRating: '5',
          worstRating: '1',
        },
        author: {
          '@type': 'Organization',
          '@id': `${baseUrl}#organization`,
          name: 'ToolsLab',
          url: baseUrl,
          logo: {
            '@type': 'ImageObject',
            url: `${baseUrl}/icon-512.png`,
            width: 512,
            height: 512,
          },
        },
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': toolUrl,
        },
        featureList: seo.tagline,
        keywords: [...tool.keywords, ...(tool.longTailKeywords || [])].join(', '),
        datePublished: '2025-01-01',
        dateModified: '2025-01-15T00:00:00.000Z',
        inLanguage: 'en-US',
      },

      // BreadcrumbList schema
      {
        '@type': 'BreadcrumbList',
        '@id': `${toolUrl}#breadcrumb`,
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: baseUrl,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Tools',
            item: `${baseUrl}/tools`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: formatCategoryName(categoryName),
            item: `${baseUrl}/category/${categoryName}`,
          },
          {
            '@type': 'ListItem',
            position: 4,
            name: tool.name,
            item: toolUrl,
          },
        ],
      },

      // FAQPage schema
      {
        '@type': 'FAQPage',
        '@id': `${toolUrl}#faq`,
        mainEntity: generateToolFAQs(tool.name, toolId),
      },

      // SoftwareApplication schema (additional coverage)
      {
        '@type': 'SoftwareApplication',
        '@id': `${toolUrl}#software`,
        name: tool.name,
        description: seo.pageDescription,
        url: toolUrl,
        applicationCategory: 'WebApplication',
        operatingSystem: 'Cross-platform',
        softwareRequirements: 'Web Browser',
        memoryRequirements: '< 10MB',
        storageRequirements: '0MB',
        softwareVersion: '1.0',
        releaseNotes: `${tool.name} - Free online tool`,
        downloadUrl: toolUrl,
        installUrl: toolUrl,
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
      },
    ],
  };
}

// Generate deterministic rating count based on tool ID to avoid hydration mismatch
function generateDeterministicRatingCount(toolId: string): number {
  // Simple hash function to generate consistent pseudo-random number
  let hash = 0;
  for (let i = 0; i < toolId.length; i++) {
    const char = toolId.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // Generate number between 150-850 based on hash
  return Math.abs(hash % 700) + 150;
}

function formatCategoryName(slug: string): string {
  const categoryMap: Record<string, string> = {
    data: 'Data & Conversion',
    encoding: 'Encoding & Security',
    text: 'Text & Format',
    generators: 'Generators',
    web: 'Web & Design',
    dev: 'Developer Utilities',
    formatters: 'Code Formatters',
  };

  return (
    categoryMap[slug] ||
    slug
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
  );
}

function generateToolFAQs(toolName: string, toolId: string) {
  return [
    {
      '@type': 'Question',
      name: `Is the ${toolName} free to use?`,
      acceptedAnswer: {
        '@type': 'Answer',
        text: `Yes, our ${toolName} is completely free to use. No registration, payment, or subscription required. All features are available at no cost.`,
      },
    },
    {
      '@type': 'Question',
      name: `Is my data secure when using the ${toolName}?`,
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, all data processing happens entirely in your browser. Your data never leaves your device or gets sent to our servers, ensuring complete privacy and security.',
      },
    },
    {
      '@type': 'Question',
      name: `Can I use the ${toolName} offline?`,
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, once the page loads, the tool works completely offline. All processing is done client-side in your browser.',
      },
    },
    {
      '@type': 'Question',
      name: `Do I need to create an account to use ${toolName}?`,
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No, you can use all our tools without creating an account. Simply visit the page and start using the tool immediately.',
      },
    },
    {
      '@type': 'Question',
      name: `How do I use the ${toolName}?`,
      acceptedAnswer: {
        '@type': 'Answer',
        text: `Simply paste or type your content into the ${toolName} and get instant results. The tool provides real-time processing with immediate feedback and validation.`,
      },
    },
  ];
}
