'use client';

/**
 * On desktop the page content scrolls inside the `main` panel of the app
 * shell; on phones the whole window scrolls. These helpers hide the
 * difference.
 */
export const mainScrollId = 'nb-main';

/**
 * The `main` panel, when it is the element that scrolls.
 */
export function getMainScroller(): HTMLElement | null {
  const element = document.querySelector<HTMLElement>(`#${mainScrollId}`);
  if (!element) {
    return null;
  }
  return getComputedStyle(element).overflowY === 'auto' ? element : null;
}

/**
 * How far the content has been scrolled, from 0 to 100.
 */
export function readScrollProgress(): number {
  const scroller = getMainScroller();
  const { scrollHeight, clientHeight } = scroller ?? document.documentElement;
  const top = scroller ? scroller.scrollTop : window.scrollY;
  const scrollable = scrollHeight - clientHeight;
  return scrollable <= 0
    ? 100
    : Math.min(100, Math.max(0, (top / scrollable) * 100));
}

/**
 * Scrolls both the `main` panel and the window back to the top.
 */
export function scrollToTop(behavior: ScrollBehavior = 'auto'): void {
  getMainScroller()?.scrollTo({ top: 0, behavior });
  window.scrollTo({ top: 0, behavior });
}
