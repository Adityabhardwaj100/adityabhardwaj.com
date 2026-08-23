'use client';

import styles from './IntroModal.module.css';

interface IntroModalProps {
  onStart: () => void;
}

/**
 * Full-screen welcome card shown once when the journal page is entered.
 * Sits above everything (including the site nav) so it's the sole focus;
 * "Start Exploring" is the only way past it.
 */
export default function IntroModal({ onStart }: IntroModalProps) {
  return (
    <div className={styles.backdrop}>
      <div className={styles.card}>
        <h1 className={styles.heading}>Emark Journal</h1>

        <p className={styles.text}>
          An infinite grid displaying 3×4 artworks and their accompanying stories on the flip side.
        </p>
        <p className={styles.text}>Chapters in the journal capture moments, places, and encounters along the way.</p>
        <p className={styles.text}>Scroll, drag, or use keyboard arrows</p>

        <button className={styles.button} onClick={onStart}>
          Start Exploring
        </button>
      </div>
    </div>
  );
}
