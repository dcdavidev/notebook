'use client';

import Typography from '@mui/material/Typography';

import { motion, useReducedMotion } from 'motion/react';

const MotionTypography = motion.create(Typography);

/**
 * Site title that appears as if written by hand: the text is revealed from
 * left to right while it sharpens and rises into place.
 */
export function AnimatedTitle({ children }: { children: string }) {
  const reducedMotion = useReducedMotion();

  return (
    <MotionTypography
      variant="h1"
      initial={
        reducedMotion
          ? { opacity: 0 }
          : {
              opacity: 0,
              y: 24,
              filter: 'blur(12px)',
              clipPath: 'inset(-20% 100% -20% 0)',
            }
      }
      animate={{
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        clipPath: 'inset(-20% -5% -20% 0)',
      }}
      transition={{
        duration: reducedMotion ? 0.3 : 1.4,
        ease: [0.22, 1, 0.36, 1],
      }}
      sx={{
        fontFamily: 'var(--nb-font-title)',
        fontSize: 'clamp(4.5rem, 16vw, 11rem)',
        lineHeight: 1.1,
        color: 'primary.main',
        px: '0.15em',
      }}
    >
      {children}
    </MotionTypography>
  );
}
