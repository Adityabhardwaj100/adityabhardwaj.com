'use client';

import { useEffect, useRef } from 'react';
import type { FocusedCardState } from '../_webgl/JournalScene';
import type { JournalItem } from '../_lib/types';
import styles from './ArticlePanel.module.css';

interface ArticlePanelProps {
  item: JournalItem;
  getState: () => FocusedCardState | null;
}

function splitParagraphs(body: string): string[] {
  return body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/** Short, punchy lines (no closing period) read as beats/headings rather
 *  than body copy — give them a bit more visual weight. */
function isHeading(paragraph: string) {
  return paragraph.length < 45 && !paragraph.endsWith('.');
}

/**
 * Scrollable article text laid directly over the card's back face. Tracks
 * the card's exact live screen rect (including the flip/push-forward
 * animation and window resizes) via its own rAF loop, and fades in only
 * once the card has flipped far enough to be showing its back.
 */
export default function ArticlePanel({ item, getState }: ArticlePanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const paragraphs = splitParagraphs(item.body ?? '');

  useEffect(() => {
    let rafId = 0;

    const tick = () => {
      const state = getState();
      const panel = panelRef.current;
      if (state && panel) {
        const { rect, flipProgress } = state;
        panel.style.transform = `translate(${rect.left}px, ${rect.top}px)`;
        panel.style.width = `${rect.width}px`;
        panel.style.height = `${rect.height}px`;
        // Only readable once the card is more than halfway flipped, so it
        // doesn't show through the front face partway into the turn.
        panel.style.opacity = String(Math.max(0, (flipProgress - 0.5) * 2));
        panel.style.pointerEvents = flipProgress > 0.85 ? 'auto' : 'none';
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [getState]);

  return (
    <div ref={panelRef} className={styles.panel}>
      <div className={styles.scroll}>
        {paragraphs.map((p, i) => (
          <p key={i} className={isHeading(p) ? styles.heading : styles.paragraph}>
            {p}
          </p>
        ))}
      </div>
    </div>
  );
}
