/**
 * Classic 3D Perlin noise (Ken Perlin, 2002), with a fixed permutation so
 * the pattern is the same on every visit. Returns values in about [-1, 1].
 */

/**
 * Builds the doubled permutation table with a deterministic shuffle
 * (mulberry32), so the waves look the same on every load.
 */
function createPermutation(): Uint8Array {
  let seed = 0x9e_37_79_b9;
  const random = () => {
    seed = Math.trunc(seed + 0x6d_2b_79_f5);
    let value = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };

  const values = Array.from({ length: 256 }, (_, index) => index);
  for (let index = values.length - 1; index > 0; index--) {
    const swap = Math.floor(random() * (index + 1));
    const current = values[index] ?? 0;
    values[index] = values[swap] ?? 0;
    values[swap] = current;
  }

  const table = new Uint8Array(512);
  for (let index = 0; index < 512; index++) {
    table[index] = values[index & 255] ?? 0;
  }
  return table;
}

const p = createPermutation();

/**
 * Smoothstep curve used to blend the corners of each cell.
 */
function fade(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

/**
 * Linear interpolation between `a` and `b`.
 */
function lerp(t: number, a: number, b: number): number {
  return a + t * (b - a);
}

/**
 * Dot product between a pseudo-random gradient and the distance vector.
 */
function grad(hash: number, x: number, y: number, z: number): number {
  const h = hash & 15;
  const u = h < 8 ? x : y;
  const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
  return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
}

/**
 * Samples the noise field at a point in 3D space.
 */
export function perlin3(x: number, y: number, z: number): number {
  const xi = Math.floor(x) & 255;
  const yi = Math.floor(y) & 255;
  const zi = Math.floor(z) & 255;
  const xf = x - Math.floor(x);
  const yf = y - Math.floor(y);
  const zf = z - Math.floor(z);
  const u = fade(xf);
  const v = fade(yf);
  const w = fade(zf);

  const a = (p[xi] ?? 0) + yi;
  const aa = (p[a] ?? 0) + zi;
  const ab = (p[a + 1] ?? 0) + zi;
  const b = (p[xi + 1] ?? 0) + yi;
  const ba = (p[b] ?? 0) + zi;
  const bb = (p[b + 1] ?? 0) + zi;

  // Gradients at the eight corners of the cell.
  const g000 = grad(p[aa] ?? 0, xf, yf, zf);
  const g100 = grad(p[ba] ?? 0, xf - 1, yf, zf);
  const g010 = grad(p[ab] ?? 0, xf, yf - 1, zf);
  const g110 = grad(p[bb] ?? 0, xf - 1, yf - 1, zf);
  const g001 = grad(p[aa + 1] ?? 0, xf, yf, zf - 1);
  const g101 = grad(p[ba + 1] ?? 0, xf - 1, yf, zf - 1);
  const g011 = grad(p[ab + 1] ?? 0, xf, yf - 1, zf - 1);
  const g111 = grad(p[bb + 1] ?? 0, xf - 1, yf - 1, zf - 1);

  const front = lerp(v, lerp(u, g000, g100), lerp(u, g010, g110));
  const back = lerp(v, lerp(u, g001, g101), lerp(u, g011, g111));
  return lerp(w, front, back);
}
