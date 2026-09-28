'use client';

import { useEffect, useRef, type RefObject } from 'react';

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

export function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Tracks how far the viewport has scrolled through `ref` as 0→1 and writes
 * it to the element as the `--p` CSS custom property, so chapters can
 * animate in pure CSS without re-rendering React every frame.
 *
 * For a tall wrapper holding a sticky stage, 0 is "stage just pinned" and
 * 1 is "stage about to unpin". Reduced motion pins progress at 1.
 */
export function useScrollProgress<T extends HTMLElement>(ref: RefObject<T>, onProgress?: (p: number) => void) {
  const callback = useRef(onProgress);
  callback.current = onProgress;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let frame = 0;
    let last = -1;

    const update = () => {
      frame = 0;
      let p = 1;
      if (!prefersReducedMotion()) {
        const rect = el.getBoundingClientRect();
        const travel = rect.height - window.innerHeight;
        p = travel > 0 ? clamp01(-rect.top / travel) : clamp01((window.innerHeight - rect.top) / window.innerHeight);
      }
      if (p === last) return;
      last = p;
      el.style.setProperty('--p', p.toFixed(4));
      callback.current?.(p);
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [ref]);
}

/** Flips to true once the element first comes into view (and stays true). */
export function useInViewOnce<T extends HTMLElement>(ref: RefObject<T>, rootMargin = '0px 0px -20% 0px') {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      el.dataset.inView = 'true';
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            el.dataset.inView = 'true';
            io.disconnect();
          }
        }
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin]);
}
