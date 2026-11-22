import type { MetadataRoute } from 'next';

import packageJson from '../../package.json';

/**
 * `robots.txt`: every public page can be crawled. The account pages and
 * the sign-in callback are personal or empty without a session, so they
 * stay out of search results.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/account', '/profile', '/auth/'],
    },
    host: packageJson.homepage,
  };
}
