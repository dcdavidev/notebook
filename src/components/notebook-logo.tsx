import type { ImgHTMLAttributes } from 'react';

/**
Small copy of the logo, sharp up to 64 px on 2x screens.
*/
export const logoSrc = '/brand/logo-128.png';

/**
 * The Notebook logo: a ring-bound notebook on a rounded square with a blue
 * to orange gradient. The source is `public/brand/logo.png`; the favicon,
 * `src/app/icon.png`, and `src/app/apple-icon.png` are made from it.
 *
 * It is a plain `img` because the Open Graph images render it with satori,
 * which needs an absolute or data URL: they pass `src`.
 */
export function NotebookLogo({
  size = 32,
  src = logoSrc,
  ...props
}: Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  size?: number;
  src?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- tiny static logo, also rendered by satori
    <img
      src={src}
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      draggable={false}
      {...props}
    />
  );
}
