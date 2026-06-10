import { Metadata } from 'next';
import CategoriesHubContentSimple from '@/components/layout/CategoriesHubContentSimple';
import { generateHreflangAlternates } from '@/lib/seo/hreflang-utils';

export const revalidate = false;

export const metadata: Metadata = {
  title: 'Developer Tool Categories - Browse by Functionality',
  description:
    'Explore 24+ professional developer tools organized into 6 specialized categories. From data conversion to security utilities, find tools for JSON formatting, Base64 encoding, hash generation, and more.',
  keywords:
    'developer tools categories, JSON formatter, Base64 encoder, hash generator, data conversion tools, security utilities, web development tools, programming utilities',
  openGraph: {
    title: 'Developer Tool Categories - Browse by Functionality',
    description:
      'Explore 24+ professional developer tools organized into 6 specialized categories. Battle-tested utilities used by thousands of developers worldwide.',
    type: 'website',
    url: 'https://toolslab.dev/categories',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Developer Tool Categories - ToolsLab',
    description:
      'Explore 24+ professional developer tools organized into 6 specialized categories.',
  },
  alternates: {
    canonical: 'https://toolslab.dev/categories',
    languages: generateHreflangAlternates({
      pageType: 'static',
      path: 'categories',
    }),
  },
};

export default function CategoriesPage() {
  return <CategoriesHubContentSimple />;
}
