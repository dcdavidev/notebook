'use client';

import type { ComponentType } from 'react';

import { useTranslations } from 'next-intl';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import {
  IconCertificate,
  IconFlag,
  IconFlame,
  IconHeartHandshake,
  IconLock,
  type IconProps,
  IconRocket,
  IconTrophy,
} from '@tabler/icons-react';

import type { Badge, BadgeId } from './badges';

/**
Icon and color of each badge.
*/
const looks: Record<
  BadgeId,
  { Icon: ComponentType<IconProps>; color: string }
> = {
  supporter: { Icon: IconHeartHandshake, color: '#e11d48' },
  'lessons-1': { Icon: IconFlag, color: '#0891b2' },
  'lessons-10': { Icon: IconFlame, color: '#ea580c' },
  'lessons-50': { Icon: IconRocket, color: '#7c3aed' },
  'lessons-100': { Icon: IconTrophy, color: '#ca8a04' },
  course: { Icon: IconCertificate, color: '#16a34a' },
};

/**
 * Round medal with the badge icon: in color when earned, gray with a lock
 * when not.
 */
export function BadgeMedal({
  id,
  earned,
  size = 56,
}: {
  id: BadgeId;
  earned: boolean;
  size?: number;
}) {
  const { Icon, color } = looks[id];
  return (
    <Box
      aria-hidden
      sx={{
        position: 'relative',
        flexShrink: 0,
        width: size,
        height: size,
        borderRadius: '50%',
        display: 'grid',
        placeItems: 'center',
        color: earned ? '#fff' : 'text.disabled',
        bgcolor: earned
          ? color
          : 'color-mix(in oklch, var(--nb-text) 8%, transparent)',
        boxShadow: earned
          ? `0 0 0 3px color-mix(in oklch, ${color} 25%, transparent)`
          : 'none',
      }}
    >
      <Icon size={size * 0.5} />
      {!earned && (
        <Box
          sx={{
            position: 'absolute',
            right: -2,
            bottom: -2,
            width: size * 0.4,
            height: size * 0.4,
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            bgcolor: 'background.paper',
            color: 'text.secondary',
            border: 1,
            borderColor: 'divider',
          }}
        >
          <IconLock size={size * 0.22} />
        </Box>
      )}
    </Box>
  );
}

/**
 * Grid of every badge, earned ones first, each with its name, what it is
 * for, and how far the visitor is from it.
 */
export function BadgeGrid({
  badges,
  completedLessons,
}: {
  badges: Badge[];
  completedLessons: number;
}) {
  const t = useTranslations('Account.badges');
  const sorted = [
    ...badges.filter((badge) => badge.earned),
    ...badges.filter((badge) => !badge.earned),
  ];

  return (
    <Box
      component="ul"
      sx={{
        m: 0,
        p: 0,
        listStyle: 'none',
        display: 'grid',
        gap: 2,
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(3, 1fr)',
        },
      }}
    >
      {sorted.map((badge) => {
        let status = t('earned');
        if (!badge.earned) {
          status = badge.count
            ? t('lessonsLeft', {
                done: Math.min(completedLessons, badge.count),
                total: badge.count,
              })
            : t('locked');
        }
        return (
          <Stack
            key={badge.id}
            component="li"
            direction="row"
            sx={{
              gap: 1.5,
              alignItems: 'center',
              p: 1.5,
              borderRadius: 3,
              border: 1,
              borderColor: 'divider',
              opacity: badge.earned ? 1 : 0.75,
            }}
          >
            <BadgeMedal id={badge.id} earned={badge.earned} />
            <Stack sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 700 }}>
                {t(`${badge.id}.name`)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {badge.id === 'course' && badge.courses?.length
                  ? badge.courses.join(', ')
                  : t(`${badge.id}.description`)}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 600,
                  color: badge.earned ? 'success.main' : 'text.secondary',
                }}
              >
                {status}
              </Typography>
            </Stack>
          </Stack>
        );
      })}
    </Box>
  );
}
