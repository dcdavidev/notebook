'use client';

import { NextIntlClientProvider } from 'next-intl';

import Box from '@mui/material/Box';

import enMessages from '../../../messages/en.json';
import itMessages from '../../../messages/it.json';

import { ProfileContent } from './profile-content';

import { PageSpinner } from '@/components/account/page-spinner';
import { DocumentLanguage } from '@/components/document-language';
import { AppShell } from '@/components/shell/app-shell';
import type { CourseSummary } from '@/lib/courses';
import type { Locale } from '@/lib/locale';
import { usePreferredLocale } from '@/lib/preferred-locale';

const messages: Record<Locale, typeof enMessages> = {
  en: enMessages,
  it: itMessages,
};

/**
Courses and titles of one language.
*/
export interface ProfileData {
  courses: CourseSummary[];
  courseTitles: Record<string, string>;
  lessonTitles: Record<string, string>;
}

/**
 * The `/profile` page inside the app shell, in the visitor's language.
 */
export function ProfilePage({ data }: { data: Record<Locale, ProfileData> }) {
  const locale = usePreferredLocale();

  // Only the browser knows the language, so the server renders a spinner.
  if (!locale) {
    return (
      <Box sx={{ minHeight: '100dvh', bgcolor: 'background.default' }}>
        <PageSpinner label="Loading" />
      </Box>
    );
  }

  const { courses, courseTitles, lessonTitles } = data[locale];

  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages[locale]}
      timeZone={new Intl.DateTimeFormat().resolvedOptions().timeZone}
    >
      <DocumentLanguage lang={locale} />
      <AppShell courses={courses}>
        <ProfileContent
          locale={locale}
          courseTitles={courseTitles}
          lessonTitles={lessonTitles}
        />
      </AppShell>
    </NextIntlClientProvider>
  );
}
