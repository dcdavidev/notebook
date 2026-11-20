import packageJson from '../../package.json';

import { renderOgImage } from '@/lib/og-image';

export const alt = 'Notebook';
export { contentType, size } from '@/lib/og-image';

/**
 * Shared image of the landing page. Routes without their own image, such
 * as the 404 page, inherit it.
 */
export default function Image() {
  return renderOgImage({
    title: 'Notebook',
    description: packageJson.description,
  });
}
