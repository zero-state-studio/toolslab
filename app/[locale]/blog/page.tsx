import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { Locale, locales } from '@/lib/i18n/config';
import { getActiveArticlesForLocale } from '@/lib/blog/active-articles';
import { ArticleCard } from '@/components/blog/ArticleCard';
import { FeaturedArticleCard } from '@/components/blog/FeaturedArticleCard';
import { generateHreflangAlternates } from '@/lib/seo/hreflang-utils';

export const revalidate = false;

interface BlogPageProps {
  params: {
    locale: Locale;
  };
}

export async function generateMetadata({
  params,
}: BlogPageProps): Promise<Metadata> {
  const { locale } = params;
  const dict = await getDictionary(locale);

  const baseUrl = 'https://toolslab.dev';
  const path = 'blog';

  return {
    title: `${dict.blog.title} | ToolsLab`,
    description: dict.blog.subtitle,
    alternates: {
      canonical:
        locale === 'en' ? `${baseUrl}/${path}` : `${baseUrl}/${locale}/${path}`,
      languages: generateHreflangAlternates({
        pageType: 'static',
        path,
      }),
    },
  };
}

export async function generateStaticParams() {
  return locales.map((locale) => ({
    locale,
  }));
}

export default async function BlogPage({ params }: BlogPageProps) {
  const { locale } = params;

  if (!locales.includes(locale)) {
    notFound();
  }

  const dict = await getDictionary(locale);
  const activeArticles = await getActiveArticlesForLocale(locale);

  // Get the latest article for featured display
  const featuredArticle = activeArticles.length > 0 ? activeArticles[0] : null;
  const remainingArticles = activeArticles.slice(1);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold sm:text-5xl">
          <span className="mr-2">📚</span>
          <span className="bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent dark:from-gray-100 dark:to-gray-400">
            {dict.blog.title}
          </span>
        </h1>
        <p className="mx-auto max-w-2xl text-xl text-gray-600 dark:text-gray-400">
          {dict.blog.subtitle}
        </p>
      </div>

      {/* Featured Article */}
      {featuredArticle && (
        <div className="mx-auto mb-12 max-w-7xl">
          <FeaturedArticleCard
            title={featuredArticle.title}
            excerpt={featuredArticle.excerpt}
            publishDate={new Date(featuredArticle.publishDate)}
            readTime={featuredArticle.readTime}
            category={featuredArticle.category}
            thumbnail={featuredArticle.seo.ogImage}
            relatedTools={featuredArticle.relatedTools}
            slug={featuredArticle.slug}
            isPillar={featuredArticle.isPillar}
            locale={locale}
          />
        </div>
      )}

      {/* Recent Articles */}
      {remainingArticles.length > 0 && (
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-8 text-2xl font-bold text-gray-900 dark:text-gray-100">
            {dict.blog.recentArticles}
          </h2>

          {/* Articles Grid - 3 columns */}
          <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {remainingArticles.map((article) => (
              <ArticleCard
                key={article.slug}
                title={article.title}
                excerpt={article.excerpt}
                publishDate={new Date(article.publishDate)}
                readTime={article.readTime}
                category={article.category}
                thumbnail={article.seo.ogImage}
                relatedTools={article.relatedTools}
                slug={article.slug}
                isPillar={article.isPillar}
                locale={locale}
              />
            ))}
          </div>
        </div>
      )}

      {/* No articles message */}
      {activeArticles.length === 0 && (
        <div className="mx-auto max-w-7xl py-16 text-center">
          <div className="mb-4 text-6xl">📝</div>
          <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-gray-100">
            {dict.blog.comingSoon}
          </h2>
          <p className="mx-auto mb-8 max-w-md text-gray-600 dark:text-gray-400">
            {dict.blog.comingSoonDescription}
          </p>
        </div>
      )}
    </div>
  );
}
