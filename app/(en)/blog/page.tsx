'use client';

import { useState } from 'react';
import { ArticleCard } from '@/components/blog/ArticleCard';
import { FeaturedArticleCard } from '@/components/blog/FeaturedArticleCard';
import { Button } from '@/components/ui/button';
import { getActiveArticles } from '@/lib/blog/active-articles';
import { Loader2 } from 'lucide-react';

const INITIAL_RECENT_ARTICLES = 6; // Show 6 recent articles initially
const ARTICLES_PER_PAGE = 6; // Load 6 more articles each time

export default function BlogPage() {
  const [displayCount, setDisplayCount] = useState(INITIAL_RECENT_ARTICLES);
  const [isLoading, setIsLoading] = useState(false);

  // Get only articles with active pages
  const activeArticles = getActiveArticles();

  // Get the latest article for featured display (or null if no articles)
  const featuredArticle = activeArticles.length > 0 ? activeArticles[0] : null;

  // Get remaining articles for the grid
  const remainingArticles = activeArticles.slice(1);
  const displayedArticles = remainingArticles.slice(0, displayCount);
  const hasMore = displayCount < remainingArticles.length;

  const loadMore = () => {
    setIsLoading(true);
    // Simulate loading delay
    setTimeout(() => {
      setDisplayCount((prev) =>
        Math.min(prev + ARTICLES_PER_PAGE, remainingArticles.length)
      );
      setIsLoading(false);
    }, 500);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold sm:text-5xl">
          <span className="mr-2">📚</span>
          <span className="bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent dark:from-gray-100 dark:to-gray-400">
            ToolsLab Blog
          </span>
        </h1>
        <p className="mx-auto max-w-2xl text-xl text-gray-600 dark:text-gray-400">
          Developer guides & tutorials
        </p>
      </div>

      {/* Featured Article */}
      {featuredArticle && (
        <div className="mx-auto mb-12 max-w-7xl">
          <FeaturedArticleCard
            title={featuredArticle.title}
            excerpt={featuredArticle.excerpt}
            publishDate={featuredArticle.publishDate}
            readTime={featuredArticle.readTime}
            category={featuredArticle.category}
            thumbnail={featuredArticle.seo.ogImage}
            relatedTools={featuredArticle.relatedTools}
            slug={featuredArticle.slug}
            isPillar={featuredArticle.isPillar}
          />
        </div>
      )}

      {/* Recent Articles */}
      {displayedArticles.length > 0 && (
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-8 text-2xl font-bold text-gray-900 dark:text-gray-100">
            Recent Articles
          </h2>

          {/* Articles Grid - 3 columns */}
          <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {displayedArticles.map((article) => (
              <ArticleCard
                key={article.slug}
                title={article.title}
                excerpt={article.excerpt}
                publishDate={article.publishDate}
                readTime={article.readTime}
                category={article.category}
                thumbnail={article.seo.ogImage}
                relatedTools={article.relatedTools}
                slug={article.slug}
                isPillar={article.isPillar}
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
            Coming Soon!
          </h2>
          <p className="mx-auto mb-8 max-w-md text-gray-600 dark:text-gray-400">
            We&apos;re working on amazing content for you. Check back soon for
            developer guides, tutorials, and best practices.
          </p>
        </div>
      )}

      {/* Load More Button */}
      {hasMore && (
        <div className="text-center">
          <Button
            onClick={loadMore}
            disabled={isLoading}
            size="lg"
            variant="outline"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              'Load More'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
