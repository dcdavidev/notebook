'use client';

import { useEffect, useState } from 'react';

import NextLink from 'next/link';
import { useTranslations } from 'next-intl';

import Avatar from '@mui/material/Avatar';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import MuiLink from '@mui/material/Link';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import {
  IconId,
  IconLogin2,
  IconLogout,
  IconUserCircle,
} from '@tabler/icons-react';

import { useAuth } from './auth-context';
import { SignInButtons } from './sign-in-buttons';

import { Link } from '@/i18n/navigation';
import type { AuthProviderId } from '@/lib/auth-providers';
import { notify } from '@/lib/island-notify';
import { onSignInRequest } from '@/lib/sign-in-request';

/**
 * Account button of the app bar. Signed out, it opens a dialog with the
 * third-party accounts; signed in, it shows the avatar and a menu with the
 * account page and sign-out. It is hidden when the site has no Supabase project.
 */
export function AccountMenu() {
  const t = useTranslations('Auth');
  const { enabled, loading, account, signIn, signOut } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pending, setPending] = useState<AuthProviderId | null>(null);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  // The sign-in callback adds `?auth=error` when it cannot open a session.
  useEffect(() => {
    const url = new URL(location.href);
    if (url.searchParams.get('auth') !== 'error') {
      return;
    }
    url.searchParams.delete('auth');
    history.replaceState(history.state, '', url);
    const timer = setTimeout(() => {
      notify({ message: t('error'), severity: 'error' });
    }, 0);
    return () => {
      clearTimeout(timer);
    };
  }, []);

  // Other parts of the page, such as a favorite button, can open the
  // sign-in dialog.
  useEffect(
    () =>
      onSignInRequest(() => {
        setDialogOpen(true);
      }),
    []
  );

  if (!enabled) {
    return null;
  }

  if (loading) {
    return (
      <IconButton disabled aria-label={t('signIn')}>
        <CircularProgress size={20} color="inherit" />
      </IconButton>
    );
  }

  if (account) {
    return (
      <>
        <Tooltip title={t('account')}>
          <IconButton
            onClick={(event) => {
              setAnchor(event.currentTarget);
            }}
            aria-label={t('accountOf', { name: account.name })}
            aria-haspopup="menu"
            aria-expanded={anchor ? 'true' : undefined}
            sx={{ p: 0.5 }}
          >
            <Avatar
              src={account.avatarUrl}
              alt=""
              slotProps={{ img: { referrerPolicy: 'no-referrer' } }}
              sx={{ width: 32, height: 32 }}
            >
              {account.name.charAt(0).toUpperCase()}
            </Avatar>
          </IconButton>
        </Tooltip>
        <Menu
          anchorEl={anchor}
          open={Boolean(anchor)}
          onClose={() => {
            setAnchor(null);
          }}
          slotProps={{ paper: { sx: { minWidth: 240 } } }}
        >
          <Stack sx={{ px: 2, py: 1 }}>
            <Typography sx={{ fontWeight: 600 }} noWrap>
              {account.name}
            </Typography>
            {account.email && (
              <Typography variant="body2" color="text.secondary" noWrap>
                {account.email}
              </Typography>
            )}
          </Stack>
          <Divider />
          <MenuItem
            component={NextLink}
            href="/profile"
            onClick={() => {
              setAnchor(null);
            }}
          >
            <ListItemIcon>
              <IconId size={20} />
            </ListItemIcon>
            <ListItemText>{t('myProfile')}</ListItemText>
          </MenuItem>
          <MenuItem
            component={NextLink}
            href="/account"
            onClick={() => {
              setAnchor(null);
            }}
          >
            <ListItemIcon>
              <IconUserCircle size={20} />
            </ListItemIcon>
            <ListItemText>{t('myAccount')}</ListItemText>
          </MenuItem>
          <MenuItem
            onClick={() => {
              setAnchor(null);
              void signOut();
            }}
          >
            <ListItemIcon>
              <IconLogout size={20} />
            </ListItemIcon>
            <ListItemText>{t('signOut')}</ListItemText>
          </MenuItem>
        </Menu>
      </>
    );
  }

  const startSignIn = async (provider: AuthProviderId) => {
    setPending(provider);
    try {
      await signIn(provider);
    } catch {
      setPending(null);
      notify({ message: t('error'), severity: 'error' });
    }
  };

  return (
    <>
      <Tooltip title={t('signIn')}>
        <IconButton
          onClick={() => {
            setDialogOpen(true);
          }}
          aria-label={t('signIn')}
          aria-haspopup="dialog"
          color="inherit"
        >
          <IconLogin2 />
        </IconButton>
      </Tooltip>
      <Dialog
        open={dialogOpen}
        onClose={() => {
          if (!pending) {
            setDialogOpen(false);
          }
        }}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>{t('title')}</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            {t('description')}
          </Typography>
          <SignInButtons
            pending={pending}
            onSelect={(provider) => {
              void startSignIn(provider);
            }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2.5 }}>
            {t.rich('privacyNotice', {
              privacy: (chunks) => (
                <MuiLink
                  component={Link}
                  href="/privacy"
                  onClick={() => {
                    setDialogOpen(false);
                  }}
                >
                  {chunks}
                </MuiLink>
              ),
            })}
          </Typography>
        </DialogContent>
      </Dialog>
    </>
  );
}
