'use client';

import { useTranslations } from 'next-intl';

import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

import { IconStar, IconStarFilled } from '@tabler/icons-react';

import { useFavorites } from './favorites-context';

import { useAuth } from '@/components/auth/auth-context';
import { notify } from '@/lib/island-notify';
import { requestSignIn } from '@/lib/sign-in-request';

interface FavoriteButtonProps {
  /**
  Topic folder of the course, for example `abap`.
  */
  course: string;
  /**
  Course title, for the accessible name of the icon button.
  */
  title: string;
  /**
   * `icon`: a star only, for cards. `button`: a star with a label, for
   * the course page.
   */
  variant?: 'icon' | 'button';
  /**
  Color of the filled star. Defaults to the theme's warning amber.
  */
  color?: string;
}

/**
 * Star that adds a course to the favorites or removes it. Signed out, it
 * opens the sign-in dialog. It is hidden when the site has no accounts.
 */
export function FavoriteButton({
  course,
  title,
  variant = 'icon',
  color = 'warning.main',
}: FavoriteButtonProps) {
  const t = useTranslations('Favorites');
  const { enabled, loading, account } = useAuth();
  const favorites = useFavorites();

  if (!enabled) {
    return null;
  }

  const isFavorite = account !== null && favorites.isFavorite(course);
  const isBusy = loading || (account !== null && favorites.loading);
  const label = t(isFavorite ? 'remove' : 'add', { course: title });
  const shortLabel = t(isFavorite ? 'saved' : 'save');

  const toggle = async () => {
    if (!account) {
      requestSignIn();
      return;
    }
    try {
      await favorites.toggleFavorite(course);
    } catch {
      notify({ message: t('error'), severity: 'error' });
    }
  };

  const icon = isFavorite ? (
    <IconStarFilled size={20} />
  ) : (
    <IconStar size={20} />
  );

  if (variant === 'button') {
    return (
      <>
        <Button
          variant="outlined"
          color="inherit"
          startIcon={icon}
          aria-pressed={isFavorite}
          disabled={isBusy}
          onClick={() => {
            void toggle();
          }}
          sx={{
            textTransform: 'none',
            borderRadius: 3,
            py: 0.75,
            borderColor: 'divider',
            '& .MuiButton-startIcon': {
              color: isFavorite ? color : 'inherit',
            },
          }}
        >
          {shortLabel}
        </Button>
      </>
    );
  }

  return (
    <>
      <Tooltip title={shortLabel}>
        {/* The span keeps the tooltip working while the button is disabled. */}
        <span>
          <IconButton
            aria-label={label}
            aria-pressed={isFavorite}
            disabled={isBusy}
            onClick={() => {
              void toggle();
            }}
            sx={{ color: isFavorite ? color : 'text.secondary' }}
          >
            {icon}
          </IconButton>
        </span>
      </Tooltip>
    </>
  );
}
