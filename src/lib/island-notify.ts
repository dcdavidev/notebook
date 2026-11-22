'use client';

/**
 * A short message for the Dynamic Island, the notification area at the top
 * of the page.
 */
export interface IslandNotice {
  message: string;
  severity?: 'success' | 'error' | 'info';
  /**
  A button next to the message, for example "Undo".
  */
  action?: { label: string; onClick: () => void };
  /**
  How long the message stays, in ms. Defaults to 4 s, 6 s with an action.
  */
  duration?: number;
}

const noticeEvent = 'nb-island-notice';

/**
 * Shows a message in the Dynamic Island. Messages queue up and show one at
 * a time.
 */
export function notify(notice: IslandNotice): void {
  dispatchEvent(new CustomEvent<IslandNotice>(noticeEvent, { detail: notice }));
}

/**
 * Calls `callback` with every message sent with `notify`. Returns a
 * function that stops listening.
 */
export function onNotice(callback: (notice: IslandNotice) => void) {
  const listener = (event: Event) => {
    callback((event as CustomEvent<IslandNotice>).detail);
  };
  addEventListener(noticeEvent, listener);
  return () => {
    removeEventListener(noticeEvent, listener);
  };
}
