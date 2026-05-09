'use client';

import { FlaskConical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LabLogoProps {
  className?: string;
  /** kept for back-compat with existing call sites (ignored). */
  animated?: boolean;
  /** size of the rounded mark in px. Defaults to 28. */
  size?: number;
}

/**
 * Playground logo mark — a rounded-square in `accent → accent-2` gradient
 * with the flask glyph in white. Works in both themes (accents are live tokens).
 */
export function LabLogo({ className, size = 28 }: LabLogoProps) {
  const iconSize = Math.round(size * 0.57);
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-[8px] text-white shadow-sm',
        className
      )}
      style={{
        width: size,
        height: size,
        backgroundImage:
          'linear-gradient(135deg, var(--pg-accent) 0%, var(--pg-accent-2) 100%)',
      }}
      aria-label="ToolsLab logo"
    >
      <FlaskConical strokeWidth={2.2} size={iconSize} />
    </span>
  );
}

export default LabLogo;
