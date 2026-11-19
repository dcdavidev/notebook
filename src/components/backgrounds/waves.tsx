'use client';

import { useEffect, useRef } from 'react';

import Box, { type BoxProps } from '@mui/material/Box';

import { perlin3 } from './perlin-noise';

export interface WavesProps extends Omit<BoxProps, 'children'> {
  /**
  Space between the lines, in px.
  */
  spacing?: number;
  /**
  Width of the lines, in px.
  */
  lineWidth?: number;
  /**
  How far the lines sway, in px.
  */
  amplitude?: number;
  /**
  Size of the wave pattern. Higher values make broader, calmer waves.
  */
  scale?: number;
  /**
  How much the waves twist the lines into folds.
  */
  twist?: number;
  /**
  How fast the waves flow. 0 holds them still.
  */
  speed?: number;
  /**
  Radius around the cursor that drags the lines, in px.
  */
  mouseRadius?: number;
  /**
  How hard a moving cursor drags the lines.
  */
  mouseStrength?: number;
  /**
  How much the lines overshoot as they settle, from 0 to 1.
  */
  bounce?: number;
  /**
  Roughly how long the lines take to settle back, in seconds.
  */
  returnDuration?: number;
  /**
  Clicking parts the lines in a soft ripple.
  */
  clickRipple?: boolean;
  /**
  Opens the lines from the center and swells the waves in on mount.
  */
  intro?: boolean;
  /**
  Fades the edges into the page, from 0 to 1.
  */
  fade?: number;
  /**
  Opacity of the lines.
  */
  lineOpacity?: number;
}

/**
Vertical distance between the points of a line, in px.
*/
const step = 8;
const introDuration = 1.6;
const rippleSpeed = 900;
const rippleWidth = 60;
const rippleLife = 1.2;
const listenerOptions: AddEventListenerOptions = { passive: true };

interface Ripple {
  x: number;
  y: number;
  start: number;
}

function easeOutCubic(t: number): number {
  return 1 - (1 - Math.min(Math.max(t, 0), 1)) ** 3;
}

function readColor(name: string, fallback: string): string {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return value || fallback;
}

/**
 * Background of dense vertical lines that sway like silk, bend around the
 * cursor and spring back into place. The lines use the text color of the
 * active palette, and the parts pushed by the cursor use the primary color.
 *
 * Inspired by the "Waves" background of React Bits, rewritten with canvas.
 */
export function Waves({
  spacing = 10,
  lineWidth = 1,
  amplitude = 32,
  scale = 1,
  twist = 1,
  speed = 1,
  mouseRadius = 175,
  mouseStrength = 1,
  bounce = 0.5,
  returnDuration = 1.4,
  clickRipple = true,
  intro = true,
  fade = 0,
  lineOpacity = 0.35,
  sx,
  ...boxProps
}: WavesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!container || !canvas || !context) {
      return;
    }

    const isReducedMotion = matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    let width = 0;
    let height = 0;
    let columns = 0;
    let rows = 0;
    let offsets = new Float32Array(0);
    let velocities = new Float32Array(0);

    let lineColor = '#888';
    let accentColor = '#888';
    const updateColors = () => {
      lineColor = readColor('--nb-text', lineColor);
      accentColor = readColor('--nb-primary', accentColor);
    };
    updateColors();

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(globalThis.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      columns = Math.ceil(width / spacing) + 1;
      rows = Math.ceil(height / step) + 1;
      offsets = new Float32Array(columns * rows);
      velocities = new Float32Array(columns * rows);
    };
    resize();

    const pointer = { x: -9999, y: -9999, vx: 0, vy: 0, inside: false };
    const ripples: Ripple[] = [];
    const startTime = performance.now();
    let lastTime = startTime;
    let frame = 0;

    // Spring that settles in about `returnDuration` seconds.
    const omega = 4 / Math.max(returnDuration, 0.1);
    const stiffness = omega * omega;
    const damping = 2 * (1 - Math.min(Math.max(bounce, 0), 1) * 0.85) * omega;
    const noiseScale = 0.0022 / Math.max(scale, 0.05);

    const draw = (now: number) => {
      const elapsed = (now - startTime) / 1000;
      // Clamp the step: timestamps can repeat or go back slightly between frames.
      const dt = Math.min(Math.max((now - lastTime) / 1000, 0), 1 / 30);
      lastTime = now;
      const introProgress =
        intro && !isReducedMotion ? easeOutCubic(elapsed / introDuration) : 1;
      const time = isReducedMotion ? 0 : elapsed * 0.12 * speed;
      const swell = amplitude * (0.25 + 0.75 * introProgress);
      const centerX = width / 2;
      const visibleHalfWidth = (width / 2 + spacing) * introProgress;

      // Cursor drag and click ripples act on the velocities.
      if (!isReducedMotion) {
        const radiusSquared = mouseRadius * mouseRadius;
        const pointerSpeed = Math.hypot(pointer.vx, pointer.vy);
        for (let column = 0; column < columns; column++) {
          const baseX = column * spacing;
          for (let row = 0; row < rows; row++) {
            const index = column * rows + row;
            const y = row * step;
            let force = 0;

            if (pointer.inside && pointerSpeed > 0) {
              const dx = baseX - pointer.x;
              const dy = y - pointer.y;
              const distanceSquared = dx * dx + dy * dy;
              if (distanceSquared < radiusSquared) {
                const falloff = 1 - Math.sqrt(distanceSquared) / mouseRadius;
                force += pointer.vx * mouseStrength * falloff * falloff * 2.5;
              }
            }

            for (const ripple of ripples) {
              const age = (now - ripple.start) / 1000;
              const ring = age * rippleSpeed;
              const dx = baseX - ripple.x;
              const distance = Math.hypot(dx, y - ripple.y);
              const gap = Math.abs(distance - ring);
              if (distance === 0 || gap >= rippleWidth) {
                continue;
              }
              // Push the lines away from the click, fading as the ring grows.
              const strength =
                (1 - gap / rippleWidth) * (1 - age / rippleLife) * 2000;
              force += (dx / distance) * strength;
            }

            const offset = offsets[index] ?? 0;
            let velocity = velocities[index] ?? 0;
            velocity += (force - stiffness * offset - damping * velocity) * dt;
            velocities[index] = velocity;
            offsets[index] = offset + velocity * dt;
          }
        }
      }
      pointer.vx *= 0.85;
      pointer.vy *= 0.85;
      for (let index = ripples.length - 1; index >= 0; index--) {
        const ripple = ripples[index];
        if (ripple && (now - ripple.start) / 1000 > rippleLife) {
          ripples.splice(index, 1);
        }
      }

      context.clearRect(0, 0, width, height);
      context.lineWidth = lineWidth;
      context.lineJoin = 'round';

      // Accent strokes are grouped by intensity to keep the draw calls low.
      const accentLevels = 4;
      const accentPaths = Array.from(
        { length: accentLevels },
        () => new Path2D()
      );
      const basePath = new Path2D();

      for (let column = 0; column < columns; column++) {
        const baseX = column * spacing;
        if (Math.abs(baseX - centerX) > visibleHalfWidth) {
          continue;
        }
        let previousX = 0;
        let previousY = 0;
        for (let row = 0; row < rows; row++) {
          const y = row * step;
          const wave =
            perlin3(baseX * noiseScale, y * noiseScale, time) +
            twist *
              0.45 *
              perlin3(
                baseX * noiseScale * 3.1 + 17,
                y * noiseScale * 1.4,
                time * 1.3
              );
          const offset = offsets[column * rows + row] ?? 0;
          const x = baseX + wave * swell + offset;

          if (row === 0) {
            basePath.moveTo(x, y);
          } else {
            basePath.lineTo(x, y);
            const intensity = Math.min(Math.abs(offset) / 24, 1);
            if (intensity > 0.08) {
              const level = Math.min(
                Math.floor(intensity * accentLevels),
                accentLevels - 1
              );
              accentPaths[level]?.moveTo(previousX, previousY);
              accentPaths[level]?.lineTo(x, y);
            }
          }
          previousX = x;
          previousY = y;
        }
      }

      context.globalAlpha = lineOpacity * Math.min(introProgress * 1.5, 1);
      context.strokeStyle = lineColor;
      context.stroke(basePath);

      context.strokeStyle = accentColor;
      context.lineWidth = lineWidth * 1.4;
      for (const [level, path] of accentPaths.entries()) {
        context.globalAlpha = (level + 1) / accentLevels;
        context.stroke(path);
      }
      context.globalAlpha = 1;

      if (!isReducedMotion) {
        frame = requestAnimationFrame(draw);
      }
    };

    const toLocal = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    };

    const onPointerMove = (event: PointerEvent) => {
      const { x, y } = toLocal(event);
      if (pointer.inside) {
        pointer.vx = pointer.vx * 0.5 + (x - pointer.x) * 30;
        pointer.vy = pointer.vy * 0.5 + (y - pointer.y) * 30;
      }
      pointer.x = x;
      pointer.y = y;
      pointer.inside = x >= 0 && y >= 0 && x <= width && y <= height;
    };
    const onPointerLeave = () => {
      pointer.inside = false;
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!clickRipple) {
        return;
      }
      const { x, y } = toLocal(event);
      if (x >= 0 && y >= 0 && x <= width && y <= height) {
        ripples.push({ x, y, start: performance.now() });
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      resize();
      if (isReducedMotion) {
        draw(performance.now());
      }
    });
    resizeObserver.observe(container);

    // Redraw with the new colors when the palette or the mode changes.
    const themeObserver = new MutationObserver(() => {
      updateColors();
      if (isReducedMotion) {
        draw(performance.now());
      }
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-palette'],
    });

    document.addEventListener('pointermove', onPointerMove, listenerOptions);
    document.addEventListener('pointerdown', onPointerDown, listenerOptions);
    document.documentElement.addEventListener('pointerleave', onPointerLeave);

    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      themeObserver.disconnect();
      document.removeEventListener(
        'pointermove',
        onPointerMove,
        listenerOptions
      );
      document.removeEventListener(
        'pointerdown',
        onPointerDown,
        listenerOptions
      );
      document.documentElement.removeEventListener(
        'pointerleave',
        onPointerLeave
      );
    };
  }, [
    spacing,
    lineWidth,
    amplitude,
    scale,
    twist,
    speed,
    mouseRadius,
    mouseStrength,
    bounce,
    returnDuration,
    clickRipple,
    intro,
    lineOpacity,
  ]);

  const fadeAmount = Math.min(Math.max(fade, 0), 1);
  const mask =
    fadeAmount > 0
      ? `radial-gradient(ellipse at center, #000 ${Math.round((1 - fadeAmount) * 70)}%, transparent 100%)`
      : undefined;

  return (
    <Box
      ref={containerRef}
      aria-hidden="true"
      sx={[
        {
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          pointerEvents: 'none',
          maskImage: mask,
          WebkitMaskImage: mask,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...boxProps}
    >
      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', height: '100%' }}
      />
    </Box>
  );
}
