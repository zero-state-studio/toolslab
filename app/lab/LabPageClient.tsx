'use client';

import { LocaleLabPageClient } from '../[locale]/lab/LocaleLabPageClient';
import { type Locale } from '@/lib/i18n/config';
import { type Dictionary } from '@/lib/i18n/get-dictionary';

interface LabPageClientProps {
  locale?: Locale;
  dictionary?: Dictionary;
}

export function LabPageClient({
  locale = 'en',
  dictionary,
}: LabPageClientProps) {
  return (
    <LocaleLabPageClient
      locale={locale}
      dictionary={dictionary as Dictionary}
    />
  );
}
