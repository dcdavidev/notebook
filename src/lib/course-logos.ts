/**
 * Logo of the technology a course teaches, in `public/brand/courses/`.
 * Courses without one show their accent color instead.
 */
export interface CourseLogo {
  src: string;
  /**
  Name of the brand.
  */
  alt: string;
  /**
  Width divided by height, to size the logo without layout shifts.
  */
  aspectRatio: number;
}

export const sapLogo: CourseLogo = {
  src: '/brand/courses/sap.svg',
  alt: 'SAP',
  aspectRatio: 1000 / 494.466,
};

const logos: Record<string, CourseLogo> = {
  abap: sapLogo,
};

/**
 * The logo of a course topic, if it has one.
 */
export function courseLogoFor(slug: string): CourseLogo | undefined {
  return Object.hasOwn(logos, slug) ? logos[slug] : undefined;
}
