import type { ComponentProps } from 'react';
import { Fragment, jsx, jsxs } from 'react/jsx-runtime';

import Box from '@mui/material/Box';

import { toJsxRuntime } from 'hast-util-to-jsx-runtime';

import { createAnchoredHeading } from '@/components/markdown/heading-anchor';
import type { Locale } from '@/lib/locale';
import { markdownToHast } from '@/lib/markdown';

/**
 * Builds the link component. `resolveHref` turns relative links, written so
 * that they also work on GitHub, into site URLs. External links open in a
 * new tab.
 */
function createMarkdownLink(resolveHref?: (href: string) => string) {
  return function MarkdownLink({ href = '', ...props }: ComponentProps<'a'>) {
    const target = resolveHref?.(href) ?? href;
    const isExternal = /^https?:\/\//.test(target);
    return (
      <a
        href={target}
        {...(isExternal && { target: '_blank', rel: 'noopener noreferrer' })}
        {...props}
      />
    );
  };
}

/**
 * Wraps tables so that wide ones scroll instead of overflowing the page.
 */
function MarkdownTable(props: ComponentProps<'table'>) {
  return (
    <div className="table-wrapper">
      <table {...props} />
    </div>
  );
}

const calloutColors = {
  note: 'var(--nb-primary)',
  tip: '#e0a526',
  important: '#2e9d57',
  warning: '#d0393e',
  caution: '#d0393e',
};

const headingTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const;

/**
 * Maps each heading to the one `offset` levels below it, capped at `h6`.
 * The styles below target the rendered tag, so `h2` and `h3` keep their
 * look relative to the page. With `anchorLabel`, every heading also ends
 * with a link to itself.
 */
function headingComponents(offset: number, anchorLabel?: string) {
  if (!anchorLabel && offset <= 0) {
    return {};
  }
  return Object.fromEntries(
    headingTags.map((tag, index) => {
      const Tag =
        headingTags[
          Math.min(index + Math.max(offset, 0), headingTags.length - 1)
        ] ?? 'h6';
      return [
        tag,
        anchorLabel
          ? createAnchoredHeading(Tag, anchorLabel)
          : (props: ComponentProps<'h2'>) => <Tag {...props} />,
      ];
    })
  );
}

/**
 * Renders a lesson written in Markdown with the site typography.
 */
export async function MarkdownContent({
  source,
  locale,
  resolveHref,
  headingOffset = 0,
  anchorLabel,
}: {
  source: string;
  locale: Locale;
  /**
   * Rewrites links, for example a relative link to a lesson or to a file in
   * the repository. Return the link unchanged to keep it.
   */
  resolveHref?: (href: string) => string;
  /**
   * Moves the headings down by this many levels, to nest a document under
   * a heading of the page: with 1, `##` renders as `h3`.
   */
  headingOffset?: number;
  /**
   * Accessible name of the link icon added to every heading. Without it,
   * headings have no link.
   */
  anchorLabel?: string;
}) {
  const tree = await markdownToHast(source, locale);
  const content = toJsxRuntime(tree, {
    Fragment,
    jsx,
    jsxs,
    components: {
      a: createMarkdownLink(resolveHref),
      table: MarkdownTable,
      ...headingComponents(headingOffset, anchorLabel),
    },
  });

  return (
    <Box
      sx={{
        fontSize: '1.0625rem',
        lineHeight: 1.75,
        '& > :first-child': { mt: 0 },
        '& :is(h1, h2, h3, h4, h5, h6)': { scrollMarginTop: '80px' },
        '& h1': {
          mt: 6,
          mb: 2,
          fontSize: '2rem',
          fontWeight: 700,
          lineHeight: 1.2,
        },
        // Link to the heading, shown on hover or focus where there is a
        // pointer, and always on touch screens.
        '& .heading-anchor': {
          display: 'inline-flex',
          verticalAlign: 'middle',
          ml: '0.35em',
          p: '0.1em',
          borderRadius: 1,
          color: 'text.secondary',
          opacity: 0.45,
          transition: 'opacity 150ms, color 150ms',
          '&:hover, &:focus-visible': { color: 'primary.main', opacity: 1 },
          '@media (hover: hover)': { opacity: 0 },
        },
        '& :is(h1, h2, h3, h4, h5, h6):hover .heading-anchor, & :is(h1, h2, h3, h4, h5, h6):target .heading-anchor':
          { opacity: 1 },
        '& h2': {
          mt: 6,
          mb: 2,
          fontSize: '1.75rem',
          fontWeight: 700,
          lineHeight: 1.25,
        },
        '& h3': {
          mt: 4,
          mb: 1.5,
          fontSize: '1.3rem',
          fontWeight: 700,
          lineHeight: 1.3,
        },
        '& h4': {
          mt: 3,
          mb: 1,
          fontSize: '1.1rem',
          fontWeight: 700,
          lineHeight: 1.35,
        },
        '& h5, & h6': {
          mt: 2.5,
          mb: 1,
          fontSize: '1rem',
          fontWeight: 700,
          lineHeight: 1.4,
        },
        '& h6': { color: 'text.secondary' },
        '& p, & ul, & ol': { my: 2 },
        '& li + li': { mt: 0.5 },
        '& a': { color: 'primary.main', textUnderlineOffset: '3px' },
        '& hr': { my: 5, border: 0, borderTop: 1, borderColor: 'divider' },
        '& .table-wrapper': {
          my: 3,
          overflowX: 'auto',
          border: 1,
          borderColor: 'divider',
          borderRadius: 3,
        },
        '& table': {
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '0.95rem',
        },
        '& th, & td': {
          px: 2,
          py: 1.25,
          textAlign: 'left',
          verticalAlign: 'top',
          borderBottom: 1,
          borderColor: 'divider',
        },
        '& th': {
          fontWeight: 700,
          bgcolor: 'color-mix(in oklch, var(--nb-text) 5%, transparent)',
        },
        '& tr:last-of-type td': { borderBottom: 0 },
        // Code blocks highlighted by Shiki. The switch to the dark theme is
        // in `globals.css`, because it must override Shiki's inline styles.
        '& pre.shiki': {
          my: 3,
          p: 2,
          borderRadius: 3,
          overflowX: 'auto',
          fontSize: '0.9rem',
          lineHeight: 1.6,
          border: 1,
          borderColor: 'divider',
        },
        '& pre.shiki code': {
          bgcolor: 'transparent',
          p: 0,
          fontSize: 'inherit',
        },
        // Callouts written with the GitHub alert syntax.
        '& aside.callout': {
          my: 3,
          px: 2.5,
          py: 1.5,
          borderRadius: 3,
          borderInlineStart: '4px solid var(--callout-color)',
          bgcolor: 'color-mix(in oklch, var(--callout-color) 10%, transparent)',
          '& > p': { my: 1 },
        },
        '& .callout-title': {
          fontWeight: 700,
          color: 'var(--callout-color)',
          mb: '0 !important',
        },
        ...Object.fromEntries(
          Object.entries(calloutColors).map(([type, color]) => [
            `& .callout-${type}`,
            { '--callout-color': color },
          ])
        ),
      }}
    >
      {content}
    </Box>
  );
}
