/**
 * `sx` styles that hide text visually but keep it for screen readers, for
 * example "(opens in a new tab)" after a link. Use pixel strings: in `sx`,
 * a number up to 1 means a percentage, so `width: 1` would be 100%.
 */
export const visuallyHidden = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  margin: '-1px',
  padding: 0,
  border: 0,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
} as const;
