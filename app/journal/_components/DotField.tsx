'use client';

import { useEffect, useRef } from 'react';
import { damp } from '../_lib/math';
import styles from './DotField.module.css';

const SPACING = 34;
const DOT_RADIUS = 1.1;
const DOT_COLOR = '210, 210, 208';
const DOT_ALPHA = 0.16;
const REPEL_RADIUS = 190;
const REPEL_STRENGTH = 46;
const SPRING_LAMBDA = 6;

interface Dot {
  homeX: number;
  homeY: number;
  x: number;
  y: number;
}

/**
 * Symmetric grid of dots, rendered on a 2D canvas, that spread apart
 * from the cursor and ease back to their resting grid position once it
 * moves away — a "liquid dot grid". Sits above the WebGL canvas (so it
 * reads over the cards) but is pointer-events: none throughout; it
 * tracks the cursor with its own listeners rather than intercepting any.
 */
export default function DotField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    let dots: Dot[] = [];
    let width = 0;
    let height = 0;
    const pointer = { x: 0, y: 0, active: false };

    const buildGrid = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const cols = Math.ceil(width / SPACING) + 1;
      const rows = Math.ceil(height / SPACING) + 1;
      // Center the grid so it stays symmetric around the viewport rather
      // than starting flush with the top-left corner.
      const offsetX = (width - (cols - 1) * SPACING) / 2;
      const offsetY = (height - (rows - 1) * SPACING) / 2;

      const next: Dot[] = [];
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const homeX = offsetX + col * SPACING;
          const homeY = offsetY + row * SPACING;
          next.push({ homeX, homeY, x: homeX, y: homeY });
        }
      }
      dots = next;
    };

    const onPointerMove = (e: PointerEvent) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.active = true;
    };
    const onPointerLeave = () => {
      pointer.active = false;
    };

    buildGrid();
    window.addEventListener('resize', buildGrid);
    window.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerleave', onPointerLeave);

    let rafId = 0;
    let lastTime = performance.now();

    const tick = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 1 / 30);
      lastTime = time;

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = `rgba(${DOT_COLOR}, ${DOT_ALPHA})`;

      for (const dot of dots) {
        let targetX = dot.homeX;
        let targetY = dot.homeY;

        if (pointer.active) {
          const dx = dot.homeX - pointer.x;
          const dy = dot.homeY - pointer.y;
          const dist = Math.hypot(dx, dy);
          if (dist < REPEL_RADIUS) {
            // Squared falloff reads softer/more "liquid" than a linear one.
            const falloff = 1 - dist / REPEL_RADIUS;
            const eased = falloff * falloff;
            const nx = dist > 0.001 ? dx / dist : 0;
            const ny = dist > 0.001 ? dy / dist : 0;
            targetX = dot.homeX + nx * eased * REPEL_STRENGTH;
            targetY = dot.homeY + ny * eased * REPEL_STRENGTH;
          }
        }

        dot.x = damp(dot.x, targetX, SPRING_LAMBDA, dt);
        dot.y = damp(dot.y, targetY, SPRING_LAMBDA, dt);

        ctx.beginPath();
        ctx.arc(dot.x, dot.y, DOT_RADIUS, 0, Math.PI * 2);
        ctx.fill();
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', buildGrid);
      window.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerleave', onPointerLeave);
    };
  }, []);

  return <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />;
}
