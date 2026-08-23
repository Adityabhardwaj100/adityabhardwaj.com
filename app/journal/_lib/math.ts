/**
 * Small math utilities shared by the WebGL layer.
 * Kept dependency-free and framerate-independent where it matters.
 */

export const clamp = (v: number, min: number, max: number) =>
  Math.min(Math.max(v, min), max);

/** Standard linear interpolation. */
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Framerate-independent exponential easing ("damp").
 * `lambda` is the speed of convergence (higher = snappier).
 * Reference: Freya Holmer's "Lerp smoothing is broken" — using
 * `1 - exp(-lambda * dt)` instead of a fixed `t` keeps the feel
 * identical regardless of frame rate.
 */
export const damp = (a: number, b: number, lambda: number, dt: number) =>
  lerp(a, b, 1 - Math.exp(-lambda * dt));

/**
 * Wraps `value` into the centered range [-size/2, size/2).
 * This is the core trick behind the infinite grid: instead of moving
 * planes around, we keep their logical position fixed and wrap their
 * *rendered* position into the range nearest the camera every frame.
 */
export const wrapCentered = (value: number, size: number) => {
  if (size <= 0) return value;
  const half = size / 2;
  // ((v + half) mod size + size) mod size - half  -> always in [-half, half)
  return (((value + half) % size) + size) % size - half;
};

/** Euclidean modulo (always returns a non-negative result). */
export const mod = (n: number, m: number) => ((n % m) + m) % m;
