/* eslint-disable @eslint-react/no-array-index-key -- The PDF is rendered
   once from a static tree, so its children never move. */
import 'server-only';

import path from 'node:path';

import type { ReactNode } from 'react';

import type { Element, ElementContent, Root } from 'hast';
import {
  Document,
  Font,
  Link,
  Page,
  renderToBuffer,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer';

import type { Locale } from '@/lib/locale';
import { markdownToHast } from '@/lib/markdown';

/**
 * DejaVu covers every character of the courses, including arrows and the
 * box-drawing characters of the diagrams, which the site fonts lack.
 */
const fontDirectory = path.join(
  process.cwd(),
  'node_modules',
  'dejavu-fonts-ttf',
  'ttf'
);

const fontFile = (name: string) => path.join(fontDirectory, `${name}.ttf`);

Font.register({
  family: 'Sans',
  fonts: [
    { src: fontFile('DejaVuSans') },
    { src: fontFile('DejaVuSans-Bold'), fontWeight: 'bold' },
    { src: fontFile('DejaVuSans-Oblique'), fontStyle: 'italic' },
    {
      src: fontFile('DejaVuSans-BoldOblique'),
      fontWeight: 'bold',
      fontStyle: 'italic',
    },
  ],
});
Font.register({
  family: 'Mono',
  fonts: [
    { src: fontFile('DejaVuSansMono') },
    { src: fontFile('DejaVuSansMono-Bold'), fontWeight: 'bold' },
    { src: fontFile('DejaVuSansMono-Oblique'), fontStyle: 'italic' },
    {
      src: fontFile('DejaVuSansMono-BoldOblique'),
      fontWeight: 'bold',
      fontStyle: 'italic',
    },
  ],
});
// Keep words whole: the default splits them with hyphens.
Font.registerHyphenationCallback((word) => [word]);

const colors = {
  text: '#003049',
  muted: '#4d6b7c',
  primary: '#003049',
  link: '#0b6e99',
  border: '#d5dde2',
  codeBackground: '#f6f8fa',
  tableHeader: '#eef2f4',
};

/**
Accent color of each callout type, as on the site.
*/
const calloutColors: Record<string, string> = {
  note: '#003049',
  tip: '#e0a526',
  important: '#2e9d57',
  warning: '#d0393e',
  caution: '#d0393e',
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingBottom: 56,
    paddingHorizontal: 52,
    fontFamily: 'Sans',
    fontSize: 10,
    color: colors.text,
  },
  // A line height on the page itself hides the fixed footer, so it is set
  // on the content instead. It becomes a size in points, computed from the
  // font size of the same element.
  content: { fontSize: 10, lineHeight: 1.5 },
  meta: { fontSize: 9, color: colors.muted, marginBottom: 6 },
  title: { fontSize: 22, fontWeight: 'bold', lineHeight: 1.2 },
  description: { fontSize: 12, color: colors.muted, marginTop: 6 },
  rule: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginVertical: 14,
  },
  paragraph: { marginVertical: 4 },
  list: { marginVertical: 4 },
  listItem: { flexDirection: 'row', marginVertical: 1.5 },
  bullet: { width: 16 },
  listBody: { flex: 1 },
  pre: {
    marginVertical: 6,
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.codeBackground,
    fontFamily: 'Mono',
    fontSize: 8,
    lineHeight: 1.45,
  },
  inlineCode: {
    fontFamily: 'Mono',
    fontSize: 9,
    backgroundColor: colors.codeBackground,
  },
  link: { color: colors.link, textDecoration: 'underline' },
  blockquote: {
    marginVertical: 6,
    paddingLeft: 10,
    borderLeftWidth: 3,
    borderLeftColor: colors.border,
    color: colors.muted,
  },
  callout: {
    marginVertical: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderLeftWidth: 3,
    borderRadius: 3,
  },
  table: {
    marginVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    fontSize: 9,
    lineHeight: 1.4,
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  lastRow: { flexDirection: 'row' },
  cell: { flex: 1, paddingVertical: 4, paddingHorizontal: 6 },
  headerCell: { backgroundColor: colors.tableHeader },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 52,
    right: 52,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    color: colors.muted,
  },
});

const headingSizes: Record<string, number> = {
  h1: 18,
  h2: 15,
  h3: 12.5,
  h4: 11,
  h5: 10,
  h6: 10,
};

/**
Joins the class names of a hast element.
*/
function classNames(node: Element): string[] {
  const value = node.properties.className;
  return Array.isArray(value) ? value.map(String) : [];
}

/**
 * The light-theme color of a token highlighted by Shiki, from its inline
 * style: `color:#D73A49;--shiki-dark:#F97583`.
 */
function tokenColor(node: Element): string | undefined {
  const style =
    typeof node.properties.style === 'string' ? node.properties.style : '';
  return /(?:^|;)\s*color:\s*(#[\da-f]{3,8})/i.exec(style)?.[1];
}

/**
Plain text of a node, for code blocks.
*/
function textOf(node: ElementContent): string {
  if (node.type === 'text') {
    return node.value;
  }
  return node.type === 'element'
    ? node.children.map((child) => textOf(child)).join('')
    : '';
}

interface RenderContext {
  /**
  Absolute URL that relative links resolve against.
  */
  baseUrl: string;
}

/**
 * Renders inline content (text, emphasis, code, links) as nested `Text`.
 */
function renderInline(
  nodes: ElementContent[],
  context: RenderContext
): ReactNode[] {
  return nodes.map((node, index) => {
    if (node.type === 'text') {
      return node.value;
    }
    if (node.type !== 'element') {
      return null;
    }
    const children = renderInline(node.children, context);
    switch (node.tagName) {
      case 'strong':
      case 'b': {
        return (
          <Text key={index} style={{ fontWeight: 'bold' }}>
            {children}
          </Text>
        );
      }
      case 'em':
      case 'i': {
        return (
          <Text key={index} style={{ fontStyle: 'italic' }}>
            {children}
          </Text>
        );
      }
      case 'del': {
        return (
          <Text key={index} style={{ textDecoration: 'line-through' }}>
            {children}
          </Text>
        );
      }
      case 'code': {
        return (
          <Text key={index} style={styles.inlineCode}>
            {textOf(node)}
          </Text>
        );
      }
      case 'br': {
        return '\n';
      }
      case 'a': {
        const href = node.properties.href ?? '';
        const src = resolveLink(href, context);
        return src ? (
          <Link key={index} src={src} style={styles.link}>
            {children}
          </Link>
        ) : (
          <Text key={index}>{children}</Text>
        );
      }
      default: {
        return <Text key={index}>{children}</Text>;
      }
    }
  });
}

/**
 * Makes a link absolute, so it works outside the site. Links to lesson
 * files become lesson URLs; links to sections of the same page are dropped,
 * because the PDF has no anchors.
 */
function resolveLink(href: string, context: RenderContext): string | null {
  if (!href || href.startsWith('#')) {
    return null;
  }
  const lesson = /^(?:\.\/)?(\d{4}-[a-z\d-]+)\.[a-z]{2}\.md(#.*)?$/.exec(href);
  if (lesson) {
    return `${context.baseUrl}/${lesson[1]}${lesson[2] ?? ''}`;
  }
  try {
    return new URL(href, `${context.baseUrl}/`).href;
  } catch {
    return null;
  }
}

/**
Code blocks with at most this many lines never split across pages.
*/
const shortCodeLines = 20;

/**
 * Turns the leading spaces of each line into no-break spaces, which the
 * PDF layout keeps, so the indentation of code survives.
 */
function keepIndentation(text: string): string {
  return text.replaceAll(/^ +/gm, (spaces) => '\u{A0}'.repeat(spaces.length));
}

/**
 * Renders a highlighted code block, keeping the colors of the light theme.
 */
function renderCode(node: Element): ReactNode {
  const code = node.children.find(
    (child): child is Element =>
      child.type === 'element' && child.tagName === 'code'
  );
  const tokens = (code ?? node).children.map((child, index) => {
    if (child.type === 'text') {
      return child.value;
    }
    if (child.type !== 'element') {
      return null;
    }
    // Each line is a span of colored token spans; the first one holds the
    // indentation.
    return (
      <Text key={index}>
        {child.children.map((token, tokenIndex) => {
          const text =
            tokenIndex === 0 ? keepIndentation(textOf(token)) : textOf(token);
          return token.type === 'element' ? (
            <Text key={tokenIndex} style={{ color: tokenColor(token) }}>
              {text}
            </Text>
          ) : (
            text
          );
        })}
      </Text>
    );
  });
  // Short blocks move to the next page whole instead of splitting.
  const lineCount = textOf(node).split('\n').length;
  return (
    <View style={styles.pre} wrap={lineCount > shortCodeLines}>
      <Text>{tokens}</Text>
    </View>
  );
}

/**
Renders a list, numbered or with bullets.
*/
function renderList(node: Element, context: RenderContext): ReactNode {
  const isOrdered = node.tagName === 'ol';
  const start = Number(node.properties.start ?? 1);
  const items = node.children.filter(
    (child): child is Element =>
      child.type === 'element' && child.tagName === 'li'
  );
  return (
    <View style={styles.list}>
      {items.map((item, index) => {
        const checkbox = item.children
          .flatMap((child) =>
            child.type === 'element' && child.tagName === 'p'
              ? child.children
              : [child]
          )
          .find(
            (child): child is Element =>
              child.type === 'element' && child.tagName === 'input'
          );
        let marker = isOrdered ? `${start + index}.` : '•';
        if (checkbox) {
          marker = checkbox.properties.checked ? '☑' : '☐';
        }
        return (
          <View key={index} style={styles.listItem} wrap>
            <Text style={styles.bullet}>{marker}</Text>
            <View style={styles.listBody}>
              {renderBlocks(item.children, context)}
            </View>
          </View>
        );
      })}
    </View>
  );
}

/**
Renders a table with equal columns.
*/
function renderTable(node: Element, context: RenderContext): ReactNode {
  const rows = node.children
    .filter((child): child is Element => child.type === 'element')
    .flatMap((section) =>
      section.tagName === 'tr'
        ? [section]
        : section.children.filter(
            (child): child is Element =>
              child.type === 'element' && child.tagName === 'tr'
          )
    );
  return (
    <View style={styles.table}>
      {rows.map((row, rowIndex) => {
        const cells = row.children.filter(
          (child): child is Element => child.type === 'element'
        );
        return (
          <View
            key={rowIndex}
            style={rowIndex === rows.length - 1 ? styles.lastRow : styles.row}
            wrap={false}
          >
            {cells.map((cell, cellIndex) => {
              const isHeader = cell.tagName === 'th';
              return (
                <View
                  key={cellIndex}
                  style={
                    isHeader ? [styles.cell, styles.headerCell] : styles.cell
                  }
                >
                  <Text style={isHeader ? { fontWeight: 'bold' } : undefined}>
                    {renderInline(cell.children, context)}
                  </Text>
                </View>
              );
            })}
          </View>
        );
      })}
    </View>
  );
}

const inlineTags = new Set([
  'a',
  'b',
  'br',
  'code',
  'del',
  'em',
  'i',
  'input',
  'strong',
]);

/**
 * Renders block content. Runs of inline nodes, as in a tight list item,
 * become a paragraph.
 */
function renderBlocks(
  nodes: ElementContent[],
  context: RenderContext
): ReactNode[] {
  const output: ReactNode[] = [];
  let inline: ElementContent[] = [];

  const flushInline = () => {
    const hasText = inline.some(
      (node) => node.type !== 'text' || node.value.trim() !== ''
    );
    if (hasText) {
      output.push(
        <Text key={`inline-${output.length}`}>
          {renderInline(inline, context)}
        </Text>
      );
    }
    inline = [];
  };

  for (const node of nodes) {
    if (
      node.type === 'text' ||
      (node.type === 'element' && inlineTags.has(node.tagName))
    ) {
      if (!(node.type === 'element' && node.tagName === 'input')) {
        inline.push(node);
      }
      continue;
    }
    flushInline();
    // Shiki replaces each code block with a nested root that holds the
    // `pre` element.
    const nested = node as unknown as Root | ElementContent;
    if (nested.type === 'root') {
      output.push(
        <View key={output.length}>
          {renderBlocks(nested.children as ElementContent[], context)}
        </View>
      );
      continue;
    }
    if (node.type !== 'element') {
      continue;
    }
    const key = output.length;
    output.push(renderBlock(node, context, key));
  }
  flushInline();
  return output;
}

/**
Renders one block element.
*/
function renderBlock(
  node: Element,
  context: RenderContext,
  key: number
): ReactNode {
  const { tagName } = node;
  const headingSize = headingSizes[tagName];
  if (headingSize) {
    return (
      <Text
        key={key}
        minPresenceAhead={40}
        style={{
          fontSize: headingSize,
          fontWeight: 'bold',
          lineHeight: 1.3,
          marginTop: tagName === 'h2' || tagName === 'h1' ? 16 : 10,
          marginBottom: 4,
          color: tagName === 'h6' ? colors.muted : colors.primary,
        }}
      >
        {renderInline(node.children, context)}
      </Text>
    );
  }
  switch (tagName) {
    case 'p': {
      const isCalloutTitle = classNames(node).includes('callout-title');
      return (
        <Text
          key={key}
          style={
            isCalloutTitle
              ? { fontWeight: 'bold', marginBottom: 2 }
              : styles.paragraph
          }
        >
          {renderInline(node.children, context)}
        </Text>
      );
    }
    case 'ul':
    case 'ol': {
      return <View key={key}>{renderList(node, context)}</View>;
    }
    case 'pre': {
      return <View key={key}>{renderCode(node)}</View>;
    }
    case 'hr': {
      return <View key={key} style={styles.rule} />;
    }
    case 'blockquote': {
      return (
        <View key={key} style={styles.blockquote}>
          {renderBlocks(node.children, context)}
        </View>
      );
    }
    case 'aside': {
      const type =
        classNames(node)
          .find((name) => name.startsWith('callout-'))
          ?.slice('callout-'.length) ?? 'note';
      const color = calloutColors[type] ?? colors.primary;
      return (
        <View
          key={key}
          style={{
            ...styles.callout,
            borderLeftColor: color,
            backgroundColor: `${color}14`,
          }}
        >
          {renderBlocks(node.children, context)}
        </View>
      );
    }
    case 'table': {
      return <View key={key}>{renderTable(node, context)}</View>;
    }
    default: {
      // Containers such as `div` and `section`, for example footnotes.
      return <View key={key}>{renderBlocks(node.children, context)}</View>;
    }
  }
}

export interface LessonPdfInput {
  locale: Locale;
  title: string;
  description: string;
  /**
  Markdown body of the lesson.
  */
  body: string;
  /**
  Course title, version, and lesson position, shown above the title.
  */
  meta: string;
  /**
  Absolute URL of the lesson page.
  */
  url: string;
  /**
  Absolute URL of the course version, for links to other lessons.
  */
  baseUrl: string;
  /**
  Text of the page number, such as "Page 2 of 5".
  */
  pageLabel: (page: number, total: number) => string;
}

/**
 * Renders a lesson as an A4 PDF: a header with the title and description,
 * the body, and a footer with the lesson URL and the page number.
 */
export async function renderLessonPdf(input: LessonPdfInput): Promise<Buffer> {
  const tree: Root = await markdownToHast(input.body, input.locale);
  const content = tree.children.filter(
    (child): child is ElementContent => child.type !== 'doctype'
  );
  const context = { baseUrl: input.baseUrl };

  return renderToBuffer(
    <Document
      title={input.title}
      subject={input.description}
      author="Notebook"
      language={input.locale}
    >
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.content}>
          <Text style={styles.meta}>{input.meta}</Text>
          <Text style={styles.title}>{input.title}</Text>
          {input.description && (
            <Text style={styles.description}>{input.description}</Text>
          )}
          <View style={styles.rule} />
          {renderBlocks(content, context)}
        </View>
        <View style={styles.footer} fixed>
          <Link src={input.url} style={{ color: colors.muted }}>
            {input.url}
          </Link>
          <Text
            render={({ pageNumber, totalPages }) =>
              input.pageLabel(pageNumber, totalPages)
            }
          />
        </View>
      </Page>
    </Document>
  );
}
