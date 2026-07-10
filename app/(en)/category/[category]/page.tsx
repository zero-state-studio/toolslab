import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { categories } from '@/lib/tools';
import CategoryPageContent from '@/components/layout/CategoryPageContent';
import { getCategorySEO } from '@/lib/category-seo';
import { generateHreflangAlternates } from '@/lib/i18n/helpers';

export const revalidate = false;

interface Props {
  params: { category: string };
}

export async function generateStaticParams() {
  return categories.map((category) => ({
    category: category.id,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = categories.find((cat) => cat.id === params.category);
  const seoContent = await getCategorySEO(params.category, 'en'); // Default English

  if (!category || !seoContent) {
    return {};
  }

  return {
    title: `${seoContent.h1Title} - Free Online Tools`,
    description: seoContent.metaDescription,
    keywords: seoContent.keywords,
    openGraph: {
      title: `${seoContent.h1Title} - ToolsLab`,
      description: seoContent.metaDescription,
      type: 'website',
      url: `https://toolslab.dev/category/${params.category}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${seoContent.h1Title} - ToolsLab`,
      description: seoContent.metaDescription,
    },
    alternates: {
      canonical: `https://toolslab.dev/category/${params.category}`,
      languages: generateHreflangAlternates(`/category/${params.category}`),
    },
  };
}

export default async function CategoryPage({ params }: Props) {
  const category = categories.find((cat) => cat.id === params.category);

  if (!category) {
    notFound();
  }

  const seoContent = await getCategorySEO(params.category, 'en');

  if (!seoContent) {
    notFound();
  }

  return (
    <Suspense
      fallback={<div className="animate-pulse">Loading category...</div>}
    >
      <CategoryPageContent
        categoryId={params.category}
        seoContent={seoContent}
      />
    </Suspense>
  );
}
