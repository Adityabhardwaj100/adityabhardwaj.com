import type { CSSProperties } from 'react';

/**
 * Inline style for a `.reveal` element: it fades/sharpens in as the
 * chapter's `--p` moves from `start` to `start + duration`.
 */
export const at = (start: number, duration = 0.08): CSSProperties =>
  ({ '--s': start, '--d': duration }) as CSSProperties;
