import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // The courses are Markdown files read from disk: ship them with the build.
  outputFileTracingIncludes: {
    '/[lang]/**': ['./learning-materials/**/*'],
  },
};

// Uses the request configuration in `src/i18n/request.ts`.
const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
