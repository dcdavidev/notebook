'use client';

import { type ReactNode, useEffect, useState } from 'react';

import Backdrop from '@mui/material/Backdrop';
import Box from '@mui/material/Box';
import FocusTrap from '@mui/material/Unstable_TrapFocus';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

/**
Size of the island when it is a small pill, in px.
*/
const pill = { width: 126, height: 36 };
/**
Largest width of the expanded island, in px.
*/
const maxExpandedWidth = 580;
/**
Space kept on each side of the island on small screens, in px.
*/
const sideGap = 12;

type Phase = 'hidden' | 'pill' | 'expanded';

const spring = {
  type: 'spring',
  stiffness: 380,
  damping: 32,
  mass: 0.9,
} as const;

interface DynamicIslandProps {
  /**
  Shows the island and expands it around the content.
  */
  open: boolean;
  /**
  Accessible name of the notification.
  */
  label: string;
  /**
   * Dims the page behind the island and keeps the focus inside it, so the
   * visitor must answer before using the page.
   */
  modal?: boolean;
  children: ReactNode;
}

/**
 * Notification area at the top center of the page, styled like the
 * iPhone Dynamic Island: a black pill that appears, grows into a card
 * around its content, and shrinks back into a pill before it disappears.
 */
export function DynamicIsland({
  open,
  label,
  modal = false,
  children,
}: DynamicIslandProps) {
  const reducedMotion = useReducedMotion();
  const [phase, setPhase] = useState<Phase>('hidden');
  const [expandedWidth, setExpandedWidth] = useState(maxExpandedWidth);

  // Opening: pill first, then card. Closing: pill first, then hidden.
  useEffect(() => {
    const stepDelay = reducedMotion ? 0 : 380;
    const toPill = setTimeout(() => {
      setPhase((current) =>
        current === 'hidden' && !open ? 'hidden' : 'pill'
      );
    }, 0);
    const toFinal = setTimeout(() => {
      setPhase(open ? 'expanded' : 'hidden');
    }, stepDelay);
    return () => {
      clearTimeout(toPill);
      clearTimeout(toFinal);
    };
  }, [open, reducedMotion]);

  // Keep the expanded island inside the viewport.
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      const viewportWidth = entry?.contentRect.width ?? maxExpandedWidth;
      setExpandedWidth(Math.min(maxExpandedWidth, viewportWidth - sideGap * 2));
    });
    observer.observe(document.documentElement);
    return () => {
      observer.disconnect();
    };
  }, []);

  const isExpanded = phase === 'expanded';
  const isBlocking = modal && open;

  return (
    <>
      <Backdrop
        open={isBlocking}
        sx={{ zIndex: 'modal', backdropFilter: 'blur(4px)' }}
      />
      <Box
        sx={{
          position: 'fixed',
          top: sideGap,
          left: 0,
          right: 0,
          zIndex: 'snackbar',
          display: 'flex',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <AnimatePresence>
          {phase !== 'hidden' && (
            <FocusTrap open={isBlocking && isExpanded}>
              <motion.section
                key="island"
                aria-label={label}
                role={isBlocking ? 'dialog' : 'region'}
                aria-modal={isBlocking || undefined}
                tabIndex={-1}
                initial={{ opacity: 0, scale: 0.6, ...pill, borderRadius: 18 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  width: isExpanded ? expandedWidth : pill.width,
                  height: isExpanded ? 'auto' : pill.height,
                  borderRadius: isExpanded ? 28 : 18,
                }}
                exit={{ opacity: 0, scale: 0.6, transition: { duration: 0.2 } }}
                transition={reducedMotion ? { duration: 0 } : spring}
                style={{
                  overflow: 'hidden',
                  pointerEvents: 'auto',
                  outline: 'none',
                  background: '#050505',
                  color: '#f5f5f5',
                  boxShadow:
                    '0 12px 40px -8px rgb(0 0 0 / 0.55), inset 0 0 0 1px rgb(255 255 255 / 0.08)',
                }}
              >
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      key="content"
                      initial={{ opacity: 0, filter: 'blur(6px)', y: -6 }}
                      animate={{
                        opacity: 1,
                        filter: 'blur(0px)',
                        y: 0,
                        transition: {
                          delay: reducedMotion ? 0 : 0.15,
                          duration: 0.3,
                        },
                      }}
                      exit={{
                        opacity: 0,
                        filter: 'blur(6px)',
                        transition: { duration: 0.15 },
                      }}
                    >
                      {children}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.section>
            </FocusTrap>
          )}
        </AnimatePresence>
      </Box>
    </>
  );
}
