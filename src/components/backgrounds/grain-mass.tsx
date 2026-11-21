'use client';

// cspell:words highp fract

import { useEffect, useRef } from 'react';

import Box, { type BoxProps } from '@mui/material/Box';

export interface GrainMassProps extends Omit<BoxProps, 'children'> {
  /**
  How fast the mass churns. 0 holds it still.
  */
  speed?: number;
  /**
  Size of the mass, from 0 to 1 of the shorter side.
  */
  size?: number;
  /**
  How much the mass folds into itself.
  */
  turbulence?: number;
  /**
  Strength of the film grain, from 0 to 1.
  */
  grain?: number;
  /**
  How far the mass leans toward the cursor, from 0 to 1.
  */
  mouseInfluence?: number;
  /**
  Opacity of the mass.
  */
  opacity?: number;
}

const vertexSource = `
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragmentSource = `
precision highp float;

uniform vec2 resolution;
uniform float time;
uniform vec2 pointer;
uniform float size;
uniform float turbulence;
uniform float grain;
uniform float opacity;
uniform vec3 colorPrimary;
uniform vec3 colorText;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 5; i++) {
    value += amplitude * noise(p);
    p = p * 2.03 + vec2(1.7, 9.2);
    amplitude *= 0.5;
  }
  return value;
}

void main() {
  vec2 fragment = gl_FragCoord.xy;
  float shortSide = min(resolution.x, resolution.y);
  vec2 uv = (fragment - 0.5 * resolution) / shortSide;
  vec2 lean = (pointer - 0.5 * resolution) / shortSide;

  // Domain-warped noise gives the mass its slow, folding churn.
  vec2 q = uv * 1.6;
  vec2 warp = vec2(
    fbm(q + vec2(0.0, time * 0.6)),
    fbm(q + vec2(5.2, 1.3) - time * 0.5)
  );
  vec2 warp2 = vec2(
    fbm(q + 3.0 * warp + vec2(1.7, 9.2) + time * 0.3),
    fbm(q + 3.0 * warp + vec2(8.3, 2.8) - time * 0.35)
  );
  float field = fbm(q + turbulence * 2.5 * warp2);

  // A soft blob centered on the hero, pulled toward the cursor and
  // eaten into by the noise at its edges.
  vec2 center = lean * 0.18;
  float distance = length((uv - center) * vec2(0.85, 1.0));
  float edge = size * (0.75 + 0.5 * field);
  float mass = 1.0 - smoothstep(edge * 0.35, edge, distance);
  mass *= 0.55 + 0.75 * field;
  mass = clamp(mass, 0.0, 1.0);

  // Shade the mass from a deep core to a bright, tinted rim.
  vec3 deep = mix(colorPrimary, colorText, 0.35);
  vec3 bright = mix(colorPrimary, vec3(1.0), 0.35);
  vec3 tint = mix(deep, bright, smoothstep(0.25, 0.85, warp2.x));
  tint = mix(tint, colorPrimary, smoothstep(0.4, 0.9, field));

  // Grain: dense per-pixel noise that flickers each frame and is
  // strongest where the mass thins out, so the edges dissolve into dust.
  float flicker = floor(time * 240.0);
  float speck = hash(fragment + flicker * vec2(13.1, 7.7));
  float dissolve = smoothstep(speck * 0.9, speck * 0.9 + 0.35, mass);
  float alpha = mix(mass, dissolve * mass, grain) * opacity;
  vec3 color = tint + (speck - 0.5) * 0.22 * grain;

  gl_FragColor = vec4(color * alpha, alpha);
}
`;

function compile(
  gl: WebGLRenderingContext,
  type: number,
  source: string
): WebGLShader | undefined {
  const shader = gl.createShader(type);
  if (!shader) {
    return undefined;
  }
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return undefined;
  }
  return shader;
}

/**
 * Converts any CSS color (hex, rgb, oklch, ...) to normalized RGB by
 * painting it on a 1x1 canvas.
 */
function readColor(
  name: string,
  fallback: [number, number, number]
): [number, number, number] {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  if (!value) {
    return fallback;
  }
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) {
    return fallback;
  }
  context.fillStyle = value;
  context.fillRect(0, 0, 1, 1);
  const [r = 0, g = 0, b = 0] = context.getImageData(0, 0, 1, 1).data;
  return [r / 255, g / 255, b / 255];
}

/**
 * A churning, grainy mass of color that dissolves into film grain at its
 * edges and leans toward the cursor. It takes the primary and text
 * colors of the active palette.
 *
 * Inspired by the "Grain Mass" background of React Bits Pro, written from
 * scratch with WebGL.
 */
export function GrainMass({
  speed = 1,
  size = 0.6,
  turbulence = 1,
  grain = 0.7,
  mouseInfluence = 1,
  opacity = 0.9,
  sx,
  ...boxProps
}: GrainMassProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const gl = canvas?.getContext('webgl', {
      premultipliedAlpha: true,
      antialias: false,
    });
    if (!container || !canvas || !gl) {
      return;
    }

    const vertex = compile(gl, gl.VERTEX_SHADER, vertexSource);
    const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentSource);
    const program = gl.createProgram();
    if (!vertex || !fragment || !program) {
      return;
    }
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      return;
    }
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW
    );
    const position = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const uniform = (name: string) => gl.getUniformLocation(program, name);
    const uniforms = {
      resolution: uniform('resolution'),
      time: uniform('time'),
      pointer: uniform('pointer'),
      size: uniform('size'),
      turbulence: uniform('turbulence'),
      grain: uniform('grain'),
      opacity: uniform('opacity'),
      colorPrimary: uniform('colorPrimary'),
      colorText: uniform('colorText'),
    };

    gl.uniform1f(uniforms.size, size);
    gl.uniform1f(uniforms.turbulence, turbulence);
    gl.uniform1f(uniforms.grain, Math.min(Math.max(grain, 0), 1));
    gl.uniform1f(uniforms.opacity, opacity);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    const updateColors = () => {
      gl.uniform3fv(
        uniforms.colorPrimary,
        readColor('--nb-primary', [0.3, 0.4, 0.9])
      );
      gl.uniform3fv(
        uniforms.colorText,
        readColor('--nb-text', [0.1, 0.1, 0.1])
      );
    };
    updateColors();

    const isReducedMotion = matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    let width = 0;
    let height = 0;
    let dpr = 1;
    const resize = () => {
      const rect = container.getBoundingClientRect();
      // The grain is per pixel, so cap the density to keep it visible.
      dpr = Math.min(globalThis.devicePixelRatio || 1, 1.5);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.max(Math.round(width * dpr), 1);
      canvas.height = Math.max(Math.round(height * dpr), 1);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
    };
    resize();

    // The pointer eases toward its target so the mass drifts, not jumps.
    const target = { x: 0.5, y: 0.5 };
    const eased = { x: 0.5, y: 0.5 };
    const startTime = performance.now();
    let frame = 0;
    let isVisible = true;

    const draw = (now: number) => {
      const elapsed = (now - startTime) / 1000;
      eased.x += (target.x - eased.x) * 0.04;
      eased.y += (target.y - eased.y) * 0.04;
      gl.uniform1f(uniforms.time, isReducedMotion ? 4 : elapsed * 0.12 * speed);
      gl.uniform2f(
        uniforms.pointer,
        (0.5 + (eased.x - 0.5) * mouseInfluence) * canvas.width,
        (0.5 + (0.5 - eased.y) * mouseInfluence) * canvas.height
      );
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (!isReducedMotion && isVisible) {
        frame = requestAnimationFrame(draw);
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        return;
      }
      target.x = (event.clientX - rect.left) / rect.width;
      target.y = (event.clientY - rect.top) / rect.height;
    };

    const resizeObserver = new ResizeObserver(() => {
      resize();
      if (isReducedMotion) {
        draw(performance.now());
      }
    });
    resizeObserver.observe(container);

    // Pause the animation while the hero is scrolled out of view.
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      const wasVisible = isVisible;
      isVisible = entry?.isIntersecting ?? true;
      if (isVisible && !wasVisible && !isReducedMotion) {
        frame = requestAnimationFrame(draw);
      }
    });
    visibilityObserver.observe(container);

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

    document.addEventListener('pointermove', onPointerMove, { passive: true });
    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      themeObserver.disconnect();
      document.removeEventListener('pointermove', onPointerMove);
      gl.deleteProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
      gl.deleteBuffer(buffer);
    };
  }, [speed, size, turbulence, grain, mouseInfluence, opacity]);

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
