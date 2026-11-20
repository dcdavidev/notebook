'use client';

import type { ComponentType } from 'react';

import { useTranslations } from 'next-intl';

import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import type { SxProps, Theme } from '@mui/material/styles';

import {
  IconBrandFacebook,
  IconBrandGoogle,
  IconBrandWindows,
  type IconProps,
} from '@tabler/icons-react';

import { type AuthProviderId, authProviders } from '@/lib/auth-providers';

/**
 * GitHub mark (Octicons `mark-github`, MIT license), the logo GitHub asks
 * sign-in buttons to use.
 */
function GitHubMark({ size = 20 }: Pick<IconProps, 'size'>) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
    </svg>
  );
}

/**
 * Brand styles for providers that ask for their own button look. GitHub's
 * button is near-black with white text and the GitHub mark; on the dark
 * theme it gets a light border so it stands out from the page.
 */
const brandSx: Partial<Record<AuthProviderId, SxProps<Theme>>> = {
  github: (theme) => ({
    justifyContent: 'flex-start',
    bgcolor: '#24292f',
    color: '#ffffff',
    borderColor: '#24292f',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif',
    fontWeight: 600,
    textTransform: 'none',
    borderRadius: '6px',
    '&:hover': { bgcolor: '#32383f', borderColor: '#32383f' },
    '&.Mui-disabled': {
      bgcolor: '#24292f',
      color: 'rgb(255 255 255 / 0.6)',
      borderColor: '#24292f',
    },
    ...theme.applyStyles('dark', {
      borderColor: 'rgb(240 246 252 / 0.2)',
      '&:hover': { bgcolor: '#32383f', borderColor: 'rgb(240 246 252 / 0.3)' },
    }),
  }),
};

/**
Icon of each third-party account.
*/
export const providerIcons: Record<
  AuthProviderId,
  ComponentType<Pick<IconProps, 'size'>>
> = {
  google: IconBrandGoogle,
  github: GitHubMark,
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
        const brand = brandSx[id];
        return (
          <Button
            key={id}
            variant={brand ? 'contained' : 'outlined'}
            disableElevation
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
            sx={brand ?? { justifyContent: 'flex-start' }}
          >
            {t('continueWith', { provider: name })}
          </Button>
        );
      })}
    </Stack>
  );
}
