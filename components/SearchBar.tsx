'use client';

import {
  useState,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, X } from 'lucide-react';
import { searchTools } from '@/lib/tools';
import type { Tool } from '@/lib/tools';
import { ToolIcon } from '@/components/ui/ToolIcon';

interface SearchBarProps {
  placeholder?: string;
  className?: string;
}

export interface SearchBarRef {
  setQuery: (query: string) => void;
}

export const SearchBar = forwardRef<SearchBarRef, SearchBarProps>(
  ({ placeholder = 'Search tools...', className }, ref) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Tool[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const searchRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    useImperativeHandle(ref, () => ({
      setQuery: (newQuery: string) => {
        setQuery(newQuery);
        inputRef.current?.focus();
      },
    }));

    useEffect(() => {
      if (query.trim()) {
        const searchResults = searchTools(query);
        setResults(searchResults.slice(0, 8)); // Limit to 8 results
        setIsOpen(true);
        setSelectedIndex(-1);
      } else {
        setResults([]);
        setIsOpen(false);
      }
    }, [query]);

    useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
        if (
          searchRef.current &&
          !searchRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
        }
      }

      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, []);

    const handleKeyDown = (event: React.KeyboardEvent) => {
      if (!isOpen || results.length === 0) return;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setSelectedIndex((prev) =>
            prev < results.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          event.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;
        case 'Enter':
          event.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < results.length) {
            router.push(results[selectedIndex].route);
            setIsOpen(false);
            setQuery('');
          }
          break;
        case 'Escape':
          setIsOpen(false);
          inputRef.current?.blur();
          break;
      }
    };

    const handleClear = () => {
      setQuery('');
      setResults([]);
      setIsOpen(false);
      inputRef.current?.focus();
    };

    const getCategoryColor = (categoryColor: string) => {
      const colors = {
        data: '#0EA5E9',
        encoding: '#10B981',
        text: '#8B5CF6',
        generators: '#F97316',
        web: '#EC4899',
        dev: '#F59E0B',
        formatters: '#6366F1',
        social: '#F43F5E',
      };
      return colors[categoryColor as keyof typeof colors] || '#3B82F6';
    };

    return (
      <div ref={searchRef} className={`relative ${className}`}>
        <div className="relative">
          <label htmlFor="global-search" className="sr-only">
            Search tools
          </label>
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="global-search"
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (results.length > 0) setIsOpen(true);
            }}
            placeholder={placeholder}
            className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-10 text-gray-900 placeholder-gray-500 transition-colors duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 dark:focus:ring-blue-400"
            suppressHydrationWarning
          />
          {query && (
            <button
              onClick={handleClear}
              className="absolute inset-y-0 right-0 flex items-center pr-3 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {isOpen && results.length > 0 && (
          <div className="absolute z-50 mt-2 max-h-96 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800">
            <div className="p-2">
              {results.map((tool, index) => (
                <Link
                  key={tool.id}
                  href={tool.route}
                  onClick={() => {
                    setIsOpen(false);
                    setQuery('');
                  }}
                  className={`block rounded-lg p-3 transition-colors duration-150 ${
                    selectedIndex === index
                      ? 'bg-blue-50 dark:bg-blue-900/30'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                  } `}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border"
                      style={{
                        backgroundColor: `${getCategoryColor(tool.categories[0])}20`,
                        borderColor: `${getCategoryColor(tool.categories[0])}40`,
                        color: getCategoryColor(tool.categories[0]),
                      }}
                    >
                      <ToolIcon id={tool.id} className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate font-medium text-gray-900 dark:text-white">
                        {tool.name}
                      </h4>
                      <p className="truncate text-sm text-gray-600 dark:text-gray-400">
                        {tool.description}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <span
                          className="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium"
                          style={{
                            backgroundColor: `${getCategoryColor(tool.categories[0])}20`,
                            color: getCategoryColor(tool.categories[0]),
                          }}
                        >
                          {tool.categories[0]}
                        </span>
                        {tool.label === 'popular' && (
                          <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400">
                            🔥 Popular
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Search Footer */}
            <div className="border-t border-gray-200 p-3 text-center dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Press{' '}
                <kbd className="rounded bg-gray-100 px-2 py-1 text-xs dark:bg-gray-700">
                  ↑
                </kbd>{' '}
                <kbd className="rounded bg-gray-100 px-2 py-1 text-xs dark:bg-gray-700">
                  ↓
                </kbd>{' '}
                to navigate,{' '}
                <kbd className="rounded bg-gray-100 px-2 py-1 text-xs dark:bg-gray-700">
                  Enter
                </kbd>{' '}
                to select
              </p>
            </div>
          </div>
        )}

        {/* No Results */}
        {isOpen && query.trim() && results.length === 0 && (
          <div className="absolute z-50 mt-2 w-full rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800">
            <div className="p-6 text-center">
              <div className="mb-2 text-gray-400">
                <Search className="mx-auto h-8 w-8" />
              </div>
              <p className="font-medium text-gray-600 dark:text-gray-400">
                No tools found for &ldquo;{query}&rdquo;
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Try searching with different keywords
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }
);

SearchBar.displayName = 'SearchBar';
