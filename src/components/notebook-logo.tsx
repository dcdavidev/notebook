import type { SVGProps } from 'react';

/**
 * The Notebook mark: a ring-bound notebook with a bookmark, outlined and
 * centered on a transparent background. The same drawing is the favicon
 * (`src/app/icon.svg`, also rendered to `apple-icon.png` and
 * `favicon.ico`), so keep them in sync. The colors come from the Olive
 * Garden palette and stay the same in every theme.
 */
export function NotebookLogo({
  size = 32,
  ...props
}: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg
      viewBox="4 4 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <rect
        x="8.2"
        y="5"
        width="17"
        height="22"
        rx="3"
        fill="#FEFAE0"
        stroke="#283618"
        strokeWidth="1"
      />
      <path d="M19.2 5h4v9.5l-2-1.7-2 1.7z" fill="#DDA15E" />
      <circle cx="8.2" cy="10" r="1.9" fill="#283618" />
      <circle cx="8.2" cy="16" r="1.9" fill="#283618" />
      <circle cx="8.2" cy="22" r="1.9" fill="#283618" />
      <rect x="12.2" y="18" width="9" height="1.8" rx=".9" fill="#606C38" />
      <rect x="12.2" y="22" width="6" height="1.8" rx=".9" fill="#606C38" />
    </svg>
  );
}
