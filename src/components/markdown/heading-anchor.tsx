import type { ComponentProps } from 'react';

import { IconLink } from '@tabler/icons-react';

type HeadingTag = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

/**
 * Builds a heading that ends with a link to itself, so a reader can copy
 * the URL of a section. Headings without an `id` render unchanged.
 */
export function createAnchoredHeading(Tag: HeadingTag, label: string) {
  return function AnchoredHeading({
    id,
    children,
    ...props
  }: ComponentProps<'h2'>) {
    return (
      <Tag id={id} {...props}>
        {children}
        {id && (
          <a
            href={`#${id}`}
            className="heading-anchor"
            aria-label={label}
            title={label}
          >
            <IconLink size="0.8em" stroke={2} aria-hidden />
          </a>
        )}
      </Tag>
    );
  };
}
