'use client';

import Lenis from 'lenis';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AboutStage } from '../_webgl/Stage';
import { KEY } from '../_webgl/shapes';
import { sound } from '../_lib/audio';
import SoundToggle from './SoundToggle';
import styles from '../about.module.css';

const NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/**
 * The words sit still in a column; the 3D world beside them acts out
 * what they mean. Reading position (a line ~45% down the viewport)
 * through each `[data-keys]` block drives a continuous story "key".
 */
export default function AboutExperience({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hudNumRef = useRef<HTMLSpanElement>(null);
  const hudNameRef = useRef<HTMLSpanElement>(null);
  const hudBarRef = useRef<HTMLSpanElement>(null);
  const [ready, setReady] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const blocks = Array.from(root.querySelectorAll<HTMLElement>('[data-keys]'));
    const keysOf = blocks.map((b) => (b.dataset.keys ?? '0').split(',').map(Number));
    // How far through each step the morph to the next idea begins (0.62 = hold, then move).
    const easeOf = blocks.map((b) => Number(b.dataset.ease ?? 0.62));
    const originBlock = blocks.findIndex((b) => b.hasAttribute('data-origin'));

    let stage: AboutStage | null = null;
    try {
      stage = new AboutStage(canvas, { reducedMotion });
    } catch {
      root.dataset.gl = 'off';
    }

    if (stage && new URLSearchParams(window.location.search).has('debug')) {
      (window as unknown as { __stage?: AboutStage }).__stage = stage;
    }

    let loaded = !stage;
    const finish = () => {
      loaded = true;
    };
    if (stage) stage.onReady = finish;
    const failSafe = window.setTimeout(finish, 5000);

    const resize = () => stage?.resize(window.innerWidth, window.innerHeight);
    resize();
    window.addEventListener('resize', resize);

    const onPointer = (e: PointerEvent) => {
      stage?.setPointer((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1));
    };
    window.addEventListener('pointermove', onPointer, { passive: true });

    const lenis = reducedMotion ? null : new Lenis({ lerp: 0.085, smoothWheel: true });

    let activeBlock = -1;
    let activeStep = -1;
    let chamber = 0;
    let lastKey = 0;
    let frame = 0;
    let counter = 0;
    let lastShown = 0;
    const start = performance.now();

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      lenis?.raf(now);

      // Loader counter: runs to 90, then waits for the scene.
      if (counter < 100) {
        const target = loaded ? 100 : Math.min(90, ((now - start) / 1000) * 80);
        counter = Math.min(target, counter + Math.max(0.6, (target - counter) * 0.12));
        const shown = Math.floor(counter);
        if (shown !== lastShown) {
          lastShown = shown;
          setCount(shown);
        }
        if (counter >= 100) window.setTimeout(() => setReady(true), reducedMotion ? 0 : 250);
      }

      // Where is the reader?
      const line = window.innerHeight * (window.innerWidth < 900 ? 0.62 : 0.45);
      let bi = 0;
      let t = 0;
      for (let i = 0; i < blocks.length; i++) {
        const r = blocks[i]!.getBoundingClientRect();
        if (line >= r.top) {
          bi = i;
          t = Math.min(1, (line - r.top) / r.height);
        }
      }
      const keys = keysOf[bi]!;
      const n = keys.length;
      const sub = Math.min(Math.max(t * n, 0), n - 0.0001);
      const si = Math.floor(sub);
      const current = keys[si]!;
      const next = si + 1 < n ? keys[si + 1]! : keysOf[bi + 1]?.[0] ?? current;
      const key = current + smoothstep(si === n - 1 ? easeOf[bi]! : 0.62, 1, sub - si) * (next - current);

      if (bi !== activeBlock || si !== activeStep) {
        if (bi !== activeBlock) {
          blocks[activeBlock]?.removeAttribute('data-active');
          blocks[bi]!.setAttribute('data-active', '');
          const label = blocks[bi]!.dataset.label ?? '';
          if (hudNumRef.current) hudNumRef.current.textContent = NUMERALS[bi] ?? '';
          if (hudNameRef.current) hudNameRef.current.textContent = label;
        }
        root.querySelectorAll('[data-step][data-on]').forEach((el) => el.removeAttribute('data-on'));
        blocks[bi]!.querySelector(`[data-step="${si}"]`)?.setAttribute('data-on', '');
        activeBlock = bi;
        activeStep = si;
      }

      // The cylinder: one chamber per origin line; parked before and after.
      const nextChamber = bi < originBlock ? 0 : bi > originBlock ? 5 : si;
      if (nextChamber !== chamber) {
        if (bi === originBlock) sound.click();
        chamber = nextChamber;
      }

      // Sound: silence as we go into the chamber, one note as the man appears, warmth at the end.
      sound.setScene(key > KEY.cylinder + 0.35 && key < KEY.portrait + 0.6 ? 'silence' : key >= KEY.foundation + 0.4 ? 'resolve' : 'bed');
      if (lastKey < KEY.portrait - 0.4 && key >= KEY.portrait - 0.4) sound.toll();
      lastKey = key;

      if (hudBarRef.current) {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        hudBarRef.current.style.transform = `scaleY(${max > 0 ? window.scrollY / max : 0})`;
      }

      if (stage) {
        stage.setKey(key);
        stage.setChamber(chamber);
        stage.render(now);
      }
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(failSafe);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointer);
      lenis?.destroy();
      stage?.dispose();
      sound.disable();
    };
  }, []);

  return (
    <main ref={rootRef} className={styles.page} data-ready={ready || undefined}>
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
      <div className={styles.shade} aria-hidden="true" />
      <div className={styles.grain} aria-hidden="true" />

      <div className={styles.loader} aria-hidden="true" data-loader="">
        <div className={styles.flame}>
          <i />
        </div>
        <span className={styles.loaderCount}>{String(count).padStart(3, '0')}</span>
        <span className={styles.loaderCaption}>Striking a light</span>
      </div>

      <div className={styles.column}>{children}</div>

      <div className={styles.hud} aria-hidden="true">
        <span className={styles.hudTrack}>
          <span ref={hudBarRef} className={styles.hudBar} />
        </span>
        <span className={styles.hudText}>
          <span className={styles.hudLabel}>Chamber</span>
          <span ref={hudNumRef} className={styles.hudNum}>
            I
          </span>
          <span ref={hudNameRef} className={styles.hudName}>
            The Business
          </span>
        </span>
      </div>

      <SoundToggle />
    </main>
  );
}
