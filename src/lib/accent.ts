/**
 * Accent colors for the topic cards. Each topic always gets the same one,
 * picked from its slug.
 */
const accents = [
  '#2e7d5b',
  '#c2410c',
  '#6d28d9',
  '#0e7490',
  '#be185d',
  '#a16207',
  '#1d4ed8',
];

/**
 * Picks a stable accent color for a topic.
 */
export function accentFor(slug: string): string {
  let hash = 0;
  for (const char of slug) {
    hash = (hash * 31 + (char.codePointAt(0) ?? 0)) % 997;
  }
  return accents[hash % accents.length] ?? accents[0] ?? 'currentColor';
}
