'use client';

import { useEffect, useState } from 'react';

import { useTranslations } from 'next-intl';

import LinearProgress from '@mui/material/LinearProgress';

import { getMainScroller, readScrollProgress } from '@/lib/main-scroll';

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
    // Desktop scrolls the `main` panel, phones scroll the window.
    const scroller = getMainScroller();
    scroller?.addEventListener('scroll', update, { passive: true });
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    // The content can grow after the first paint (fonts, highlighted code).
    const observer = new ResizeObserver(update);
    observer.observe(document.body);
    if (scroller?.firstElementChild) {
      observer.observe(scroller.firstElementChild);
    }
    return () => {
      scroller?.removeEventListener('scroll', update);
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
