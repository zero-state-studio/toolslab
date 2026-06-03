'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToolStore } from '@/lib/store/toolStore';
import { labToasts } from '@/lib/utils/toasts';
import { track, trackFavorite } from '@/lib/analytics';
import { useHydration } from '@/lib/hooks/useHydration';

interface FavoriteButtonProps {
  type: 'tool' | 'category';
  id: string;
  name?: string;
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function FavoriteButton({
  type,
  id,
  name,
  className,
  showLabel = false,
  size = 'md',
}: FavoriteButtonProps) {
  const { isFavorite, toggleToolFavorite, toggleCategoryFavorite } =
    useToolStore();
  const isHydrated = useHydration();

  const isFav = isHydrated ? isFavorite(type, id) : false;

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const wasAdded = !isFav; // Stato prima del toggle

    if (type === 'tool') {
      // Controlla limite prima di aggiungere
      if (wasAdded) {
        const { favoriteTools } = useToolStore.getState();
        if (favoriteTools.length >= 50) {
          labToasts.labLimitReached('tools', 50);
          track('lab-limit-reached', {
            type: 'tools',
            limit: 50,
            current_count: favoriteTools.length,
          });
          return;
        }
      }
      toggleToolFavorite(id);
    } else {
      // Controlla limite prima di aggiungere
      if (wasAdded) {
        const { favoriteCategories } = useToolStore.getState();
        if (favoriteCategories.length >= 10) {
          labToasts.labLimitReached('categories', 10);
          track('lab-limit-reached', {
            type: 'categories',
            limit: 10,
            current_count: favoriteCategories.length,
          });
          return;
        }
      }
      toggleCategoryFavorite(id);
    }

    // Track favorite action using unified API
    const { favoriteTools, favoriteCategories } = useToolStore.getState();
    const totalFavorites =
      type === 'tool' ? favoriteTools.length : favoriteCategories.length;

    trackFavorite(
      id,
      type,
      wasAdded ? 'add' : 'remove',
      wasAdded ? totalFavorites + 1 : totalFavorites - 1
    );

    // Show toast notification
    if (wasAdded) {
      labToasts.addToLab(name || id);
    } else {
      labToasts.removeFromLab(name || id);
    }
  };

  // Increased icon sizes for better visibility
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-7 h-7',
  };

  // Button padding based on size
  const paddingClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-2.5',
  };

  return (
    <button
      onClick={handleToggle}
      className={cn(
        'group relative inline-flex items-center gap-1.5 transition-all duration-200',
        'hover:scale-110 active:scale-95',
        'focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2',
        'cursor-pointer rounded-full',
        paddingClasses[size],
        // Enhanced hover background
        'bg-transparent hover:bg-amber-100 dark:hover:bg-amber-900/30',
        // Border for better visibility
        'border border-transparent hover:border-amber-200 dark:hover:border-amber-700',
        className
      )}
      title={isFav ? 'Remove from Lab' : 'Add to Lab'}
      aria-label={
        isFav ? `Remove ${name || id} from Lab` : `Add ${name || id} to Lab`
      }
    >
      <Star
        key={isFav ? 'filled' : 'empty'}
        className={cn(
          sizeClasses[size],
          'duration-200 animate-in fade-in zoom-in-90',
          'transition-colors',
          isFav
            ? 'fill-amber-500 text-amber-500 drop-shadow-sm'
            : 'text-gray-500 hover:text-amber-500 group-hover:text-amber-500 dark:text-gray-400'
        )}
      />

      {showLabel && (
        <span className="text-sm font-medium">
          {isFav ? 'In Lab' : 'Add to Lab'}
        </span>
      )}

      {/* Ripple effect on click */}
      <span className="absolute inset-0 rounded-full" />
    </button>
  );
}
