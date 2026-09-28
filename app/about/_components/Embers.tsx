'use client';

import { useEffect, useRef } from 'react';
import { Geometry, Mesh, Program, Renderer } from 'ogl';
import { atmosphere } from '../_lib/atmosphere';
import { prefersReducedMotion } from '../_lib/useScrollProgress';
import styles from '../about.module.css';

const vertex = /* glsl */ `
  attribute vec2 position;
  attribute vec4 random;
  uniform float uTime;
  uniform float uIntensity;
  uniform float uDpr;
  varying float vLife;
  varying float vAlpha;

  void main() {
    float speed = mix(0.018, 0.065, random.x);
    float life = fract(position.y + uTime * speed);
    float sway = sin(uTime * (0.25 + random.w * 0.6) + random.z * 6.2831) * 0.05 * (0.4 + life);
    vLife = life;

    // Density: each particle has a threshold; intensity decides how many show.
    float shown = clamp((uIntensity - random.y) * 8.0, 0.0, 1.0);
    vAlpha = shown * smoothstep(0.0, 0.08, life) * (1.0 - smoothstep(0.55, 1.0, life));

    gl_Position = vec4(position.x + sway, life * 2.3 - 1.15, 0.0, 1.0);
    gl_PointSize = mix(1.2, 4.2, random.x * random.w) * uDpr * (1.0 - life * 0.55);
  }
`;

const fragment = /* glsl */ `
  precision highp float;
  varying float vLife;
  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    float glow = smoothstep(0.5, 0.0, d);
    vec3 hot = vec3(1.0, 0.52, 0.18);
    vec3 ash = vec3(0.46, 0.43, 0.39);
    vec3 color = mix(hot, ash, smoothstep(0.15, 0.85, vLife));
    gl_FragColor = vec4(color, glow * vAlpha * mix(0.95, 0.3, vLife));
  }
`;

/** Sparse embers drifting upward behind the page. Density follows the chapter. */
export default function Embers() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || prefersReducedMotion()) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let renderer: Renderer;
    try {
      renderer = new Renderer({ canvas, dpr, alpha: true, premultipliedAlpha: false, antialias: false });
    } catch {
      return; // No WebGL — the page is complete without embers.
    }
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);

    const count = window.innerWidth < 700 ? 140 : 280;
    const position = new Float32Array(count * 2);
    const random = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) {
      position[i * 2] = Math.random() * 2.2 - 1.1;
      position[i * 2 + 1] = Math.random();
      random.set([Math.random(), Math.random(), Math.random(), Math.random()], i * 4);
    }

    const geometry = new Geometry(gl, {
      position: { size: 2, data: position },
      random: { size: 4, data: random },
    });
    const program = new Program(gl, {
      vertex,
      fragment,
      transparent: true,
      depthTest: false,
      uniforms: { uTime: { value: 0 }, uIntensity: { value: 0 }, uDpr: { value: dpr } },
    });
    program.setBlendFunc(gl.SRC_ALPHA, gl.ONE);
    const mesh = new Mesh(gl, { geometry, program, mode: gl.POINTS });

    const resize = () => renderer.setSize(window.innerWidth, window.innerHeight);
    resize();
    window.addEventListener('resize', resize);

    let frame = 0;
    const start = performance.now();
    const loop = (now: number) => {
      frame = requestAnimationFrame(loop);
      const u = program.uniforms;
      u.uTime!.value = (now - start) / 1000;
      u.uIntensity!.value += (atmosphere.embers - u.uIntensity!.value) * 0.03;
      renderer.render({ scene: mesh });
    };
    frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      geometry.remove();
      program.remove();
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, []);

  return <canvas ref={canvasRef} className={styles.embers} aria-hidden="true" />;
}
