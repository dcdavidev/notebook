'use client';

const openSignInEvent = 'nb-open-sign-in';

/**
 * Asks the account button to open the sign-in dialog, for example when a
 * signed-out visitor taps a favorite button.
 */
export function requestSignIn(): void {
  dispatchEvent(new Event(openSignInEvent));
}

/**
 * Calls `callback` every time something asks for the sign-in dialog.
 * Returns a function that stops listening.
 */
export function onSignInRequest(callback: () => void): () => void {
  addEventListener(openSignInEvent, callback);
  return () => {
    removeEventListener(openSignInEvent, callback);
  };
}
