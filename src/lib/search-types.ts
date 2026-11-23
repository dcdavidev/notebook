import type { LessonLevel } from '@/lib/courses';

/**
 * The search index of one language, built at build time from the newest
 * edition of every course and searched in the browser.
 *
 * Every page (a lesson or a glossary entry) is split into sections: the
 * text before the first heading, then one section per `##` or `###`
 * heading. A result links to the section it matches, so a match in a
 * heading opens the page at that heading.
 */
export interface SearchIndexData {
  pages: SearchPage[];
  sections: SearchSection[];
}

export interface SearchPage {
  kind: 'lesson' | 'glossary';
  /**
  The topic folder, for example `abap`.
  */
  topic: string;
  /**
  The course title, for example `ABAP`.
  */
  course: string;
  title: string;
  description: string;
  level?: LessonLevel;
  /**
  Site path without the language, through the `latest` edition.
  */
  path: string;
}

export interface SearchSection {
  /**
  Index of the page in `pages`.
  */
  page: number;
  /**
  The heading of the section and its `id` on the page; none for the text
  before the first heading.
  */
  heading?: string;
  anchor?: string;
  /**
  The prose of the section, as plain text.
  */
  text: string;
  /**
  The code blocks of the section, searched with a low weight.
  */
  code: string;
}
