'use client';

import { useEffect, useState } from 'react';

import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import {
  IconAlertCircleFilled,
  IconCircleCheckFilled,
  IconInfoCircleFilled,
} from '@tabler/icons-react';

import { DynamicIsland } from './dynamic-island';

import { readConsent } from '@/lib/consent';
import { type IslandNotice, onNotice } from '@/lib/island-notify';

const icons = {
  success: { Icon: IconCircleCheckFilled, color: '#4ade80' },
  error: { Icon: IconAlertCircleFilled, color: '#f87171' },
  info: { Icon: IconInfoCircleFilled, color: '#93c5fd' },
} as const;

/**
Time the island takes to shrink and hide before the next message, in ms.
*/
const closeDelay = 700;

/**
 * Shows the messages sent with `notify` in the Dynamic Island, one at a
 * time. While the cookie banner is asking for consent, which uses the same
 * island, messages wait.
 */
export function IslandNotifications() {
  const [queue, setQueue] = useState<IslandNotice[]>([]);
  const [current, setCurrent] = useState<IslandNotice | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(
    () =>
      onNotice((notice) => {
        setQueue((items) => [...items, notice]);
      }),
    []
  );

  // Takes the next message when the island is free.
  useEffect(() => {
    if (current || queue.length === 0) {
      return;
    }
    const timer = setInterval(
      () => {
        // The cookie banner owns the island until the visitor chooses.
        if (readConsent() === null) {
          return;
        }
        clearInterval(timer);
        const [next, ...rest] = queue;
        setQueue(rest);
        setCurrent(next ?? null);
        setIsOpen(true);
      },
      // Check at once, then every second while the banner is open.
      readConsent() === null ? 1000 : 0
    );
    return () => {
      clearInterval(timer);
    };
  }, [current, queue]);

  // Hides the message after its duration, then frees the island.
  useEffect(() => {
    if (!current || !isOpen) {
      return;
    }
    const duration = current.duration ?? (current.action ? 6000 : 4000);
    const timer = setTimeout(() => {
      setIsOpen(false);
    }, duration);
    return () => {
      clearTimeout(timer);
    };
  }, [current, isOpen]);

  useEffect(() => {
    if (!current || isOpen) {
      return;
    }
    const timer = setTimeout(() => {
      setCurrent(null);
    }, closeDelay);
    return () => {
      clearTimeout(timer);
    };
  }, [current, isOpen]);

  const { Icon, color } = icons[current?.severity ?? 'info'];

  return (
    <DynamicIsland open={isOpen} label={current?.message ?? ''}>
      {current && (
        <Stack
          direction="row"
          role="status"
          aria-live="polite"
          sx={{ alignItems: 'center', gap: 1.5, px: 2.5, py: 1.75 }}
        >
          <Icon size={22} color={color} aria-hidden />
          <Typography sx={{ flex: 1, fontWeight: 600, fontSize: 15 }}>
            {current.message}
          </Typography>
          {current.action && (
            <Button
              size="small"
              onClick={() => {
                current.action?.onClick();
                setIsOpen(false);
              }}
              sx={{
                color: '#050505',
                bgcolor: '#f5f5f5',
                fontWeight: 700,
                textTransform: 'none',
                px: 1.75,
                '&:hover': { bgcolor: '#fff' },
              }}
            >
              {current.action.label}
            </Button>
          )}
        </Stack>
      )}
    </DynamicIsland>
  );
}
