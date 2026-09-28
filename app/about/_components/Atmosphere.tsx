'use client';

import { useEffect } from 'react';
import { atmosphere } from '../_lib/atmosphere';
import { sound, type SoundScene } from '../_lib/audio';

/**
 * Watches which chapter crosses the middle of the viewport and hands its
 * mood (ember density, sound scene) to the page-wide layers.
 */
export default function Atmosphere() {
  useEffect(() => {
    const chapters = document.querySelectorAll<HTMLElement>('[data-chapter]');
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          atmosphere.embers = Number(el.dataset.embers ?? 0.4);
          sound.setScene((el.dataset.sound as SoundScene | undefined) ?? 'bed');
        }
      },
      { rootMargin: '-50% 0px -50% 0px' },
    );
    chapters.forEach((el) => io.observe(el));
    return () => {
      io.disconnect();
      sound.disable();
    };
  }, []);

  return null;
}
