'use client';

import { useState } from 'react';

import { useTranslations } from 'next-intl';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Snackbar from '@mui/material/Snackbar';
import Tooltip from '@mui/material/Tooltip';

import { IconHeart, IconHeartFilled } from '@tabler/icons-react';

import { useFavorites } from './favorites-context';

import { useAuth } from '@/components/auth/auth-context';
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
   * `icon`: a heart only, for cards. `button`: a heart with a label, for
   * the course page.
   */
  variant?: 'icon' | 'button';
  /**
  Color of the filled heart. Defaults to the theme's error red.
  */
  color?: string;
}

/**
 * Heart that adds a course to the favorites or removes it. Signed out, it
 * opens the sign-in dialog. It is hidden when the site has no accounts.
 */
export function FavoriteButton({
  course,
  title,
  variant = 'icon',
  color = 'error.main',
}: FavoriteButtonProps) {
  const t = useTranslations('Favorites');
  const { enabled, loading, account } = useAuth();
  const favorites = useFavorites();
  const [failed, setFailed] = useState(false);

  if (!enabled) {
    return null;
  }

  const isFavorite = account !== null && favorites.isFavorite(course);
  const isBusy = loading || (account !== null && favorites.loading);
  const label = t(isFavorite ? 'remove' : 'add', { course: title });
  const shortLabel = t(isFavorite ? 'saved' : 'save');
  const heartColor = color;

  const toggle = async () => {
    if (!account) {
      requestSignIn();
      return;
    }
    try {
      await favorites.toggleFavorite(course);
    } catch {
      setFailed(true);
    }
  };

  const icon = isFavorite ? (
    <IconHeartFilled size={20} />
  ) : (
    <IconHeart size={20} />
  );

  const snackbar = (
    <Snackbar
      open={failed}
      autoHideDuration={5000}
      onClose={() => {
        setFailed(false);
      }}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert
        severity="error"
        variant="filled"
        onClose={() => {
          setFailed(false);
        }}
      >
        {t('error')}
      </Alert>
    </Snackbar>
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
              color: isFavorite ? heartColor : 'inherit',
            },
          }}
        >
          {shortLabel}
        </Button>
        {snackbar}
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
            sx={{ color: isFavorite ? heartColor : 'text.secondary' }}
          >
            {icon}
          </IconButton>
        </span>
      </Tooltip>
      {snackbar}
    </>
  );
}
