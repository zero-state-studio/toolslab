import Link from 'next/link';
import { Category, getCategoryColorClass } from '@/lib/tools';
import { cn } from '@/lib/utils';
import { ArrowRight, Zap } from 'lucide-react';
import { FavoriteButton } from '@/components/lab/FavoriteButton';
import { useLocale } from '@/hooks/useLocale';
import { ToolIcon } from '@/components/ui/ToolIcon';

interface CategoryCardProps {
  category: Category;
  className?: string;
}

export function CategoryCard({ category, className }: CategoryCardProps) {
  const categoryClass = getCategoryColorClass(category.id);
  const previewTools = category.tools.slice(0, 4);
  const { createHref } = useLocale();

  return (
    <Link
      href={createHref(`/?category=${category.id}`)}
      className="group block"
    >
      <div
        className={cn(
          'category-card hover-lift transition-all duration-300 group-hover:scale-105',
          categoryClass,
          className
        )}
      >
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 transition-all duration-300 group-hover:scale-110"
              style={{
                backgroundColor: `var(--category-bg)`,
                borderColor: `var(--category-border)`,
                color: `var(--category-primary)`,
              }}
            >
              <ToolIcon id={category.id} type="category" className="h-7 w-7" />
            </div>
            <div>
              <div className="mb-1 flex items-center gap-2">
                <h3 className="text-xl font-bold text-gray-900 transition-colors group-hover:text-opacity-80 dark:text-gray-100">
                  {category.name}
                </h3>
                <FavoriteButton
                  type="category"
                  id={category.id}
                  name={category.name}
                  size="sm"
                  className="relative z-30"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="badge badge-category">
                  {category.tools.length} tool
                  {category.tools.length === 1 ? '' : 's'}
                </span>
                {category.tools.some((tool) => tool.label === 'popular') && (
                  <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                    <Zap className="h-3 w-3" />
                    <span>Popular</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <ArrowRight
            className="h-5 w-5 text-gray-400 transition-all duration-200 group-hover:translate-x-1 group-hover:text-gray-600 dark:group-hover:text-gray-300"
            style={{ color: `var(--category-primary)` }}
          />
        </div>

        {/* Description */}
        <p className="mb-6 leading-relaxed text-gray-600 dark:text-gray-400">
          {category.description}
        </p>

        {/* Preview Tools */}
        <div className="space-y-3">
          <div className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
            Featured Tools:
          </div>
          <div className="grid grid-cols-2 gap-3">
            {previewTools.map((tool) => (
              <div
                key={tool.id}
                className="flex items-center space-x-3 rounded-lg bg-gray-50 p-3 transition-colors hover:bg-gray-100 dark:bg-gray-800/50 dark:hover:bg-gray-800"
              >
                <ToolIcon id={tool.id} className="h-4 w-4 flex-shrink-0 text-slate-500 dark:text-slate-400" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                    {tool.name}
                  </div>
                  {tool.label === 'popular' && (
                    <div className="text-xs text-amber-600 dark:text-amber-400">
                      Popular
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {category.tools.length > 4 && (
            <div className="pt-3 text-center">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                +{category.tools.length - 4} more tools
              </span>
            </div>
          )}
        </div>

        {/* Hover overlay */}
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-5"
          style={{ backgroundColor: `var(--category-primary)` }}
        />
      </div>
    </Link>
  );
}
