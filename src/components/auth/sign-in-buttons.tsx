'use client';

import type { ComponentType } from 'react';

import { useTranslations } from 'next-intl';

import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import type { SxProps, Theme } from '@mui/material/styles';

import {
  FacebookLogo,
  GitHubLogo,
  GoogleLogo,
  type LogoProps,
  providerLogos,
} from './provider-logos';

import { type AuthProviderId, authProviders } from '@/lib/auth-providers';

/**
Logo of each provider, for lists such as the linked accounts.
*/
export const providerIcons: Record<
  AuthProviderId,
  ComponentType<LogoProps>
> = providerLogos;

interface Brand {
  Logo: ComponentType<LogoProps>;
  sx: SxProps<Theme>;
}

/**
 * Builds the look of a sign-in button from the provider's colors: the
 * background, border, and text in the light and dark themes, plus the font
 * and corner radius from the provider's guidelines.
 */
function brand(options: {
  Logo: ComponentType<LogoProps>;
  font: string;
  radius: string;
  light: { bg: string; hover: string; border: string; text: string };
  dark?: { bg: string; hover: string; border: string; text: string };
}): Brand {
  const { light, dark = light } = options;
  return {
    Logo: options.Logo,
    sx: (theme) => ({
      justifyContent: 'flex-start',
      gap: 0.5,
      fontFamily: options.font,
      fontWeight: 600,
      textTransform: 'none',
      letterSpacing: 0,
      borderRadius: options.radius,
      border: '1px solid',
      bgcolor: light.bg,
      borderColor: light.border,
      color: light.text,
      '&:hover': { bgcolor: light.hover, borderColor: light.border },
      '&.Mui-disabled': {
        bgcolor: light.bg,
        borderColor: light.border,
        color: light.text,
        opacity: 0.6,
      },
      ...theme.applyStyles('dark', {
        bgcolor: dark.bg,
        borderColor: dark.border,
        color: dark.text,
        '&:hover': { bgcolor: dark.hover, borderColor: dark.border },
        '&.Mui-disabled': {
          bgcolor: dark.bg,
          borderColor: dark.border,
          color: dark.text,
          opacity: 0.6,
        },
      }),
    }),
  };
}

const systemFont =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif';

/**
 * Each provider's own sign-in button. The colors follow the brand
 * guidelines of Google, GitHub, and Meta.
 */
const brands: Record<AuthProviderId, Brand> = {
  // White with the multicolor "G"; the dark variant is near-black.
  google: brand({
    Logo: GoogleLogo,
    font: `Roboto, ${systemFont}`,
    radius: '4px',
    light: {
      bg: '#FFFFFF',
      hover: '#F2F2F2',
      border: '#747775',
      text: '#1F1F1F',
    },
    dark: {
      bg: '#131314',
      hover: '#2A2A2C',
      border: '#8E918F',
      text: '#E3E3E3',
    },
  }),
  // Near-black with white text and the GitHub mark.
  github: brand({
    Logo: GitHubLogo,
    font: systemFont,
    radius: '6px',
    light: {
      bg: '#24292F',
      hover: '#32383F',
      border: '#24292F',
      text: '#FFFFFF',
    },
    dark: {
      bg: '#24292F',
      hover: '#32383F',
      border: 'rgb(240 246 252 / 0.2)',
      text: '#FFFFFF',
    },
  }),
  // Facebook blue with the white "f" in the same on every theme.
  facebook: brand({
    Logo: FacebookLogo,
    font: `Helvetica, Arial, ${systemFont}`,
    radius: '6px',
    light: {
      bg: '#1877F2',
      hover: '#166FE5',
      border: '#1877F2',
      text: '#FFFFFF',
    },
  }),
};

interface SignInButtonsProps {
  /**
  Provider whose sign-in is starting: its button shows a spinner.
  */
  pending: AuthProviderId | null;
  onSelect: (provider: AuthProviderId) => void;
}

/**
 * One "Continue with …" button per third-party account, each in its
 * provider's own style.
 */
export function SignInButtons({ pending, onSelect }: SignInButtonsProps) {
  const t = useTranslations('Auth');

  return (
    <Stack sx={{ gap: 1.5 }}>
      {authProviders.map(({ id, name }) => {
        const { Logo, sx } = brands[id];
        return (
          <Button
            key={id}
            size="large"
            disableElevation
            disabled={pending !== null}
            startIcon={
              pending === id ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <Logo size={20} />
              )
            }
            onClick={() => {
              onSelect(id);
            }}
            sx={sx}
          >
            {t('continueWith', { provider: name })}
          </Button>
        );
      })}
    </Stack>
  );
}
