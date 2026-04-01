'use client';

import { CSSProperties } from 'react';
import { cn } from '@/lib/utils';
import { getToolIcon, getCategoryIcon } from '@/lib/tool-icons';

interface ToolIconProps {
  /** Tool ID (e.g. 'json-formatter') or category ID (e.g. 'data') */
  id: string;
  /** Whether this is a tool or category icon */
  type?: 'tool' | 'category';
  /** Tailwind classes for size and color. Defaults to 'h-5 w-5' */
  className?: string;
  /** Inline styles forwarded to the SVG element (e.g. color) */
  style?: CSSProperties;
}

/**
 * Renders the Lucide SVG icon for a tool or category.
 * Uses the toolIconMap / categoryIconMap from lib/tool-icons.ts.
 */
export function ToolIcon({ id, type = 'tool', className, style }: ToolIconProps) {
  const Icon = type === 'category' ? getCategoryIcon(id) : getToolIcon(id);
  return <Icon className={cn('h-5 w-5', className)} style={style} aria-hidden="true" />;
}
