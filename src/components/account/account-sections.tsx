'use client';

import { type FormEvent, type ReactNode, useState } from 'react';

import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { useFormatter, useTranslations } from 'next-intl';

import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import MuiLink from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import { useColorScheme } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import {
  IconDownload,
  IconLink,
  IconLinkOff,
  IconLogout,
  IconTrash,
} from '@tabler/icons-react';

import type { UserIdentity } from '@supabase/supabase-js';

import { PageSpinner } from './page-spinner';

import { type Account, useAuth } from '@/components/auth/auth-context';
import {
  providerIcons,
  SignInButtons,
} from '@/components/auth/sign-in-buttons';
import { FavoriteButton } from '@/components/favorites/favorite-button';
import {
  type Favorite,
  useFavorites,
} from '@/components/favorites/favorites-context';
import { type AuthProviderId, authProviders } from '@/lib/auth-providers';
import { type Locale, localeNames } from '@/lib/locale';
import { usePalette } from '@/theme/palette-context';
import { palettes } from '@/theme/palettes';

type Notice = { severity: 'success' | 'error'; message: string } | null;

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Paper
      component="section"
      variant="outlined"
      sx={{ p: { xs: 2.5, sm: 3 }, borderRadius: 3, bgcolor: 'transparent' }}
    >
      <Typography variant="h6" component="h2" sx={{ fontWeight: 700 }}>
        {title}
      </Typography>
      {description && (
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          {description}
        </Typography>
      )}
      <Stack sx={{ mt: 2.5, gap: 2 }}>{children}</Stack>
    </Paper>
  );
}

/**
 * Asks the visitor to sign in when the account page opens signed out.
 */
function SignedOut() {
  const t = useTranslations('Account');
  const { signIn } = useAuth();
  const [pending, setPending] = useState<AuthProviderId | null>(null);
  const [failed, setFailed] = useState(false);

  return (
    <Stack sx={{ maxWidth: 440, mx: 'auto', gap: 2 }}>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
        {t('signedOutTitle')}
      </Typography>
      <Typography color="text.secondary">{t('signedOutText')}</Typography>
      {failed && <Alert severity="error">{t('error')}</Alert>}
      <SignInButtons
        pending={pending}
        onSelect={(provider) => {
          const start = async () => {
            setPending(provider);
            try {
              await signIn(provider);
            } catch {
              setPending(null);
              setFailed(true);
            }
          };
          void start();
        }}
      />
    </Stack>
  );
}

function ProfileSection({
  account,
  notify,
}: {
  account: Account;
  notify: (notice: Notice) => void;
}) {
  const t = useTranslations('Account');
  const format = useFormatter();
  const { profile, updateProfile } = useAuth();
  const [draft, setDraft] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const savedName = profile?.display_name ?? account.name;
  const name = draft ?? savedName;
  const trimmed = name.trim();
  const isValid = trimmed.length > 0 && trimmed.length <= 80;

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!isValid) {
      return;
    }
    setSaving(true);
    try {
      await updateProfile({ display_name: trimmed });
      setDraft(null);
      notify({ severity: 'success', message: t('saved') });
    } catch {
      notify({ severity: 'error', message: t('error') });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Section title={t('profileTitle')}>
      <Stack direction="row" sx={{ alignItems: 'center', gap: 2 }}>
        <Avatar
          src={account.avatarUrl}
          alt=""
          slotProps={{ img: { referrerPolicy: 'no-referrer' } }}
          sx={{ width: 64, height: 64, fontSize: '1.5rem' }}
        >
          {account.name.charAt(0).toUpperCase()}
        </Avatar>
        <Stack sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 600, fontSize: '1.125rem' }} noWrap>
            {account.name}
          </Typography>
          {account.email && (
            <Typography color="text.secondary" noWrap>
              {account.email}
            </Typography>
          )}
          <Typography variant="body2" color="text.secondary">
            {t('memberSince', {
              date: format.dateTime(new Date(account.createdAt), {
                dateStyle: 'long',
              }),
            })}
          </Typography>
        </Stack>
      </Stack>
      <Stack
        component="form"
        onSubmit={(event) => {
          void save(event);
        }}
        direction={{ xs: 'column', sm: 'row' }}
        sx={{ gap: 1.5, alignItems: { sm: 'flex-start' } }}
      >
        <TextField
          label={t('displayName')}
          value={name}
          onChange={(event) => {
            setDraft(event.target.value);
          }}
          error={!isValid}
          helperText={t('displayNameHelp')}
          slotProps={{ htmlInput: { maxLength: 80 } }}
          autoComplete="nickname"
          disabled={!profile}
          sx={{ flex: 1 }}
        />
        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={!profile || !isValid || saving || trimmed === savedName}
          sx={{ minHeight: 56 }}
        >
          {t('save')}
        </Button>
      </Stack>
    </Section>
  );
}

function LinkedAccountsSection({
  account,
  notify,
}: {
  account: Account;
  notify: (notice: Notice) => void;
}) {
  const t = useTranslations('Account');
  const { linkProvider, unlinkIdentity } = useAuth();
  const [pending, setPending] = useState<AuthProviderId | null>(null);

  const identityOf = (provider: AuthProviderId): UserIdentity | undefined =>
    account.identities.find((identity) => identity.provider === provider);
  const isLast = account.identities.length <= 1;

  const run = async (provider: AuthProviderId, action: () => Promise<void>) => {
    setPending(provider);
    try {
      await action();
    } catch {
      notify({ severity: 'error', message: t('error') });
    } finally {
      setPending(null);
    }
  };

  return (
    <Section title={t('linkedTitle')} description={t('linkedText')}>
      <Stack divider={<Divider flexItem />} sx={{ gap: 1.5 }}>
        {authProviders.map(({ id, name }) => {
          const Icon = providerIcons[id];
          const identity = identityOf(id);
          const email =
            typeof identity?.identity_data?.email === 'string'
              ? identity.identity_data.email
              : undefined;
          return (
            <Stack
              key={id}
              direction="row"
              sx={{ alignItems: 'center', gap: 2, flexWrap: 'wrap' }}
            >
              <Icon size={24} />
              <Stack sx={{ flex: 1, minWidth: 160 }}>
                <Typography sx={{ fontWeight: 600 }}>{name}</Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {identity
                    ? email
                      ? `${t('linked')} · ${email}`
                      : t('linked')
                    : t('notLinked')}
                </Typography>
              </Stack>
              {identity ? (
                <Button
                  variant="text"
                  color="inherit"
                  startIcon={
                    pending === id ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <IconLinkOff size={18} />
                    )
                  }
                  disabled={isLast || pending !== null}
                  title={isLast ? t('lastIdentity') : undefined}
                  onClick={() => {
                    void run(id, async () => {
                      await unlinkIdentity(identity);
                      notify({ severity: 'success', message: t('unlinked') });
                    });
                  }}
                >
                  {t('unlink')}
                </Button>
              ) : (
                <Button
                  variant="outlined"
                  startIcon={
                    pending === id ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <IconLink size={18} />
                    )
                  }
                  disabled={pending !== null}
                  onClick={() => {
                    // On success, the browser leaves for the provider.
                    void run(id, () => linkProvider(id));
                  }}
                >
                  {t('link')}
                </Button>
              )}
            </Stack>
          );
        })}
      </Stack>
      {isLast && (
        <Typography variant="body2" color="text.secondary">
          {t('lastIdentity')}
        </Typography>
      )}
    </Section>
  );
}

function FavoritesSection({
  locale,
  courseTitles,
}: {
  locale: Locale;
  courseTitles: Record<string, string>;
}) {
  const t = useTranslations('Account');
  const { favorites, loading } = useFavorites();

  return (
    <Section title={t('favoritesTitle')} description={t('favoritesText')}>
      {loading ? (
        <CircularProgress size={24} aria-label={t('loading')} />
      ) : favorites.length === 0 ? (
        <Typography color="text.secondary">
          {t.rich('favoritesEmpty', {
            courses: (chunks) => (
              <MuiLink component={NextLink} href={`/${locale}/overview`}>
                {chunks}
              </MuiLink>
            ),
          })}
        </Typography>
      ) : (
        <Stack
          component="ul"
          divider={<Divider component="li" aria-hidden flexItem />}
          sx={{ m: 0, p: 0, listStyle: 'none', gap: 1 }}
        >
          {favorites.map(({ course }) => {
            const title = courseTitles[course] ?? course;
            return (
              <Stack
                key={course}
                component="li"
                direction="row"
                sx={{ alignItems: 'center', gap: 1 }}
              >
                <MuiLink
                  component={NextLink}
                  href={`/${locale}/learn/${course}`}
                  underline="hover"
                  sx={{ flex: 1, fontWeight: 600, color: 'text.primary' }}
                >
                  {title}
                </MuiLink>
                <FavoriteButton course={course} title={title} />
              </Stack>
            );
          })}
        </Stack>
      )}
    </Section>
  );
}

function PreferencesSection({ locale }: { locale: Locale }) {
  const t = useTranslations('Account');
  const { mode } = useColorScheme();
  const { paletteId } = usePalette();
  const paletteName = palettes.find((item) => item.id === paletteId)?.name;

  const rows = [
    { label: t('language'), value: localeNames[locale] },
    {
      label: t('mode'),
      value: mode ? t(`modes.${mode}`) : '',
    },
    { label: t('palette'), value: paletteName ?? '' },
  ];

  return (
    <Section title={t('preferencesTitle')} description={t('preferencesText')}>
      <Stack
        component="dl"
        direction={{ xs: 'column', sm: 'row' }}
        sx={{ m: 0, gap: { xs: 1.5, sm: 4 } }}
      >
        {rows.map(({ label, value }) => (
          <Stack key={label} sx={{ m: 0 }}>
            <Typography component="dt" variant="body2" color="text.secondary">
              {label}
            </Typography>
            <Typography component="dd" sx={{ m: 0, fontWeight: 600 }}>
              {value}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Section>
  );
}

/**
 * Saves a JSON copy of everything Notebook keeps about the visitor.
 */
function downloadData(
  account: Account,
  profile: unknown,
  favorites: Favorite[]
) {
  const data = {
    exportedAt: new Date().toISOString(),
    account: {
      id: account.id,
      email: account.email ?? null,
      createdAt: account.createdAt,
      linkedAccounts: account.identities.map((identity) => ({
        provider: identity.provider,
        email: identity.identity_data?.email ?? null,
        linkedAt: identity.created_at ?? null,
      })),
    },
    profile,
    favorites: favorites.map(({ course, created_at }) => ({
      course,
      addedAt: created_at,
    })),
  };
  const blob = new Blob([`${JSON.stringify(data, null, 2)}\n`], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `notebook-account-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function DataSection({
  account,
  locale,
  notify,
}: {
  account: Account;
  locale: Locale;
  notify: (notice: Notice) => void;
}) {
  const t = useTranslations('Account');
  const router = useRouter();
  const { profile, deleteAccount, signOut } = useAuth();
  const { favorites } = useFavorites();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await deleteAccount();
      setConfirmOpen(false);
      notify({ severity: 'success', message: t('deleted') });
      router.push(`/${locale}/overview`);
    } catch {
      notify({ severity: 'error', message: t('error') });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Section title={t('dataTitle')} description={t('dataText')}>
      <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 1.5 }}>
        <Button
          variant="outlined"
          startIcon={<IconDownload size={18} />}
          onClick={() => {
            downloadData(account, profile, favorites);
          }}
        >
          {t('download')}
        </Button>
        <Button
          variant="outlined"
          color="inherit"
          startIcon={<IconLogout size={18} />}
          onClick={() => {
            void signOut();
          }}
        >
          {t('signOut')}
        </Button>
        <Button
          variant="outlined"
          color="error"
          startIcon={<IconTrash size={18} />}
          onClick={() => {
            setConfirmOpen(true);
          }}
          sx={{ ml: { sm: 'auto' } }}
        >
          {t('deleteAccount')}
        </Button>
      </Stack>
      <Dialog
        open={confirmOpen}
        onClose={() => {
          if (!deleting) {
            setConfirmOpen(false);
          }
        }}
        maxWidth="xs"
      >
        <DialogTitle>{t('deleteTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t('deleteText')}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            color="inherit"
            disabled={deleting}
            onClick={() => {
              setConfirmOpen(false);
            }}
          >
            {t('cancel')}
          </Button>
          <Button
            variant="contained"
            color="error"
            disabled={deleting}
            startIcon={
              deleting ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <IconTrash size={18} />
              )
            }
            onClick={() => {
              void confirmDelete();
            }}
          >
            {t('deleteConfirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </Section>
  );
}

/**
 * Content of the account page: a sign-in prompt, or the profile, linked
 * accounts, preferences, and data of the signed-in visitor.
 */
export function AccountSections({
  locale,
  courseTitles,
}: {
  locale: Locale;
  courseTitles: Record<string, string>;
}) {
  const t = useTranslations('Account');
  const { enabled, loading, account } = useAuth();
  const [notice, setNotice] = useState<Notice>(null);

  if (!enabled) {
    return <Alert severity="info">{t('unavailable')}</Alert>;
  }
  if (loading) {
    return <PageSpinner label={t('loading')} />;
  }

  const snackbar = (
    <Snackbar
      open={notice !== null}
      autoHideDuration={5000}
      onClose={() => {
        setNotice(null);
      }}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      {notice ? (
        <Alert
          severity={notice.severity}
          variant="filled"
          onClose={() => {
            setNotice(null);
          }}
        >
          {notice.message}
        </Alert>
      ) : undefined}
    </Snackbar>
  );

  if (!account) {
    return (
      <>
        <SignedOut />
        {snackbar}
      </>
    );
  }

  return (
    <Stack sx={{ gap: 3 }}>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
        {t('title')}
      </Typography>
      <ProfileSection account={account} notify={setNotice} />
      <LinkedAccountsSection account={account} notify={setNotice} />
      <FavoritesSection locale={locale} courseTitles={courseTitles} />
      <PreferencesSection locale={locale} />
      <DataSection account={account} locale={locale} notify={setNotice} />
      {snackbar}
    </Stack>
  );
}
