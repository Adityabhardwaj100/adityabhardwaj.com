'use client';

import { useRef, type CSSProperties, type ReactNode } from 'react';
import { useScrollProgress } from '../_lib/useScrollProgress';
import type { SoundScene } from '../_lib/audio';
import styles from '../about.module.css';

interface ChapterProps {
  /** Accessible name for the section. */
  label: string;
  /** How many viewport-heights of scrolling the pinned stage lasts. */
  length: number;
  /** Ember density behind this chapter, 0→1. */
  embers?: number;
  /** Which sound bed plays while this chapter is centred. */
  sound?: SoundScene;
  onProgress?: (p: number) => void;
  stageClassName?: string;
  children: ReactNode;
}

/**
 * A tall section with a sticky, full-viewport stage inside it. Scroll
 * progress through the section is exposed to CSS as `--p` (0→1).
 */
export default function Chapter({
  label,
  length,
  embers = 0.4,
  sound = 'bed',
  onProgress,
  stageClassName,
  children,
}: ChapterProps) {
  const ref = useRef<HTMLElement>(null);
  useScrollProgress(ref, onProgress);

  return (
    <section
      ref={ref}
      aria-label={label}
      className={styles.chapter}
      style={{ '--len': length } as CSSProperties}
      data-chapter=""
      data-embers={embers}
      data-sound={sound}
    >
      <div className={`${styles.stage} ${stageClassName ?? ''}`}>{children}</div>
    </section>
  );
}
