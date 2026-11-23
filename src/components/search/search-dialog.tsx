'use client';

import {
  Fragment,
  type KeyboardEvent,
  useDeferredValue,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';

import { useTranslations } from 'next-intl';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import InputBase from '@mui/material/InputBase';
import Stack from '@mui/material/Stack';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';

import { IconSearch, IconX } from '@tabler/icons-react';

import { loadSearchEngine } from '@/components/search/search-loader';
import { visuallyHidden } from '@/components/visually-hidden';
import { Link, useRouter } from '@/i18n/navigation';
import type { Locale } from '@/lib/locale';
import { search, type SearchEngine, type SearchResult } from '@/lib/search';

type EngineState =
  | { status: 'loading' }
  | { status: 'ready'; engine: SearchEngine }
  | { status: 'error' };

/**
 * The search dialog: a field and the list of results, in the combobox
 * pattern. The arrow keys move through the results, Enter opens one, and
 * Escape closes the dialog.
 */
export function SearchDialog({
  locale,
  open,
  onClose,
}: {
  locale: Locale;
  open: boolean;
  onClose: () => void;
}) {
  const t = useTranslations('Search');
  const tLearn = useTranslations('Learn');
  const router = useRouter();
  const isFullScreen = useMediaQuery(useTheme().breakpoints.down('sm'));
  const listId = useId();
  const titleId = useId();

  const [state, setState] = useState<EngineState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const [query, setQuery] = useState('');
  // The highlighted result, remembered with the query it belongs to, so a
  // new query starts again from the first result.
  const [active, setActive] = useState({ query: '', index: 0 });
  const deferredQuery = useDeferredValue(query);
  const inputRef = useRef<HTMLInputElement>(null);

  // The index loads the first time the dialog opens.
  useEffect(() => {
    if (!open) {
      return;
    }
    let isCancelled = false;
    const load = async () => {
      try {
        const engine = await loadSearchEngine(locale);
        if (!isCancelled) {
          setState({ status: 'ready', engine });
        }
      } catch {
        if (!isCancelled) {
          setState({ status: 'error' });
        }
      }
    };
    void load();
    return () => {
      isCancelled = true;
    };
  }, [open, locale, attempt]);

  const results = useMemo(
    () => (state.status === 'ready' ? search(state.engine, deferredQuery) : []),
    [state, deferredQuery]
  );
  const activeIndex =
    active.query === deferredQuery
      ? Math.min(active.index, results.length - 1)
      : 0;
  const activeResult = results[activeIndex];
  const optionId = (result: SearchResult) => `${listId}-${result.id}`;

  useEffect(() => {
    if (activeResult) {
      document
        .querySelector(`#${CSS.escape(`${listId}-${activeResult.id}`)}`)
        ?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeResult, listId]);

  const choose = (result: SearchResult) => {
    onClose();
    router.push(result.href);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (results.length === 0) {
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setActive({
        query: deferredQuery,
        index: (activeIndex + step + results.length) % results.length,
      });
    } else if (activeResult && event.key === 'Enter') {
      event.preventDefault();
      choose(activeResult);
    }
  };

  const hasQuery = deferredQuery.trim() !== '';
  let status = '';
  if (hasQuery && state.status === 'loading') {
    status = t('loading');
  } else if (hasQuery && state.status === 'ready') {
    status =
      results.length > 0
        ? t('resultCount', { count: results.length })
        : t('noResults', { query: deferredQuery.trim() });
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={isFullScreen}
      fullWidth
      maxWidth="sm"
      aria-labelledby={titleId}
      slotProps={{
        // On every opening, before the reader can type, put the cursor in
        // the field with the last query selected.
        transition: {
          onEntering: () => {
            inputRef.current?.focus();
            inputRef.current?.select();
          },
        },
        paper: {
          sx: {
            borderRadius: { xs: 0, sm: '20px' },
            bgcolor: 'background.default',
            backgroundImage: 'none',
            alignSelf: { sm: 'flex-start' },
            mt: { sm: '10vh' },
            maxHeight: { sm: '75vh' },
          },
        },
      }}
    >
      <Typography id={titleId} component="h2" sx={visuallyHidden}>
        {t('title')}
      </Typography>
      <Stack
        direction="row"
        sx={{
          alignItems: 'center',
          gap: 1,
          px: 2,
          py: 1,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <IconSearch size={20} aria-hidden />
        <InputBase
          autoFocus
          inputRef={inputRef}
          fullWidth
          value={query}
          placeholder={t('placeholder')}
          onChange={(event) => {
            setQuery(event.target.value);
          }}
          onKeyDown={onKeyDown}
          inputProps={{
            role: 'combobox',
            'aria-label': t('inputLabel'),
            'aria-expanded': results.length > 0,
            'aria-controls': listId,
            'aria-autocomplete': 'list',
            'aria-activedescendant': activeResult
              ? optionId(activeResult)
              : undefined,
            enterKeyHint: 'search',
            spellCheck: false,
            autoComplete: 'off',
          }}
          sx={{ fontSize: '1.05rem', py: 0.5 }}
        />
        {state.status === 'loading' && hasQuery && (
          <CircularProgress size={18} aria-hidden />
        )}
        <IconButton onClick={onClose} aria-label={t('close')} edge="end">
          <IconX size={20} />
        </IconButton>
      </Stack>

      <Box role="status" sx={visuallyHidden}>
        {status}
      </Box>

      <Box sx={{ overflowY: 'auto', flex: 1 }}>
        <Box
          component="ul"
          role="listbox"
          id={listId}
          aria-label={t('results')}
          sx={{ listStyle: 'none', m: 0, p: 1 }}
        >
          {results.map((result, index) => {
            const isActive = index === activeIndex;
            return (
              <Box
                component="li"
                key={result.id}
                id={optionId(result)}
                role="option"
                aria-selected={isActive}
                onPointerMove={() => {
                  if (!isActive) {
                    setActive({ query: deferredQuery, index });
                  }
                }}
              >
                <Box
                  component={Link}
                  href={result.href}
                  tabIndex={-1}
                  onClick={onClose}
                  sx={{
                    display: 'block',
                    px: 1.5,
                    py: 1,
                    borderRadius: 3,
                    color: 'text.primary',
                    textDecoration: 'none',
                    bgcolor: isActive ? 'action.selected' : 'transparent',
                  }}
                >
                  <Stack
                    direction="row"
                    sx={{ alignItems: 'center', gap: 1, flexWrap: 'wrap' }}
                  >
                    <Typography component="span" sx={{ fontWeight: 600 }}>
                      {result.page.title}
                    </Typography>
                    {result.page.kind === 'glossary' && (
                      <Chip
                        label={tLearn('glossary')}
                        size="small"
                        variant="outlined"
                      />
                    )}
                    {result.page.level && (
                      <Chip
                        label={tLearn('level', { level: result.page.level })}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Stack>
                  <Typography
                    variant="caption"
                    component="p"
                    sx={{ color: 'text.secondary' }}
                  >
                    {result.page.course}
                    {result.isHeadingMatch && ` › ${result.section.heading}`}
                  </Typography>
                  <Typography
                    variant="body2"
                    component="p"
                    sx={{
                      color: 'text.secondary',
                      mt: 0.25,
                      '& mark': {
                        bgcolor: 'transparent',
                        color: 'primary.main',
                        fontWeight: 700,
                      },
                    }}
                  >
                    {result.snippet.map((part) =>
                      part.match ? (
                        <mark key={part.start}>{part.text}</mark>
                      ) : (
                        <Fragment key={part.start}>{part.text}</Fragment>
                      )
                    )}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>

        {state.status === 'error' && (
          <Stack sx={{ p: 3, gap: 1, alignItems: 'flex-start' }}>
            <Typography sx={{ color: 'text.secondary' }}>
              {t('loadFailed')}
            </Typography>
            <Chip
              label={t('retry')}
              onClick={() => {
                setState({ status: 'loading' });
                setAttempt((current) => current + 1);
              }}
            />
          </Stack>
        )}
        {state.status === 'ready' && hasQuery && results.length === 0 && (
          <Typography sx={{ p: 3, color: 'text.secondary' }}>
            {t('noResults', { query: deferredQuery.trim() })}
          </Typography>
        )}
        {!hasQuery && state.status !== 'error' && (
          <Typography sx={{ p: 3, color: 'text.secondary' }}>
            {t('hint')}
          </Typography>
        )}
      </Box>

      <Typography
        variant="caption"
        aria-hidden
        sx={{
          display: { xs: 'none', sm: 'block' },
          px: 2,
          py: 1,
          borderTop: 1,
          borderColor: 'divider',
          color: 'text.secondary',
        }}
      >
        {t('keys')}
      </Typography>
    </Dialog>
  );
}
