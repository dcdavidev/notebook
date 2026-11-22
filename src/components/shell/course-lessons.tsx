'use client';

import { type ReactNode, useEffect, useRef, useState } from 'react';

import { useTranslations } from 'next-intl';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import {
  IconChevronDown,
  IconCircleCheckFilled,
  IconSchool,
  IconVocabulary,
  IconX,
} from '@tabler/icons-react';

import { useAuth } from '@/components/auth/auth-context';
import { useProgress } from '@/components/progress/progress-context';
import { Link, usePathname } from '@/i18n/navigation';
import { accentFor } from '@/lib/accent';
import {
  coursePath,
  glossaryPath,
  latestEdition,
  parseLearnPath,
} from '@/lib/course-paths';
import type { CourseSummary } from '@/lib/courses';

const itemSx = {
  borderRadius: 2.5,
  gap: 1,
  py: 0.5,
  '&.Mui-selected': {
    bgcolor: 'color-mix(in oklch, var(--nb-text) 8%, transparent)',
  },
} as const;

type Area = 'course' | 'glossary';

/**
 * A collapsible group of the course panel: a header button and its links.
 */
function PanelSection({
  id,
  label,
  icon,
  count,
  isOpen,
  onToggle,
  children,
}: {
  id: string;
  label: string;
  icon: ReactNode;
  count: string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <Box component="li" sx={{ listStyle: 'none' }}>
      <ListItemButton
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={id}
        sx={{ borderRadius: 2.5, gap: 1, py: 0.75 }}
      >
        <Box
          component="span"
          aria-hidden
          sx={{ display: 'flex', color: 'text.secondary' }}
        >
          {icon}
        </Box>
        <ListItemText
          primary={label}
          secondary={count}
          slotProps={{
            primary: {
              sx: {
                fontSize: 13,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              },
            },
            secondary: { sx: { fontSize: 12 } },
          }}
        />
        <Box
          component="span"
          aria-hidden
          sx={{
            display: 'flex',
            color: 'text.secondary',
            transition: 'transform 150ms',
            transform: isOpen ? 'rotate(180deg)' : 'none',
          }}
        >
          <IconChevronDown size={16} />
        </Box>
      </ListItemButton>
      <Collapse in={isOpen} timeout="auto" unmountOnExit>
        <List id={id} dense disablePadding sx={{ pb: 1 }}>
          {children}
        </List>
      </Collapse>
    </Box>
  );
}

/**
 * The course panel: the title, the edition, how much the visitor
 * completed, and two groups, the course with its lessons and the glossary
 * with its index. The page being read is highlighted and scrolled into
 * view, and its group opens. It fills the course panel on desktop and the
 * lessons sheet on phones.
 */
export function CourseLessons({
  course,
  onNavigate,
  onClose,
}: {
  course: CourseSummary;
  /**
  Called after a page is chosen, for example to close the sheet.
  */
  onNavigate?: () => void;
  /**
  Shows a close button that calls it.
  */
  onClose?: () => void;
}) {
  const t = useTranslations('Shell');
  const tLearn = useTranslations('Learn');
  const tProgress = useTranslations('Progress');
  const { account } = useAuth();
  const progress = useProgress();
  const pathname = usePathname();
  const currentRef = useRef<HTMLAnchorElement>(null);
  // Groups the visitor opened or closed; the others follow the page.
  const [toggled, setToggled] = useState<Partial<Record<Area, boolean>>>({});

  // `/learn/<topic>/<edition>/<area>/<item>`: list the edition being read.
  // `latest` (the default) is the newest one, which comes first.
  const { edition: segment, area } = parseLearnPath(pathname);
  const pinned = course.editions.find((item) => item.name === segment);
  const edition = pinned ?? course.editions[0];
  const urlEdition = pinned ? pinned.name : latestEdition;
  const courseHome = coursePath(course.slug, urlEdition);
  const glossaryHome = glossaryPath(course.slug, urlEdition);
  const lessons = edition?.lessons ?? [];
  const entries = edition?.glossaryEntries ?? [];
  const completed = edition
    ? progress.completedIn(course.slug, edition.name)
    : new Set<string>();
  const done = lessons.filter((item) => completed.has(item.slug)).length;
  // Pad the lesson numbers to the widest one, at least 2 digits.
  const digits = Math.max(2, String(lessons.at(-1)?.step ?? 0).length);
  const accent = accentFor(course.slug);
  const activeArea: Area = area === 'glossary' ? 'glossary' : 'course';
  const isOpen = (name: Area) => toggled[name] ?? name === activeArea;
  const toggle = (name: Area) => {
    setToggled((current) => ({ ...current, [name]: !isOpen(name) }));
  };

  // Keep the page being read in view.
  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: 'nearest' });
  }, [pathname]);

  /**
   * One link of the panel, highlighted when it is the page being read.
   */
  const panelLink = (href: string, key: string, content: ReactNode) => {
    const isCurrent = pathname === href;
    return (
      <ListItemButton
        key={key}
        component={Link}
        href={href}
        onClick={onNavigate}
        selected={isCurrent}
        aria-current={isCurrent ? 'page' : undefined}
        ref={isCurrent ? currentRef : undefined}
        sx={itemSx}
      >
        {content}
      </ListItemButton>
    );
  };

  const homeText = (label: string) => (
    <ListItemText
      primary={label}
      slotProps={{
        primary: {
          sx: { fontSize: 14, fontWeight: 600, pl: `${digits * 11 + 8}px` },
        },
      }}
    />
  );

  return (
    <Stack sx={{ minHeight: 0, flex: 1 }}>
      <Stack
        sx={{
          px: 2,
          pt: 2,
          pb: 1.5,
          gap: 1,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
          <Box
            aria-hidden
            sx={{
              width: 36,
              height: 36,
              flexShrink: 0,
              borderRadius: '10px',
              background: `linear-gradient(135deg, ${accent}, color-mix(in oklch, ${accent}, black 35%))`,
            }}
          />
          <Stack sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              component={Link}
              href={`/learn/${course.slug}`}
              onClick={onNavigate}
              noWrap
              sx={{
                fontWeight: 800,
                fontSize: '1.1rem',
                color: 'text.primary',
                textDecoration: 'none',
              }}
            >
              {course.title}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {tLearn('lessonCount', { count: lessons.length })}
            </Typography>
          </Stack>
          {edition && (
            <Chip label={edition.label} size="small" variant="outlined" />
          )}
          {onClose && (
            <Tooltip title={t('hideLessons', { course: course.title })}>
              <IconButton
                size="small"
                onClick={onClose}
                aria-label={t('hideLessons', { course: course.title })}
              >
                <IconX size={18} />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
        {account && done > 0 && (
          <Stack sx={{ gap: 0.5 }}>
            <LinearProgress
              variant="determinate"
              value={lessons.length === 0 ? 0 : (done / lessons.length) * 100}
              aria-label={tProgress('summary', {
                done,
                total: lessons.length,
              })}
              sx={{
                height: 4,
                borderRadius: 2,
                '& .MuiLinearProgress-bar': { bgcolor: accent },
              }}
            />
            <Typography variant="caption" color="text.secondary">
              {tProgress('summary', { done, total: lessons.length })}
            </Typography>
          </Stack>
        )}
      </Stack>

      <List
        dense
        aria-label={t('course')}
        sx={{ flex: 1, minHeight: 0, overflowY: 'auto', px: 1, py: 1 }}
      >
        <PanelSection
          id="course-panel-lessons"
          label={t('course')}
          icon={<IconSchool size={18} />}
          count={tLearn('lessonCount', { count: lessons.length })}
          isOpen={isOpen('course')}
          onToggle={() => toggle('course')}
        >
          {panelLink(courseHome, 'overview', homeText(tLearn('overview')))}
          {lessons.map((lesson) => {
            const href = coursePath(course.slug, urlEdition, lesson.slug);
            return panelLink(
              href,
              lesson.slug,
              <>
                <Typography
                  component="span"
                  variant="caption"
                  sx={{
                    minWidth: digits * 11,
                    display: 'flex',
                    color: 'text.secondary',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {completed.has(lesson.slug) ? (
                    <Box
                      component="span"
                      role="img"
                      aria-label={tProgress('completedLesson')}
                      sx={{ display: 'flex', color: 'success.main' }}
                    >
                      <IconCircleCheckFilled size={16} />
                    </Box>
                  ) : (
                    String(lesson.step).padStart(digits, '0')
                  )}
                </Typography>
                <ListItemText
                  primary={lesson.title}
                  slotProps={{
                    primary: {
                      sx: {
                        fontSize: 14,
                        fontWeight: pathname === href ? 700 : 400,
                      },
                    },
                  }}
                />
              </>
            );
          })}
        </PanelSection>

        {edition?.hasGlossary && (
          <PanelSection
            id="course-panel-glossary"
            label={tLearn('glossary')}
            icon={<IconVocabulary size={18} />}
            count={tLearn('glossaryEntryCount', { count: entries.length })}
            isOpen={isOpen('glossary')}
            onToggle={() => toggle('glossary')}
          >
            {panelLink(
              glossaryHome,
              'glossary-index',
              homeText(tLearn('glossaryIndex'))
            )}
            {entries.map((entry) => {
              const href = glossaryPath(course.slug, urlEdition, entry.slug);
              return panelLink(
                href,
                entry.slug,
                <ListItemText
                  primary={entry.title.replaceAll('`', '')}
                  slotProps={{
                    primary: {
                      sx: {
                        fontSize: 14,
                        fontWeight: pathname === href ? 700 : 400,
                        pl: `${digits * 11 + 8}px`,
                      },
                    },
                  }}
                />
              );
            })}
          </PanelSection>
        )}
      </List>
    </Stack>
  );
}
