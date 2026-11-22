'use client';

import { useState } from 'react';

import NextLink from 'next/link';
import { useFormatter, useTranslations } from 'next-intl';

import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';

import { IconSettings } from '@tabler/icons-react';

import {
  BadgesSection,
  BookmarksSection,
  FavoritesSection,
  ProgressSection,
  SignedOut,
} from '@/components/account/account-sections';
import { PageSpinner } from '@/components/account/page-spinner';
import { useAuth } from '@/components/auth/auth-context';
import { computeBadges } from '@/components/badges/badges';
import { useSupporter } from '@/components/badges/use-supporter';
import { useBookmarks } from '@/components/bookmarks/bookmarks-context';
import { useFavorites } from '@/components/favorites/favorites-context';
import { useProgress } from '@/components/progress/progress-context';
import type { Locale } from '@/lib/locale';

const tabs = ['badges', 'progress', 'favorites', 'bookmarks'] as const;

type TabId = (typeof tabs)[number];

/**
 * Profile of the signed-in visitor: a cover, the avatar and name, a row of
 * numbers, and tabs with badges, progress, favorites, and bookmarks.
 */
export function ProfileContent({
  locale,
  courseTitles,
  lessonTitles,
}: {
  locale: Locale;
  courseTitles: Record<string, string>;
  lessonTitles: Record<string, string>;
}) {
  const t = useTranslations('Profile');
  const tAccount = useTranslations('Account');
  const format = useFormatter();
  const { enabled, loading, account } = useAuth();
  const isSupporter = useSupporter();
  const { progress } = useProgress();
  const { favorites } = useFavorites();
  const { bookmarks } = useBookmarks();
  const [tab, setTab] = useState<TabId>('badges');

  let content;
  if (!enabled) {
    content = <Alert severity="info">{tAccount('unavailable')}</Alert>;
  } else if (loading) {
    content = <PageSpinner label={tAccount('loading')} />;
  } else if (!account) {
    content = <SignedOut />;
  }
  if (content || !account) {
    return (
      <Box sx={{ width: '100%', maxWidth: 1000, mx: 'auto', px: 2, py: 6 }}>
        {content}
      </Box>
    );
  }

  const { badges, completedLessons } = computeBadges({
    progress,
    isSupporter: isSupporter === true,
    lessonTitles,
    courseTitles,
  });
  const stats = [
    { value: completedLessons, label: t('statLessons') },
    {
      value: new Set(progress.map((row) => row.course)).size,
      label: t('statCourses'),
    },
    {
      value: badges.filter((badge) => badge.earned).length,
      label: t('statBadges'),
    },
    { value: favorites.length, label: t('statFavorites') },
    { value: bookmarks.length, label: t('statBookmarks') },
  ];
  const sectionProps = { locale, courseTitles, lessonTitles };

  return (
    <Box
      sx={{ width: '100%', maxWidth: 1000, mx: 'auto', px: 2, pt: 2, pb: 8 }}
    >
      {/* Cover in the colors of the current palette. */}
      <Box
        aria-hidden
        sx={{
          height: { xs: 140, md: 200 },
          borderRadius: { xs: 4, md: 6 },
          background: [
            'radial-gradient(circle at 20% 30%, color-mix(in oklch, var(--nb-secondary) 70%, transparent), transparent 55%)',
            'radial-gradient(circle at 80% 70%, color-mix(in oklch, var(--nb-primary) 75%, transparent), transparent 60%)',
            'linear-gradient(135deg, var(--nb-primary), var(--nb-secondary))',
          ].join(', '),
        }}
      />

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        sx={{
          px: { xs: 1, md: 3 },
          mt: { xs: -6, md: -8 },
          gap: { xs: 1.5, sm: 3 },
          alignItems: { xs: 'flex-start', sm: 'flex-end' },
        }}
      >
        <Avatar
          src={account.avatarUrl}
          alt=""
          slotProps={{ img: { referrerPolicy: 'no-referrer' } }}
          sx={{
            width: { xs: 96, md: 136 },
            height: { xs: 96, md: 136 },
            fontSize: { xs: '2.5rem', md: '3.5rem' },
            border: 4,
            borderColor: 'background.default',
          }}
        >
          {account.name.charAt(0).toUpperCase()}
        </Avatar>
        <Stack sx={{ flex: 1, minWidth: 0, gap: 0.5, pb: { sm: 1 } }}>
          <Stack
            direction="row"
            sx={{ alignItems: 'center', gap: 1, flexWrap: 'wrap' }}
          >
            <Typography
              variant="h4"
              component="h1"
              sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}
            >
              {account.name}
            </Typography>
            {isSupporter && (
              <Chip
                label={tAccount('badges.supporterChip')}
                size="small"
                sx={{ bgcolor: '#e11d48', color: '#fff', fontWeight: 700 }}
              />
            )}
          </Stack>
          <Typography variant="body2" color="text.secondary">
            {tAccount('memberSince', {
              date: format.dateTime(new Date(account.createdAt), {
                dateStyle: 'long',
              }),
            })}
          </Typography>
        </Stack>
        <Button
          component={NextLink}
          href="/account"
          variant="outlined"
          color="inherit"
          startIcon={<IconSettings size={18} />}
          sx={{ textTransform: 'none', borderRadius: 999, mb: { sm: 1 } }}
        >
          {t('editProfile')}
        </Button>
      </Stack>

      <Stack
        component="dl"
        direction="row"
        sx={{
          m: 0,
          mt: 3,
          px: { xs: 1, md: 3 },
          gap: { xs: 2.5, md: 4 },
          flexWrap: 'wrap',
        }}
      >
        {stats.map(({ value, label }) => (
          <Stack key={label} sx={{ m: 0, flexDirection: 'column-reverse' }}>
            <Typography component="dt" variant="body2" color="text.secondary">
              {label}
            </Typography>
            <Typography
              component="dd"
              sx={{
                m: 0,
                fontWeight: 800,
                fontSize: '1.5rem',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {value}
            </Typography>
          </Stack>
        ))}
      </Stack>

      <Tabs
        value={tab}
        onChange={(_event, value: TabId) => {
          setTab(value);
        }}
        variant="scrollable"
        allowScrollButtonsMobile
        sx={{
          mt: 4,
          borderBottom: 1,
          borderColor: 'divider',
          '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 },
        }}
      >
        {tabs.map((id) => (
          <Tab
            key={id}
            value={id}
            label={t(`tabs.${id}`)}
            id={`profile-tab-${id}`}
            aria-controls={`profile-panel-${id}`}
          />
        ))}
      </Tabs>

      <Box
        role="tabpanel"
        id={`profile-panel-${tab}`}
        aria-labelledby={`profile-tab-${tab}`}
        sx={{ mt: 3 }}
      >
        {tab === 'badges' && (
          <BadgesSection
            isSupporter={isSupporter}
            courseTitles={courseTitles}
            lessonTitles={lessonTitles}
          />
        )}
        {tab === 'progress' && <ProgressSection {...sectionProps} />}
        {tab === 'favorites' && (
          <FavoritesSection locale={locale} courseTitles={courseTitles} />
        )}
        {tab === 'bookmarks' && <BookmarksSection {...sectionProps} />}
      </Box>
    </Box>
  );
}
