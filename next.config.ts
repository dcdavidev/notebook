import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // The course archives render every lesson PDF, which takes longer than
  // the default 60 seconds.
  staticPageGenerationTimeout: 300,
  // The courses are Markdown files read from disk: ship them with the build.
  outputFileTracingIncludes: {
    '/[lang]/**': ['./learning-materials/**/*'],
    // The logo embedded in the Open Graph images.
    '/**/opengraph-image': ['./public/brand/logo-128.png'],
    '/**/twitter-image': ['./public/brand/logo-128.png'],
    // Fonts embedded in the lesson PDFs.
    '/[lang]/learn/[topic]/course/[version]/[lesson]/pdf': [
      './node_modules/dejavu-fonts-ttf/ttf/DejaVuSans*.ttf',
    ],
    '/[lang]/learn/[topic]/course/[version]/download/[format]': [
      './node_modules/dejavu-fonts-ttf/ttf/DejaVuSans*.ttf',
    ],
  },
};

// Uses the request configuration in `src/i18n/request.ts`.
const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
