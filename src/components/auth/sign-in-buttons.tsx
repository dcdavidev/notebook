'use client';

import type { ComponentType } from 'react';

import { useTranslations } from 'next-intl';

import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';

import {
  IconBrandFacebook,
  IconBrandGithub,
  IconBrandGoogle,
  IconBrandWindows,
  type IconProps,
} from '@tabler/icons-react';

import { type AuthProviderId, authProviders } from '@/lib/auth-providers';

/**
Icon of each third-party account.
*/
export const providerIcons: Record<AuthProviderId, ComponentType<IconProps>> = {
  google: IconBrandGoogle,
  github: IconBrandGithub,
  azure: IconBrandWindows,
  facebook: IconBrandFacebook,
};

interface SignInButtonsProps {
  /**
  Provider whose sign-in is starting: its button shows a spinner.
  */
  pending: AuthProviderId | null;
  onSelect: (provider: AuthProviderId) => void;
}

/**
 * One "Continue with …" button per third-party account.
 */
export function SignInButtons({ pending, onSelect }: SignInButtonsProps) {
  const t = useTranslations('Auth');

  return (
    <Stack sx={{ gap: 1.5 }}>
      {authProviders.map(({ id, name }) => {
        const Icon = providerIcons[id];
        return (
          <Button
            key={id}
            variant="outlined"
            size="large"
            disabled={pending !== null}
            startIcon={
              pending === id ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <Icon size={20} />
              )
            }
            onClick={() => {
              onSelect(id);
            }}
            sx={{ justifyContent: 'flex-start' }}
          >
            {t('continueWith', { provider: name })}
          </Button>
        );
      })}
    </Stack>
  );
}
