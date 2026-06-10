import type { Metadata } from 'next';
import { RootDocument } from '@/components/layout/RootDocument';
import { baseMetadata } from '@/lib/seo/base-metadata';

export const metadata: Metadata = baseMetadata;

/**
 * Root layout for the unprefixed (English) tree. Routes without a locale
 * prefix are always English, so lang is hardcoded — no headers() lookup,
 * which keeps every page statically prerenderable.
 */
export default function EnglishRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RootDocument lang="en">{children}</RootDocument>;
}
