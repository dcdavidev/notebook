'use client';

/**
 * An inline script that runs while the browser parses the HTML, before the
 * first paint. React warns in development when rendering produces an
 * executable `<script>`, so the script is `text/javascript` only in the
 * server HTML and `text/plain` on the client, where it must not run again.
 * `suppressHydrationWarning` accepts the different `type`. See the Next.js
 * guide "How to prevent flash before hydration".
 */
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === 'undefined' ? 'text/javascript' : 'text/plain'}
      suppressHydrationWarning
      // eslint-disable-next-line @eslint-react/dom/no-dangerously-set-innerhtml -- callers pass static scripts built from our own constants
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
