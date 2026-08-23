'use client';

import type { JournalItem } from '../_lib/types';
import styles from './UIOverlay.module.css';

interface UIOverlayProps {
  focusedItem: JournalItem | null;
  onClose: () => void;
}

/**
 * Floats standard HTML/CSS over the WebGL canvas. The root has
 * `pointer-events: none` so drag/scroll/click pass straight through to
 * the canvas; only actual UI chrome (hint, caption, close button) opts
 * back in via `pointer-events: auto`. Section navigation itself lives in
 * the site-wide NavBar (app/_components/NavBar.tsx), not here.
 */
export default function UIOverlay({ focusedItem, onClose }: UIOverlayProps) {
  return (
    <div className={styles.overlay}>
      {!focusedItem && <span className={styles.hint}>Drag · Scroll · Arrow keys</span>}

      {focusedItem && (
        <>
          <button className={styles.closeButton} onClick={onClose}>
            Close ✕
          </button>
          <div className={styles.lightbox}>
            <p className={styles.lightboxTitle}>{focusedItem.title}</p>
            <p className={styles.lightboxDate}>{focusedItem.date}</p>
          </div>
        </>
      )}
    </div>
  );
}
