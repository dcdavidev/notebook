'use client';

import { type ComponentType, useEffect, useState } from 'react';

import { useTranslations } from 'next-intl';

import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
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
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import {
  IconBrandFacebook,
  IconBrandGithub,
  IconBrandGoogle,
  IconLogin2,
  IconLogout,
  type IconProps,
} from '@tabler/icons-react';

import { useAuth } from './auth-context';

import { Link } from '@/i18n/navigation';
import { type AuthProviderId, authProviders } from '@/lib/auth-providers';

const providerIcons: Record<AuthProviderId, ComponentType<IconProps>> = {
  google: IconBrandGoogle,
  github: IconBrandGithub,
  facebook: IconBrandFacebook,
};

/**
 * Account button of the app bar. Signed out, it opens a dialog with the
 * third-party accounts; signed in, it shows the avatar and a menu to sign
 * out. It is hidden when the site has no Supabase project.
 */
export function AccountMenu() {
  const t = useTranslations('Auth');
  const { enabled, loading, account, signIn, signOut } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pending, setPending] = useState<AuthProviderId | null>(null);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [failed, setFailed] = useState(false);

  // The sign-in callback adds `?auth=error` when it cannot open a session.
  useEffect(() => {
    const url = new URL(location.href);
    if (url.searchParams.get('auth') !== 'error') {
      return;
    }
    url.searchParams.delete('auth');
    history.replaceState(history.state, '', url);
    const timer = setTimeout(() => {
      setFailed(true);
    }, 0);
    return () => {
      clearTimeout(timer);
    };
  }, []);

  if (!enabled) {
    return null;
  }

  const startSignIn = async (provider: AuthProviderId) => {
    setPending(provider);
    try {
      await signIn(provider);
    } catch {
      setPending(null);
      setFailed(true);
    }
  };

  const errorSnackbar = (
    <Snackbar
      open={failed}
      autoHideDuration={6000}
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
        {errorSnackbar}
      </>
    );
  }

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
                    void startSignIn(id);
                  }}
                  sx={{ justifyContent: 'flex-start' }}
                >
                  {t('continueWith', { provider: name })}
                </Button>
              );
            })}
          </Stack>
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
      {errorSnackbar}
    </>
  );
}
