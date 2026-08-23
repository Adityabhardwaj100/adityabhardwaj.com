'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { JournalScene, type FocusedCardState } from '../_webgl/JournalScene';
import type { GridItem } from '../_webgl/GridItem';
import styles from './GLCanvas.module.css';

interface GLCanvasProps {
  /** Fired when the focused (lightbox) plane changes, so DOM overlay
   *  content (title/caption/close button) can react to it. */
  onFocusChange?: (item: GridItem | null) => void;
}

export interface GLCanvasHandle {
  exitFocus: () => void;
  /** Live rect + flip progress of the focused plane, or null if none is
   *  focused — polled per-frame by ArticlePanel to track it precisely. */
  getFocusedCardState: () => FocusedCardState | null;
}

const GLCanvas = forwardRef<GLCanvasHandle, GLCanvasProps>(function GLCanvas({ onFocusChange }, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<JournalScene | null>(null);

  useImperativeHandle(ref, () => ({
    exitFocus: () => sceneRef.current?.exitFocus(),
    getFocusedCardState: () => sceneRef.current?.getFocusedCardState() ?? null,
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scene = new JournalScene(canvas);
    sceneRef.current = scene;
    if (onFocusChange) scene.onFocusChange = onFocusChange;

    const handleResize = () => scene.resize(window.innerWidth, window.innerHeight);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      scene.dispose();
      sceneRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <canvas ref={canvasRef} className={styles.canvas} />;
});

export default GLCanvas;
