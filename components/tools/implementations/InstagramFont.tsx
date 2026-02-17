'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Copy,
  Check,
  Star,
  Search,
  Instagram,
  MessageCircle,
  Twitter,
  Facebook,
  Sparkles,
} from 'lucide-react';
import { useCopy } from '@/lib/hooks/useCopy';
import { useToolTracking } from '@/lib/analytics/hooks/useToolTracking';
import { BaseToolProps } from '@/lib/types/tools';
import {
  generateInstagramFonts,
  fontStyles,
  type FontStyle,
} from '@/lib/tools/instagram-font';
import { useToolStoreSelectors } from '@/lib/hooks/useToolStoreSelectors';
import { useHydration } from '@/lib/hooks/useHydration';
import { useSmartDebounce } from '@/lib/hooks/useSmartDebounce';

interface InstagramFontProps extends BaseToolProps {}

const MAX_CHARS_BIO = 150; // Instagram bio character limit
const MAX_CHARS_POST = 2200; // Instagram post character limit

export default function InstagramFont({ categoryColor }: InstagramFontProps) {
  const [input, setInput] = useState('');
  const [generatedStyles, setGeneratedStyles] = useState<
    Array<{
      id: string;
      name: string;
      text: string;
      compatibility: FontStyle['compatibility'];
    }>
  >([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [copiedStyleId, setCopiedStyleId] = useState<string | null>(null);
  const [showAllStyles, setShowAllStyles] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');

  // Helper function to handle platform change with tracking
  const handlePlatformChange = (platform: string) => {
    setSelectedPlatform(platform);
    trackCustom({
      success: true,
      metadata: {
        action: 'filter_by_platform',
        platform,
        availableStyles: generatedStyles.filter((style) => {
          if (platform === 'all') return true;
          return style.compatibility[
            platform as keyof FontStyle['compatibility']
          ];
        }).length,
      },
    });
  };

  // PHASE 1 OPTIMIZATION: Use granular selectors to prevent re-renders
  const isHydrated = useHydration();
  const { addToHistory, isFavorite } = useToolStoreSelectors(
    'instagram-font-generator'
  );

  const { trackUse, trackCustom } = useToolTracking('instagram-font-generator');
  const { copied: copiedAll, copy: copyAll } = useCopy();

  // Local storage for favorites
  const [localFavoriteStyles, setLocalFavoriteStyles] = useState<string[]>([]);

  useEffect(() => {
    if (isHydrated) {
      const saved = localStorage.getItem('instagram-font-favorites');
      if (saved) {
        try {
          setLocalFavoriteStyles(JSON.parse(saved));
        } catch {}
      }
    }
  }, [isHydrated]);

  const toggleFavoriteStyle = (styleId: string) => {
    const isFavoriting = !localFavoriteStyles.includes(styleId);
    const newFavorites = isFavoriting
      ? [...localFavoriteStyles, styleId]
      : localFavoriteStyles.filter((id) => id !== styleId);

    setLocalFavoriteStyles(newFavorites);
    if (isHydrated) {
      localStorage.setItem(
        'instagram-font-favorites',
        JSON.stringify(newFavorites)
      );
    }

    // Find style name for tracking
    const style = generatedStyles.find((s) => s.id === styleId);

    // Track favorite/unfavorite event
    trackCustom({
      success: true,
      metadata: {
        action: isFavoriting ? 'favorite_font_style' : 'unfavorite_font_style',
        styleId,
        styleName: style?.name || 'unknown',
        totalFavorites: newFavorites.length,
      },
    });
  };

  // Track if current input has been tracked
  const [lastTrackedInput, setLastTrackedInput] = useState('');

  // PHASE 1 OPTIMIZATION: Debounce input processing (30-50ms saved per keystroke)
  // Adaptive delay: 0ms for <100 chars, 300ms for 100-1000 chars, 450ms for >1000 chars
  const debouncedInput = useSmartDebounce(input, {
    delay: 300,
    maxWait: 1000,
    adaptive: true,
  });

  // Generate styles when debounced input changes
  useEffect(() => {
    if (!debouncedInput.trim()) {
      setGeneratedStyles([]);
      return;
    }

    const result = generateInstagramFonts(debouncedInput);
    if (result.success) {
      setGeneratedStyles(result.styles);
    }
  }, [debouncedInput]);

  // Track generation (called explicitly by user actions)
  const trackGeneration = () => {
    // Only track if input is different from last tracked
    if (
      input.trim() &&
      input !== lastTrackedInput &&
      generatedStyles.length > 0
    ) {
      addToHistory({
        id: crypto.randomUUID(),
        tool: 'instagram-font-generator',
        input,
        output: `${generatedStyles.length} styles generated`,
        timestamp: Date.now(),
      });
      setLastTrackedInput(input);
    }
  };

  // Filter styles based on search and platform
  const filteredStyles = useMemo(() => {
    let filtered = generatedStyles;

    // Filter by search
    if (searchFilter.trim()) {
      const search = searchFilter.toLowerCase();
      filtered = filtered.filter((style) =>
        style.name.toLowerCase().includes(search)
      );
    }

    // Filter by platform compatibility
    if (selectedPlatform !== 'all') {
      filtered = filtered.filter(
        (style) =>
          style.compatibility[
            selectedPlatform as keyof FontStyle['compatibility']
          ]
      );
    }

    // Sort: favorites first, then alphabetically
    return filtered.sort((a, b) => {
      const aFav = localFavoriteStyles.includes(a.id);
      const bFav = localFavoriteStyles.includes(b.id);
      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [generatedStyles, searchFilter, selectedPlatform, localFavoriteStyles]);

  // Show only first 10 styles initially for performance
  const stylesToShow = showAllStyles
    ? filteredStyles
    : filteredStyles.slice(0, 10);

  const handleCopyStyle = async (styleId: string, text: string) => {
    // Track generation before copy (if not already tracked)
    trackGeneration();

    try {
      await navigator.clipboard.writeText(text);
      setCopiedStyleId(styleId);
      setTimeout(() => setCopiedStyleId(null), 2000);

      // Find style name for tracking
      const style = generatedStyles.find((s) => s.id === styleId);

      // Track font copy event with detailed metadata
      trackCustom({
        success: true,
        metadata: {
          action: 'copy_font_style',
          styleId,
          styleName: style?.name || 'unknown',
          textLength: text.length,
          originalInput: input,
          inputLength: input.length,
        },
      });
    } catch (err) {
      console.error('Failed to copy:', err);
      trackCustom({
        success: false,
        metadata: {
          action: 'copy_font_style',
          error: 'clipboard_error',
        },
      });
    }
  };

  const handleCopyAll = async () => {
    // Track generation before copy (if not already tracked)
    trackGeneration();

    const allText = filteredStyles
      .map((style) => `${style.name}:\n${style.text}\n`)
      .join('\n');
    await copyAll(allText);

    trackUse(input, allText, {
      success: true,
    });
  };

  const charCount = input.length;
  const isOverBioLimit = charCount > MAX_CHARS_BIO;
  const isOverPostLimit = charCount > MAX_CHARS_POST;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      {/* Tool Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5" style={{ color: categoryColor }} />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Instagram Font Generator
          </h3>
        </div>
      </div>

      <div className="space-y-3 p-6 md:space-y-6">
        {/* Input Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Your Text
            </label>
            <div className="flex items-center gap-2 text-sm">
              <span
                className={`font-mono ${
                  isOverPostLimit
                    ? 'text-red-500'
                    : isOverBioLimit
                      ? 'text-orange-500'
                      : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {charCount} / {MAX_CHARS_BIO}
              </span>
              <span className="text-gray-400">bio</span>
              <span className="text-gray-300">|</span>
              <span
                className={`font-mono ${
                  isOverPostLimit
                    ? 'text-red-500'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {charCount} / {MAX_CHARS_POST}
              </span>
              <span className="text-gray-400">post</span>
            </div>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your text here... (e.g., Your Name, Bio, Caption)"
            className="h-32 w-full resize-none rounded-lg border-2 bg-gray-50 px-4 py-3 text-base text-gray-900 placeholder-gray-400 transition-all focus:outline-none dark:bg-gray-900 dark:text-white"
            style={{
              borderColor: `${categoryColor}30`,
            }}
            onFocus={(e) => (e.target.style.borderColor = categoryColor)}
            onBlur={(e) => {
              e.target.style.borderColor = `${categoryColor}30`;
              // Track when user leaves the input field
              trackGeneration();
            }}
            maxLength={MAX_CHARS_POST}
          />
          {isOverBioLimit && !isOverPostLimit && (
            <p className="text-sm text-orange-500">
              ⚠️ Text exceeds Instagram bio limit (150 characters)
            </p>
          )}
          {isOverPostLimit && (
            <p className="text-sm text-red-500">
              ❌ Text exceeds Instagram post limit (2200 characters)
            </p>
          )}
        </div>

        {/* Filters - Hidden on mobile */}
        {generatedStyles.length > 0 && (
          <div className="hidden flex-col gap-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-900 sm:flex-row sm:items-center md:flex">
            {/* Search */}
            <div className="flex flex-1 items-center gap-2">
              <Search className="h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search styles..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>

            {/* Platform Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Platform:
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => handlePlatformChange('all')}
                  className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
                    selectedPlatform === 'all'
                      ? 'text-white'
                      : 'text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700'
                  }`}
                  style={{
                    backgroundColor:
                      selectedPlatform === 'all'
                        ? categoryColor
                        : 'transparent',
                  }}
                >
                  All
                </button>
                <button
                  onClick={() => handlePlatformChange('instagram')}
                  className={`rounded p-2 transition-colors ${
                    selectedPlatform === 'instagram'
                      ? 'text-white'
                      : 'text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700'
                  }`}
                  style={{
                    backgroundColor:
                      selectedPlatform === 'instagram'
                        ? categoryColor
                        : 'transparent',
                  }}
                  title="Instagram"
                >
                  <Instagram className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handlePlatformChange('whatsapp')}
                  className={`rounded p-2 transition-colors ${
                    selectedPlatform === 'whatsapp'
                      ? 'text-white'
                      : 'text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700'
                  }`}
                  style={{
                    backgroundColor:
                      selectedPlatform === 'whatsapp'
                        ? categoryColor
                        : 'transparent',
                  }}
                  title="WhatsApp"
                >
                  <MessageCircle className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handlePlatformChange('twitter')}
                  className={`rounded p-2 transition-colors ${
                    selectedPlatform === 'twitter'
                      ? 'text-white'
                      : 'text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700'
                  }`}
                  style={{
                    backgroundColor:
                      selectedPlatform === 'twitter'
                        ? categoryColor
                        : 'transparent',
                  }}
                  title="Twitter"
                >
                  <Twitter className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handlePlatformChange('facebook')}
                  className={`rounded p-2 transition-colors ${
                    selectedPlatform === 'facebook'
                      ? 'text-white'
                      : 'text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700'
                  }`}
                  style={{
                    backgroundColor:
                      selectedPlatform === 'facebook'
                        ? categoryColor
                        : 'transparent',
                  }}
                  title="Facebook"
                >
                  <Facebook className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stats and Actions */}
        {generatedStyles.length > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {filteredStyles.length} style
              {filteredStyles.length !== 1 ? 's' : ''} available
              {localFavoriteStyles.length > 0 &&
                ` • ${localFavoriteStyles.length} favorite${localFavoriteStyles.length !== 1 ? 's' : ''}`}
            </p>
            <button
              onClick={handleCopyAll}
              className="hidden items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all hover:scale-105 active:scale-95 md:flex"
              style={{
                backgroundColor: `${categoryColor}20`,
                color: categoryColor,
              }}
            >
              {copiedAll ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied All!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy All
                </>
              )}
            </button>
          </div>
        )}

        {/* Styles Grid */}
        {stylesToShow.length > 0 ? (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {stylesToShow.map((style) => {
                const isCopied = copiedStyleId === style.id;
                const isFavorited = localFavoriteStyles.includes(style.id);

                return (
                  <div
                    key={style.id}
                    className="group relative rounded-lg border border-gray-200 bg-white p-3 transition-all hover:shadow-lg dark:border-gray-700 dark:bg-gray-800 md:p-4"
                  >
                    {/* Favorite Button */}
                    <button
                      onClick={() => toggleFavoriteStyle(style.id)}
                      className="absolute right-2 top-2 rounded p-1 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                      title={
                        isFavorited
                          ? 'Remove from favorites'
                          : 'Add to favorites'
                      }
                    >
                      <Star
                        className={`h-4 w-4 ${
                          isFavorited
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-400'
                        }`}
                      />
                    </button>

                    {/* Style Name */}
                    <div className="mb-2 pr-8">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {style.name}
                      </h4>
                    </div>

                    {/* Preview */}
                    <div
                      className="mb-3 min-h-[2rem] break-words rounded-lg bg-gray-50 p-2 text-center text-base dark:bg-gray-900 md:min-h-[3rem] md:p-3 md:text-lg"
                      style={{ wordBreak: 'break-word' }}
                    >
                      {style.text}
                    </div>

                    {/* Compatibility Icons & Copy Button - Same Row for both Mobile and Desktop */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Works on:</span>
                        {style.compatibility.instagram && (
                          <Instagram className="h-3.5 w-3.5 text-pink-500" />
                        )}
                        {style.compatibility.whatsapp && (
                          <MessageCircle className="h-3.5 w-3.5 text-green-500" />
                        )}
                        {style.compatibility.twitter && (
                          <Twitter className="h-3.5 w-3.5 text-blue-500" />
                        )}
                        {style.compatibility.facebook && (
                          <Facebook className="h-3.5 w-3.5 text-blue-600" />
                        )}
                      </div>

                      {/* Copy Button - Inline for both Mobile and Desktop */}
                      <button
                        onClick={() => handleCopyStyle(style.id, style.text)}
                        className="flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-all hover:scale-105 active:scale-95 md:px-4 md:py-2 md:text-sm"
                        style={{
                          backgroundColor: isCopied ? '#10b981' : categoryColor,
                        }}
                      >
                        {isCopied ? (
                          <>
                            <Check className="h-3.5 w-3.5 md:h-4 md:w-4" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5 md:h-4 md:w-4" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Load More Button */}
            {!showAllStyles && filteredStyles.length > 10 && (
              <div className="flex justify-center">
                <button
                  onClick={() => setShowAllStyles(true)}
                  className="rounded-lg px-6 py-3 text-sm font-medium transition-all hover:scale-105"
                  style={{
                    backgroundColor: `${categoryColor}20`,
                    color: categoryColor,
                  }}
                >
                  Show All {filteredStyles.length} Styles
                </button>
              </div>
            )}
          </div>
        ) : input.trim() ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-900">
            <p className="text-gray-500 dark:text-gray-400">
              No styles match your filters. Try adjusting your search or
              platform selection.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-900">
            <Sparkles
              className="mx-auto mb-4 h-12 w-12"
              style={{ color: categoryColor }}
            />
            <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
              Type your text above to see all styles
            </p>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {fontStyles.length}+ unique Unicode font styles available
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
