import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Journal — Aditya Bhardwaj',
  description: 'An infinite, pannable WebGL art journal.',
};

/**
 * Scopes the journal's full-bleed, no-scroll treatment to this route only —
 * the rest of the site keeps normal document flow. Both GLCanvas and
 * UIOverlay are `position: fixed`, so this wrapper mainly guarantees a
 * matching background behind them and stops the route from adding any
 * scrollable height to the page.
 */
export default function JournalLayout({ children }: { children: React.ReactNode }) {
  return <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', background: '#0d0d0c' }}>{children}</div>;
}
