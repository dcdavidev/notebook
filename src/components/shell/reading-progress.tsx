'use client';

import { useEffect, useState } from 'react';

import { useTranslations } from 'next-intl';

import LinearProgress from '@mui/material/LinearProgress';

/**
 * How far the page has been scrolled, from 0 to 100.
 */
function readScrollProgress(): number {
  const { scrollHeight, clientHeight } = document.documentElement;
  const scrollable = scrollHeight - clientHeight;
  return scrollable <= 0
    ? 100
    : Math.min(100, Math.max(0, (window.scrollY / scrollable) * 100));
}

/**
 * Determinate progress bar that follows the reading: it fills up as the page
 * scrolls and reaches the end with the end of the page. `resetKey` restarts
 * it when the page changes.
 */
export function ReadingProgress({ resetKey }: { resetKey: string }) {
  const t = useTranslations('Shell');
  const [value, setValue] = useState(0);

  useEffect(() => {
    // Browsers fire `scroll` at most once per frame, so no extra throttling.
    const update = () => {
      setValue(readScrollProgress());
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    // The content can grow after the first paint (fonts, highlighted code).
    const observer = new ResizeObserver(update);
    observer.observe(document.body);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      observer.disconnect();
    };
  }, [resetKey]);

  return (
    <LinearProgress
      variant="determinate"
      value={value}
      aria-label={t('readingProgress')}
      sx={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: -1,
        height: 3,
        bgcolor: 'transparent',
        '& .MuiLinearProgress-bar': { transition: 'transform 80ms linear' },
      }}
    />
  );
}
