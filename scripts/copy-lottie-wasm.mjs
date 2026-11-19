/**
 * Copies the WebAssembly engine of the dotLottie player into `public/`, so
 * the site serves it itself instead of loading it from a public CDN.
 * It runs after every install, so the file always matches the installed
 * version of the player.
 */
import { copyFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
// `dotlottie-web` is a dependency of `dotlottie-react`: resolve it from there.
const reactPlayer = require.resolve('@lottiefiles/dotlottie-react');
const webPlayer = createRequire(reactPlayer).resolve(
  '@lottiefiles/dotlottie-web'
);
const source = path.join(path.dirname(webPlayer), 'dotlottie-player.wasm');
const target = path.join(
  process.cwd(),
  'public',
  'wasm',
  'dotlottie-player.wasm'
);

mkdirSync(path.dirname(target), { recursive: true });
copyFileSync(source, target);
console.log(`Copied ${path.relative(process.cwd(), source)} to public/wasm`);
