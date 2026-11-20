import type { ComponentType, ReactNode } from 'react';

/**
 * Logos of the sign-in providers, drawn as each provider asks sign-in
 * buttons to show them. They are decorative: the button text names the
 * provider.
 */
export interface LogoProps {
  size?: number;
}

function Svg({
  size = 20,
  viewBox,
  children,
}: LogoProps & { viewBox: string; children: ReactNode }) {
  return (
    <svg
      viewBox={viewBox}
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

/**
The multicolor Google "G".
*/
export function GoogleLogo({ size }: LogoProps) {
  return (
    <Svg size={size} viewBox="0 0 48 48">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </Svg>
  );
}

/**
The GitHub mark (Octicons `mark-github`, MIT license), in the text color.
*/
export function GitHubLogo({ size }: LogoProps) {
  return (
    <Svg size={size} viewBox="0 0 16 16">
      <path
        fill="currentColor"
        d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"
      />
    </Svg>
  );
}

/**
The four Microsoft squares.
*/
export function MicrosoftLogo({ size }: LogoProps) {
  return (
    <Svg size={size} viewBox="0 0 21 21">
      <rect x="1" y="1" width="9" height="9" fill="#F25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </Svg>
  );
}

/**
 * The Facebook "f" in a circle. The circle takes the text color and the
 * "f" is cut out, so it is blue on a light page and white on the blue
 * button.
 */
export function FacebookLogo({ size }: LogoProps) {
  return (
    <Svg size={size} viewBox="0 0 24 24">
      <path
        fill="currentColor"
        d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z"
      />
    </Svg>
  );
}

/**
 * Logo of each provider, for lists such as the linked accounts. The
 * Facebook logo is blue there, as on Facebook's own pages.
 */
export const providerLogos: Record<
  'google' | 'github' | 'azure' | 'facebook',
  ComponentType<LogoProps>
> = {
  google: GoogleLogo,
  github: GitHubLogo,
  azure: MicrosoftLogo,
  facebook: ({ size }) => (
    <span style={{ display: 'inline-flex', color: '#1877F2' }}>
      <FacebookLogo size={size} />
    </span>
  ),
};
