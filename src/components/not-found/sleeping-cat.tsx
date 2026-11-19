'use client';

import { DotLottieReact, setWasmUrl } from '@lottiefiles/dotlottie-react';
import Box from '@mui/material/Box';

import { useReducedMotion } from 'motion/react';

// Serve the player engine from this site instead of a public CDN.
// `scripts/copy-lottie-wasm.mjs` copies it into `public/wasm` on install.
setWasmUrl('/wasm/dotlottie-player.wasm');

/**
 * Lottie animation of a pink cat asleep on a laptop that shows "404".
 * With reduced motion, it shows the first frame without playing.
 */
export function SleepingCat() {
  const reducedMotion = useReducedMotion();

  return (
    <Box
      aria-hidden="true"
      sx={{
        width: 'clamp(260px, 60vw, 480px)',
        aspectRatio: '723 / 442',
      }}
    >
      <DotLottieReact
        src="/animations/404-cat.lottie"
        loop
        autoplay={!reducedMotion}
        style={{ width: '100%', height: '100%' }}
      />
    </Box>
  );
}
