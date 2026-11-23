'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';

import dynamic from 'next/dynamic';
import { useLocale, useTranslations } from 'next-intl';

import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

import { IconSearch } from '@tabler/icons-react';

import { loadSearchEngine } from '@/components/search/search-loader';

/**
Loads the code of the dialog, with the search library.
*/
async function importDialog() {
  const { SearchDialog: Dialog } =
    await import('@/components/search/search-dialog');
  return Dialog;
}

// The dialog is not part of the page: it loads when the browser is idle.
const SearchDialog = dynamic(importDialog, { ssr: false });

/**
The platform never changes during a visit: nothing to subscribe to.
*/
function subscribeToPlatform() {
  return unsubscribe;
}

/**
Nothing to undo.
*/
function unsubscribe() {}

/**
Whether the keyboard has a Command key: then the shortcut is ⌘K.
*/
function useIsApple(): boolean {
  return useSyncExternalStore(
    subscribeToPlatform,
    () => /mac|iphone|ipad/i.test(navigator.userAgent),
    () => false
  );
}

/**
 * The search field of the app bar: a button that looks like a field on
 * wide screens and an icon on phones. It opens the search dialog, also
 * with Ctrl+K or ⌘K.
 */
export function SearchButton() {
  const t = useTranslations('Search');
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  // The dialog mounts, closed, once the browser is idle, so the field is
  // ready to type in as soon as it opens; it never unmounts.
  const [isMounted, setIsMounted] = useState(false);
  const isApple = useIsApple();
  const shortcut = isApple ? '⌘K' : 'Ctrl K';

  useEffect(() => {
    const load = () => {
      setIsMounted(true);
    };
    // Safari has no idle callback: wait a moment instead.
    if (!('requestIdleCallback' in globalThis)) {
      const timer = setTimeout(load, 2000);
      return () => {
        clearTimeout(timer);
      };
    }
    const idle = requestIdleCallback(load);
    return () => {
      cancelIdleCallback(idle);
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isShortcut =
        (event.ctrlKey || event.metaKey) &&
        !event.altKey &&
        event.key.toLowerCase() === 'k';
      if (!isShortcut) {
        return;
      }
      event.preventDefault();
      setOpen(true);
      setIsMounted(true);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  // Start loading the index as soon as the reader shows interest.
  const preload = () => {
    void loadSearchEngine(locale).catch(() => {});
  };
  const openSearch = () => {
    setOpen(true);
    setIsMounted(true);
  };

  return (
    <>
      <ButtonBase
        onClick={openSearch}
        onPointerEnter={preload}
        onFocus={preload}
        aria-label={t('open')}
        aria-keyshortcuts={isApple ? 'Meta+K' : 'Control+K'}
        sx={{
          display: { xs: 'none', sm: 'flex' },
          alignItems: 'center',
          gap: 1,
          height: 40,
          width: { sm: 200, lg: 260 },
          px: 1.5,
          borderRadius: 999,
          border: 1,
          borderColor: 'divider',
          color: 'text.secondary',
          bgcolor: 'action.hover',
          justifyContent: 'flex-start',
          '&:hover': { borderColor: 'text.secondary' },
          '&.Mui-focusVisible': {
            outline: '2px solid',
            outlineColor: 'primary.main',
          },
        }}
      >
        <IconSearch size={18} aria-hidden />
        <Box component="span" sx={{ flex: 1, textAlign: 'left' }}>
          {t('button')}
        </Box>
        <Box
          component="kbd"
          sx={{
            fontFamily: 'inherit',
            fontSize: '0.75rem',
            px: 0.75,
            py: 0.25,
            borderRadius: 1,
            border: 1,
            borderColor: 'divider',
          }}
        >
          {shortcut}
        </Box>
      </ButtonBase>
      <Tooltip title={t('open')}>
        <IconButton
          onClick={openSearch}
          onFocus={preload}
          aria-label={t('open')}
          color="inherit"
          sx={{ display: { sm: 'none' } }}
        >
          <IconSearch />
        </IconButton>
      </Tooltip>
      {isMounted && (
        <SearchDialog
          locale={locale}
          open={open}
          onClose={() => {
            setOpen(false);
          }}
        />
      )}
    </>
  );
}
