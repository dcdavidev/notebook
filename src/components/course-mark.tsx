import Box from '@mui/material/Box';

import { accentFor } from '@/lib/accent';
import { courseLogoFor } from '@/lib/course-logos';

/**
 * Square tile that stands for a course: the logo of its technology on a
 * light tile, or a gradient in the course accent when it has no logo.
 * It is decorative: the course title is always next to it.
 */
export function CourseMark({
  slug,
  size = 36,
}: {
  slug: string;
  size?: number;
}) {
  const logo = courseLogoFor(slug);
  const accent = accentFor(slug);
  return (
    <Box
      aria-hidden
      sx={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: `${Math.round(size * 0.28)}px`,
        display: 'grid',
        placeItems: 'center',
        ...(logo
          ? {
              bgcolor: '#fff',
              border: 1,
              borderColor: 'divider',
            }
          : {
              background: `linear-gradient(135deg, ${accent}, color-mix(in oklch, ${accent}, black 35%))`,
            }),
      }}
    >
      {logo && (
        // eslint-disable-next-line @next/next/no-img-element -- small static SVG
        <img
          src={logo.src}
          alt=""
          width={Math.round(size * 0.72)}
          height={Math.round((size * 0.72) / logo.aspectRatio)}
          style={{ display: 'block' }}
        />
      )}
    </Box>
  );
}
