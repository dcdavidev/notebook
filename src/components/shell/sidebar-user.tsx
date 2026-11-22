'use client';

import NextLink from 'next/link';
import { useTranslations } from 'next-intl';

import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import { IconChevronRight, IconLogin2 } from '@tabler/icons-react';

import { useAuth } from '@/components/auth/auth-context';
import { requestSignIn } from '@/lib/sign-in-request';

/**
 * The visitor at the bottom of the sidebar: avatar and name, linking to
 * the profile page, or a sign-in button. Hidden when the site has no
 * accounts.
 */
export function SidebarUser(props: {
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const { enabled, loading } = useAuth();
  if (!enabled || loading) {
    return null;
  }
  // Sits at the bottom of the sidebar, below a divider.
  return (
    <Stack sx={{ mt: 'auto', pt: 1, borderTop: 1, borderColor: 'divider' }}>
      <SidebarUserContent {...props} />
    </Stack>
  );
}

function SidebarUserContent({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const t = useTranslations('Shell');
  const tAuth = useTranslations('Auth');
  const { account } = useAuth();

  if (!account) {
    return collapsed ? (
      <Tooltip title={tAuth('signIn')} placement="right">
        <ButtonBase
          onClick={requestSignIn}
          aria-label={tAuth('signIn')}
          sx={{ alignSelf: 'center', p: 1, borderRadius: 2 }}
        >
          <IconLogin2 size={20} />
        </ButtonBase>
      </Tooltip>
    ) : (
      <Button
        variant="outlined"
        startIcon={<IconLogin2 size={18} />}
        onClick={requestSignIn}
        sx={{ mx: 0.5, textTransform: 'none', borderRadius: 999 }}
      >
        {tAuth('signIn')}
      </Button>
    );
  }

  const avatar = (
    <Avatar
      src={account.avatarUrl}
      alt=""
      slotProps={{ img: { referrerPolicy: 'no-referrer' } }}
      sx={{ width: 32, height: 32 }}
    >
      {account.name.charAt(0).toUpperCase()}
    </Avatar>
  );

  if (collapsed) {
    return (
      <Tooltip title={t('profile')} placement="right">
        <ButtonBase
          component={NextLink}
          href="/profile"
          onClick={onNavigate}
          aria-label={t('profile')}
          sx={{ alignSelf: 'center', borderRadius: '50%' }}
        >
          {avatar}
        </ButtonBase>
      </Tooltip>
    );
  }

  return (
    <ButtonBase
      component={NextLink}
      href="/profile"
      onClick={onNavigate}
      sx={{
        justifyContent: 'flex-start',
        gap: 1.25,
        p: 1,
        borderRadius: 2.5,
        textAlign: 'left',
        '&:hover': {
          bgcolor: 'color-mix(in oklch, var(--nb-text) 6%, transparent)',
        },
      }}
    >
      {avatar}
      <Stack sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontWeight: 700, fontSize: 14 }} noWrap>
          {account.name}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap>
          {t('profile')}
        </Typography>
      </Stack>
      <IconChevronRight size={16} aria-hidden />
    </ButtonBase>
  );
}
