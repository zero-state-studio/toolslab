import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import { Locale, locales, localeToOGLocale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { getArticle } from '@/lib/blog/get-article';
import { ACTIVE_ARTICLE_SLUGS } from '@/lib/blog/active-articles';
import { TableOfContents } from '@/components/blog/TableOfContents';
import { ShareButtons } from '@/components/blog/ShareButtons';
import { AuthorBio } from '@/components/blog/AuthorBio';
import { FAQ } from '@/components/blog/FAQ';
import { Breadcrumbs } from '@/components/blog/Breadcrumbs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { generateHreflangAlternates } from '@/lib/seo/hreflang-utils';
import { getLocalizedPath } from '@/lib/i18n/helpers';
import styles from './page.module.css';

export const revalidate = false;

// Force static generation at build time; unknown params → 404 (no ISR fallback)
export const dynamicParams = false;

interface ArticlePageProps {
  params: {
    locale: Locale;
    slug: string;
  };
}

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { locale, slug } = params;
  const { article } = await getArticle(slug, locale);

  if (!article) {
    return {
      title: 'Article Not Found',
    };
  }

  const baseUrl = 'https://toolslab.dev';
  const url = `${baseUrl}${getLocalizedPath(`/blog/${slug}`, locale)}`;

  return {
    // metaTitle already carries its own brand suffix — bypass the layout template
    title: { absolute: article.seo.metaTitle },
    description: article.seo.metaDescription,
    keywords: article.seo.keywords,
    openGraph: {
      title: article.seo.metaTitle,
      description: article.seo.metaDescription,
      type: 'article',
      locale: localeToOGLocale[locale as Locale],
      url,
      publishedTime: article.publishDate,
      modifiedTime: article.modifiedDate || article.publishDate,
      authors: [article.author.name],
      siteName: 'ToolsLab Blog',
      images: article.seo.ogImage ? [{ url: article.seo.ogImage }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.seo.metaTitle,
      description: article.seo.metaDescription,
      creator: '@toolslab',
      images: article.seo.ogImage ? [article.seo.ogImage] : [],
    },
    alternates: {
      canonical: url,
      languages: generateHreflangAlternates({
        pageType: 'blog',
        path: slug,
      }),
    },
    authors: [{ name: article.author.name }],
    category: article.category,
  };
}

export async function generateStaticParams() {
  const params: { locale: Locale; slug: string }[] = [];

  for (const locale of locales) {
    for (const slug of ACTIVE_ARTICLE_SLUGS) {
      params.push({ locale, slug });
    }
  }

  return params;
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { locale, slug } = params;

  if (!locales.includes(locale)) {
    notFound();
  }

  const dict = await getDictionary(locale);
  const { article, isFallback } = await getArticle(slug, locale);

  if (!article) {
    notFound();
  }

  // Build breadcrumbs
  const breadcrumbs = [
    { name: 'Home', href: getLocalizedPath('/', locale) },
    {
      name: dict.blog.title,
      href: getLocalizedPath('/blog', locale),
    },
    { name: article.title, href: '#' },
  ];

  const articleUrl = `https://toolslab.dev${getLocalizedPath(`/blog/${slug}`, locale)}`;

  return (
    <div
      className={`min-h-screen bg-white dark:bg-gray-900 ${styles.blogContent}`}
    >
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: article.title,
            datePublished: article.publishDate,
            dateModified: article.modifiedDate || article.publishDate,
            author: {
              '@type': article.author.bio ? 'Person' : 'Organization',
              name: article.author.name,
            },
            publisher: {
              '@type': 'Organization',
              name: 'ToolsLab',
              logo: {
                '@type': 'ImageObject',
                url: 'https://toolslab.dev/icon-512.png',
                width: 512,
                height: 512,
              },
            },
            description: article.excerpt,
            mainEntityOfPage: {
              '@type': 'WebPage',
              '@id': articleUrl,
            },
            keywords: article.seo.keywords || [],
            articleSection: article.category,
            inLanguage: article.locale,
          }),
        }}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <div className="py-4">
          <Breadcrumbs items={breadcrumbs} />
        </div>

        {/* Fallback Notice */}
        {isFallback && (
          <Alert className="mb-6 border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-200">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{dict.blog.fallbackNotice}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-8 lg:gap-12">
          {/* Table of Contents - Floating for desktop */}
          <TableOfContents items={article.toc} />

          {/* Main Content */}
          <article className={`min-w-0 flex-1 ${styles.blogArticle}`}>
            <div className="mx-auto max-w-5xl">
              {/* Article Header */}
              <header className="mb-12">
                <div
                  className={`${styles.articleMeta} text-gray-600 dark:text-gray-400`}
                >
                  <span
                    className={`${styles.categoryBadge} bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300`}
                  >
                    📚 {article.category}
                  </span>
                  <time dateTime={article.publishDate}>
                    {new Intl.DateTimeFormat(locale, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    }).format(new Date(article.publishDate))}
                  </time>
                  <span>•</span>
                  <span>{article.readTime}</span>
                </div>
                <h1 className="mb-6 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-5xl font-bold text-transparent lg:text-6xl">
                  {article.title}
                </h1>
                <p className="max-w-3xl text-xl leading-relaxed text-gray-600 dark:text-gray-300">
                  {article.excerpt}
                </p>
              </header>

              {/* Share Buttons and Mobile TOC */}
              <div className="mb-8 flex flex-col gap-6">
                {/* Share Buttons */}
                <div>
                  <ShareButtons url={articleUrl} title={article.title} />
                </div>

                {/* Mobile Table of Contents - Inline */}
                <div className="lg:hidden">
                  <details className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
                    <summary className="flex cursor-pointer items-center gap-2 font-semibold text-gray-900 dark:text-white">
                      <span>📋 {dict.blog.tableOfContents}</span>
                    </summary>
                    <div className="mt-4">
                      <nav className="max-h-96 overflow-y-auto">
                        <ul className="space-y-2 text-sm">
                          {article.toc.map((item) => (
                            <li
                              key={item.id}
                              className={item.level === 3 ? 'ml-4' : ''}
                            >
                              <a
                                href={`#${item.id}`}
                                className="block rounded px-2 py-1 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
                              >
                                {item.text}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </nav>
                    </div>
                  </details>
                </div>
              </div>

              {/* Article Content */}
              <div className="prose prose-lg dark:prose-invert max-w-none">
                {article.content.sections.map((section) => (
                  <div key={section.id} id={section.id}>
                    {section.title && <h2>{section.title}</h2>}
                    <div dangerouslySetInnerHTML={{ __html: section.html }} />
                  </div>
                ))}
              </div>

              {/* FAQ Section */}
              {article.faq && article.faq.length > 0 && (
                <div className="mt-12">
                  <FAQ items={article.faq} />
                </div>
              )}

              {/* Author Bio */}
              <div className="mt-12">
                <AuthorBio
                  name={article.author.name}
                  bio={article.author.bio}
                  avatar={article.author.avatar}
                />
              </div>

              {/* Article Footer */}
              <footer className="mt-12 border-t border-gray-200 pt-8 dark:border-gray-700">
                <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <p>
                      {dict.blog.publishedOn}{' '}
                      {new Intl.DateTimeFormat(locale, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      }).format(new Date(article.publishDate))}{' '}
                      • {article.readTime}
                    </p>
                    {article.modifiedDate && (
                      <p className="mt-1">
                        {dict.blog.lastUpdated}:{' '}
                        {new Intl.DateTimeFormat(locale, {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        }).format(new Date(article.modifiedDate))}{' '}
                        {dict.blog.author}{' '}
                        <span className="font-semibold">
                          {article.author.name}
                        </span>
                      </p>
                    )}
                  </div>
                  <ShareButtons url={articleUrl} title={article.title} />
                </div>
              </footer>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}
