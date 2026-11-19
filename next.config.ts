import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
};

// Uses the request configuration in `src/i18n/request.ts`.
const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
