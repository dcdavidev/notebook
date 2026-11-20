import type { ComponentProps } from 'react';
import { Fragment, jsx, jsxs } from 'react/jsx-runtime';

import Box from '@mui/material/Box';

import { toJsxRuntime } from 'hast-util-to-jsx-runtime';

import type { Locale } from '@/lib/locale';
import { markdownToHast } from '@/lib/markdown';

/**
A relative link to a lesson file, such as `./0001-intro.en.md#setup`.
*/
const lessonLinkPattern = /^(?:\.\/)?(\d{4}-[a-z\d-]+)\.[a-z]{2}\.md(#.*)?$/;

/**
 * Builds the link component. Links to lesson files, written so that they
 * also work on GitHub, become site URLs under `lessonBase`. External links
 * open in a new tab.
 */
function createMarkdownLink(
  lessonBase?: string,
  resolveHref?: (href: string) => string
) {
  return function MarkdownLink({ href = '', ...props }: ComponentProps<'a'>) {
    const lesson = lessonBase ? lessonLinkPattern.exec(href) : null;
    const target = lesson
      ? `${lessonBase}/${lesson[1]}${lesson[2] ?? ''}`
      : (resolveHref?.(href) ?? href);
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
 * look relative to the page.
 */
function shiftedHeadings(offset: number) {
  if (offset <= 0) {
    return {};
  }
  return Object.fromEntries(
    headingTags.map((tag, index) => {
      const Tag =
        headingTags[Math.min(index + offset, headingTags.length - 1)] ?? 'h6';
      return [tag, (props: ComponentProps<'h2'>) => <Tag {...props} />];
    })
  );
}

/**
 * Renders a lesson written in Markdown with the site typography.
 */
export async function MarkdownContent({
  source,
  locale,
  lessonBase,
  resolveHref,
  headingOffset = 0,
}: {
  source: string;
  locale: Locale;
  /**
  URL of the course version, used to resolve links to lesson files.
  */
  lessonBase?: string;
  /**
   * Rewrites any other link, for example a relative link to a file in the
   * repository. Return the link unchanged to keep it.
   */
  resolveHref?: (href: string) => string;
  /**
   * Moves the headings down by this many levels, to nest a document under
   * a heading of the page: with 1, `##` renders as `h3`.
   */
  headingOffset?: number;
}) {
  const tree = await markdownToHast(source, locale);
  const content = toJsxRuntime(tree, {
    Fragment,
    jsx,
    jsxs,
    components: {
      a: createMarkdownLink(lessonBase, resolveHref),
      table: MarkdownTable,
      ...shiftedHeadings(headingOffset),
    },
  });

  return (
    <Box
      sx={{
        fontSize: '1.0625rem',
        lineHeight: 1.75,
        '& > :first-child': { mt: 0 },
        '& h2': {
          mt: 6,
          mb: 2,
          fontSize: '1.75rem',
          fontWeight: 700,
          lineHeight: 1.25,
          scrollMarginTop: '80px',
        },
        '& h3': {
          mt: 4,
          mb: 1.5,
          fontSize: '1.3rem',
          fontWeight: 700,
          lineHeight: 1.3,
          scrollMarginTop: '80px',
        },
        '& h4': {
          mt: 3,
          mb: 1,
          fontSize: '1.1rem',
          fontWeight: 700,
          lineHeight: 1.35,
          scrollMarginTop: '80px',
        },
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
