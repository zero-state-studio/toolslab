'use client';

import { useState, useEffect } from 'react';
import { Search, ArrowRight, Sparkles } from 'lucide-react';
import { ToolIcon } from '@/components/ui/ToolIcon';
import { searchTools } from '@/lib/tools';
import { useRouter } from 'next/navigation';

const placeholders = [
  'json formatter',
  'base64 encoder',
  'uuid generator',
  'url decoder',
  'hash generator',
  'timestamp converter',
];

export function HeroSection() {
  const [currentPlaceholder, setCurrentPlaceholder] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const router = useRouter();

  // Rotate placeholder text
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPlaceholder((prev) => (prev + 1) % placeholders.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const searchResults =
    searchQuery.length > 0 ? searchTools(searchQuery).slice(0, 5) : [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchResults.length > 0) {
      router.push(searchResults[0].route);
    }
  };

  const handleResultClick = (route: string) => {
    router.push(route);
    setSearchQuery('');
    setIsSearchFocused(false);
  };

  return (
    <section className="hero-section">
      <div className="hero-pattern" />

      <div className="container-main">
        <div className="hero-content">
          <div className="mb-4 flex items-center justify-center gap-2 sm:mb-6">
            <div className="flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs backdrop-blur-sm sm:gap-2 sm:px-4 sm:py-2 sm:text-sm">
              <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">
                Trusted by developers worldwide
              </span>
              <span className="sm:hidden">
                Trusted by researchers worldwide
              </span>
            </div>
          </div>

          <h1 className="hero-title text-3xl sm:text-4xl md:text-5xl lg:text-6xl">
            <span className="block sm:inline">Your Developer</span>{' '}
            <span className="block sm:inline">Tools </span>
            <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              Laboratory
            </span>
          </h1>

          <p className="hero-subtitle mx-auto max-w-xs text-base sm:max-w-md sm:text-lg md:max-w-2xl md:text-xl lg:text-2xl">
            Experiment, Transform, Deploy.
            <span className="hidden sm:inline">
              {' '}
              Precision-engineered tools for your development workflow.
            </span>
            <span className="sm:hidden">
              {' '}
              Precision-engineered tools for your development workflow.
            </span>
          </p>

          {/* Hero Search */}
          <div className="hero-search">
            <form onSubmit={handleSearch} className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400 sm:left-6 sm:h-6 sm:w-6" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() =>
                    setTimeout(() => setIsSearchFocused(false), 200)
                  }
                  placeholder={`Try "${placeholders[currentPlaceholder]}"`}
                  className="h-12 w-full rounded-xl border border-white/20 bg-white/10 pl-10 pr-20 text-sm text-white placeholder-white/70 backdrop-blur-md transition-all duration-200 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 sm:h-14 sm:rounded-2xl sm:pl-16 sm:pr-28 sm:text-base md:h-16 md:text-lg"
                  suppressHydrationWarning
                />

                {/* Search button */}
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 flex -translate-y-1/2 transform cursor-pointer items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-blue-600 transition-colors hover:bg-gray-100 sm:right-3 sm:gap-2 sm:rounded-xl sm:px-4 sm:py-2 sm:text-sm md:px-6 md:py-3 md:text-base"
                >
                  <span className="hidden sm:inline">Search</span>
                  <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
                </button>
              </div>

              {/* Search Results Dropdown */}
              {isSearchFocused && searchQuery && (
                <div className="absolute left-0 right-0 top-full z-50 mt-4">
                  <div className="rounded-2xl border border-white/20 bg-white/10 p-4 shadow-xl backdrop-blur-md">
                    {searchResults.length > 0 ? (
                      <div className="space-y-2">
                        <div className="mb-3 text-xs text-white/70">
                          {searchResults.length} tool
                          {searchResults.length === 1 ? '' : 's'} found
                        </div>
                        {searchResults.map((tool) => (
                          <div
                            key={tool.id}
                            className="group flex w-full cursor-pointer items-center rounded-xl p-4 text-left transition-colors hover:bg-white/10"
                          >
                            <ToolIcon id={tool.id} className="mr-4 h-6 w-6 flex-shrink-0 text-white/90" />
                            <div className="flex-1">
                              <div className="font-medium text-white transition-colors group-hover:text-yellow-300">
                                {tool.name}
                              </div>
                              <div className="line-clamp-1 text-sm text-white/70">
                                {tool.description}
                              </div>
                            </div>
                            <ArrowRight className="h-4 w-4 text-white/50 transition-colors group-hover:text-white/80" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 text-center text-white/70">
                        <Search className="mx-auto mb-3 h-8 w-8 opacity-50" />
                        <div className="text-sm">
                          No tools found for &ldquo;{searchQuery}&rdquo;
                        </div>
                        <div className="mt-1 text-xs">
                          Try searching for &ldquo;json&rdquo;,
                          &ldquo;encode&rdquo;, or &ldquo;hash&rdquo;
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </form>

            {/* Quick suggestions */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2 sm:mt-8 sm:gap-3">
              <span className="text-xs text-white/70 sm:text-sm">Popular:</span>
              {['JSON', 'Base64', 'UUID', 'Hash'].map((term) => (
                <button
                  key={term}
                  onClick={() =>
                    handleResultClick(`/tools/${term.toLowerCase()}-formatter`)
                  }
                  className="cursor-pointer rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs text-white backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:bg-white/20 sm:px-4 sm:py-2 sm:text-sm"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
