/**
 * Every idea on the About page as a formation of particles. Each shape
 * places the same COUNT particles; the scene morphs one formation into
 * the next as the reader scrolls.
 *
 * World scale: the camera sits ~10 units back, so the frame is ~6 units tall.
 */

import { POSTER_HOLE, POSTER_Z } from './poster';

export const COUNT = 7000;

export interface Shape {
  /** xyz per particle */
  pos: Float32Array;
  /** brightness per particle (≈0.2 dim → 1.4 hot) */
  bright: Float32Array;
}

/** Order matters: this is the story's timeline (the "key" index). */
export const KEY = {
  future: 0,
  chaos: 1,
  lattice: 2,
  network: 3,
  gear: 4,
  cylinder: 5,
  shot: 6,
  wanted: 7,
  knot: 8,
  ring: 9,
  haze: 10,
  foundation: 11,
  flame: 12,
} as const;

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function make(seed: number, place: (i: number, r: () => number, out: [number, number, number]) => number): Shape {
  const r = rng(seed);
  const pos = new Float32Array(COUNT * 3);
  const bright = new Float32Array(COUNT);
  const p: [number, number, number] = [0, 0, 0];
  for (let i = 0; i < COUNT; i++) {
    bright[i] = place(i, r, p);
    pos[i * 3] = p[0];
    pos[i * 3 + 1] = p[1];
    pos[i * 3 + 2] = p[2];
  }
  return { pos, bright };
}

/** Approximately normal, mean 0, sd 1. */
const gauss = (r: () => number) => (r() + r() + r() + r() - 2) * 1.73;

function sphereShell(r: () => number, out: [number, number, number], radius: number) {
  const u = r() * 2 - 1;
  const t = r() * Math.PI * 2;
  const s = Math.sqrt(1 - u * u);
  out[0] = s * Math.cos(t) * radius;
  out[1] = s * Math.sin(t) * radius;
  out[2] = u * radius;
}

function rotate(out: [number, number, number], rx: number, ry: number) {
  const [x, y, z] = out;
  const cy = Math.cos(ry), sy = Math.sin(ry);
  const x1 = x * cy + z * sy;
  const z1 = -x * sy + z * cy;
  const cx = Math.cos(rx), sx = Math.sin(rx);
  out[0] = x1;
  out[1] = y * cx - z1 * sx;
  out[2] = y * sx + z1 * cx;
}

/** "Most men buy the future. Almost none of them ever see it delivered."
 *  A bright, far-off sphere; a trail of light reaches for it and dies out short. */
const future = () =>
  make(11, (i, r, o) => {
    const target: [number, number, number] = [1.4, 0.7, -5];
    if (i < COUNT * 0.42) {
      sphereShell(r, o, 0.55 + Math.abs(gauss(r)) * 0.12);
      o[0] += target[0];
      o[1] += target[1];
      o[2] += target[2];
      return 0.9 + r() * 0.5;
    }
    // Quadratic curve from the viewer toward the future — never arriving.
    const t = Math.pow(r(), 1.7) * 0.7;
    const a: [number, number, number] = [-2.6, -2.2, 3];
    const c: [number, number, number] = [-0.6, -1.4, 0];
    const k = 1 - t;
    const spread = 0.03 + 0.14 * (1 - t);
    for (let d = 0; d < 3; d++) o[d] = k * k * a[d]! + 2 * k * t * c[d]! + t * t * target[d]! + gauss(r) * spread;
    return 1.1 - t * 1.2;
  });

/** "…sold something they don't understand." A few thin threads, knotted through each other. */
const chaos = () =>
  make(23, (i, r, o) => {
    const curve = i % 4;
    const t = r() * Math.PI * 2;
    const [f, g, h] = ([[2, 3, 5], [3, 5, 4], [5, 2, 3], [4, 7, 2]] as const)[curve]!;
    const ph = curve * 1.3;
    o[0] = Math.sin(f * t + ph) * 1.8 + Math.sin(h * t) * 0.5 + gauss(r) * 0.025;
    o[1] = Math.sin(g * t + ph * 0.7) * 1.3 + Math.cos(f * t) * 0.3 + gauss(r) * 0.025;
    o[2] = Math.cos(h * t + ph) * 1.3 + gauss(r) * 0.025;
    return 0.5 + r() * 0.4;
  });

/** "I build it, and then I hand it over, and then it's theirs." Order, handed to you. */
const lattice = () =>
  make(37, (_i, r, o) => {
    const n = 5;
    const size = 2.1;
    const step = size / (n - 1);
    const axis = Math.floor(r() * 3);
    const a = Math.floor(r() * n) * step - size / 2;
    const b = Math.floor(r() * n) * step - size / 2;
    const t = r() * size - size / 2;
    const p: [number, number, number] = axis === 0 ? [t, a, b] : axis === 1 ? [a, t, b] : [a, b, t];
    o[0] = p[0];
    o[1] = p[1];
    o[2] = p[2];
    rotate(o, 0.42, 0.62);
    o[2] += 1.2;
    // Nodes where edges meet burn brighter.
    const onNode = Math.abs(((t + size / 2) / step) % 1) < 0.06;
    return onNode ? 1.5 : 0.8;
  });

/** Ministries, universities, corporate floors — accounts, wired together. */
const NODES: [number, number, number][] = [
  [-1.9, 1.1, 0.3],
  [-0.4, 1.7, -0.6],
  [1.3, 1.2, 0.2],
  [2.2, -0.2, -0.4],
  [0.9, -1.4, 0.5],
  [-1.0, -1.2, -0.2],
  [-2.3, -0.3, 0.6],
];
const EDGES: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 0], [0, 2], [1, 4], [2, 5], [3, 6],
];

const network = () =>
  make(41, (i, r, o) => {
    if (i < COUNT * 0.5) {
      const node = NODES[i % NODES.length]!;
      const spread = 0.13;
      for (let d = 0; d < 3; d++) o[d] = node[d]! + gauss(r) * spread;
      return 1.0 + r() * 0.5;
    }
    const [ai, bi] = EDGES[i % EDGES.length]!;
    const a = NODES[ai]!;
    const b = NODES[bi]!;
    const t = Math.round(r() * 28) / 28; // dotted, like a ledger's leader line
    for (let d = 0; d < 3; d++) o[d] = a[d]! + (b[d]! - a[d]!) * t + gauss(r) * 0.012;
    return 0.45;
  });

/** INOX: "a machine that worked when nobody was watching." A gear. */
const gear = () =>
  make(53, (i, r, o) => {
    const teeth = 14;
    const part = i / COUNT;
    const depth = (r() - 0.5) * 0.35;
    if (part < 0.62) {
      const th = r() * Math.PI * 2;
      const tooth = Math.cos(th * teeth) > 0.1 ? 1 : 0;
      const rad = 1.55 + tooth * 0.24 + gauss(r) * 0.018;
      o[0] = Math.cos(th) * rad;
      o[1] = Math.sin(th) * rad;
      o[2] = depth;
      return 1.1;
    }
    if (part < 0.8) {
      const th = r() * Math.PI * 2;
      const rad = 0.42 + gauss(r) * 0.015;
      o[0] = Math.cos(th) * rad;
      o[1] = Math.sin(th) * rad;
      o[2] = depth;
      return 1.2;
    }
    const spoke = Math.floor(r() * 6);
    const th = (spoke / 6) * Math.PI * 2;
    const rad = 0.42 + r() * 1.13;
    o[0] = Math.cos(th) * rad + gauss(r) * 0.03;
    o[1] = Math.sin(th) * rad + gauss(r) * 0.03;
    o[2] = depth;
    return 0.8;
  });

/** Around the brass cylinder: a faint halo of dust, so the metal holds the stage. */
const halo = () =>
  make(67, (_i, r, o) => {
    const th = r() * Math.PI * 2;
    const rad = 2.2 + Math.abs(gauss(r)) * 0.8;
    o[0] = Math.cos(th) * rad;
    o[1] = Math.sin(th) * rad;
    o[2] = gauss(r) * 0.6 - 1;
    return 0.06 + r() * 0.1;
  });

/** Bullet-time: the round hangs mid-air trailing vapour and shock rings. Bullet at origin, flying +x. */
const shot = () =>
  make(59, (i, r, o) => {
    const part = i / COUNT;
    if (part < 0.55) {
      // Vapour trail, widening behind the bullet.
      const back = Math.pow(r(), 0.7) * 7;
      const spread = 0.06 + back * 0.07;
      const th = r() * Math.PI * 2;
      const rad = Math.sqrt(r()) * spread;
      o[0] = -1.1 - back;
      o[1] = Math.cos(th) * rad;
      o[2] = Math.sin(th) * rad;
      return 0.55 - back * 0.06;
    }
    if (part < 0.85) {
      // Three shock rings, each larger and fainter.
      const ring = Math.floor(r() * 3);
      const th = r() * Math.PI * 2;
      const rad = 0.55 + ring * 0.45 + gauss(r) * 0.015;
      o[0] = -1.4 - ring * 1.3 + gauss(r) * 0.03;
      o[1] = Math.cos(th) * rad;
      o[2] = Math.sin(th) * rad;
      return 0.9 - ring * 0.2;
    }
    // Loose dust hanging in the frozen air.
    o[0] = (r() - 0.5) * 12;
    o[1] = (r() - 0.5) * 6;
    o[2] = (r() - 0.5) * 6 - 1;
    return 0.12;
  });

/** The poster on the wall: dust hanging in the lamplight around it, smoke curling from the hole. */
const wanted = () =>
  make(61, (i, r, o) => {
    const part = i / COUNT;
    if (part < 0.12) {
      // Smoke from the bullet hole, curling up.
      const h = Math.pow(r(), 0.8) * 2.6;
      o[0] = POSTER_HOLE[0] + Math.sin(h * 2.4 + 1) * 0.12 * h + gauss(r) * 0.04 * (1 + h);
      o[1] = POSTER_HOLE[1] + h;
      o[2] = POSTER_Z + 0.08 + gauss(r) * 0.05;
      return 0.35 - h * 0.1;
    }
    // Dust motes in the air between us and the wall.
    o[0] = (r() - 0.5) * 7;
    o[1] = (r() - 0.5) * 5.5;
    o[2] = POSTER_Z + 0.4 + r() * 5;
    return 0.05 + r() * 0.08;
  });

/** Four things, tangled: "taking something complicated…" */
const knot = () =>
  make(71, (_i, r, o) => {
    const p = 3;
    const q = 7;
    const t = r() * Math.PI * 2;
    const rad = Math.cos(q * t) + 2.2;
    o[0] = rad * Math.cos(p * t) * 0.62 + gauss(r) * 0.07;
    o[1] = rad * Math.sin(p * t) * 0.62 + gauss(r) * 0.07;
    o[2] = -Math.sin(q * t) * 0.62 + gauss(r) * 0.07;
    return 0.55 + r() * 0.5;
  });

/** "…and putting it where a person can use it." One clean ring, four lights on it. */
const ring = () =>
  make(83, (i, r, o) => {
    if (i < COUNT * 0.28) {
      const k = i % 4;
      const th = Math.PI / 4 + (k * Math.PI) / 2;
      o[0] = Math.cos(th) * 1.7 + gauss(r) * 0.06;
      o[1] = Math.sin(th) * 1.7 + gauss(r) * 0.06;
      o[2] = gauss(r) * 0.06;
      return 1.5;
    }
    const th = r() * Math.PI * 2;
    o[0] = Math.cos(th) * 1.7 + gauss(r) * 0.012;
    o[1] = Math.sin(th) * 1.7 + gauss(r) * 0.012;
    o[2] = gauss(r) * 0.012;
    return 0.8;
  });

/** "Everyone in this industry is promising you the future." Over-bright haze. */
const haze = () =>
  make(97, (_i, r, o) => {
    const rad = Math.pow(r(), 0.6) * 3.2;
    sphereShell(r, o, rad);
    o[1] = o[1] * 0.7 + 0.5;
    o[2] -= 1.5;
    return 0.9 + r() * 0.6;
  });

/** "…six months from now, with the right systems running quietly underneath it." */
const foundation = () =>
  make(101, (i, r, o) => {
    const part = i / COUNT;
    const floor = -1.35;
    if (part < 0.55) {
      // The quiet grid underneath.
      const along = r() * 7 - 3.5;
      const line = Math.round((r() * 7 - 3.5) / 0.5) * 0.5;
      if (r() < 0.5) {
        o[0] = along;
        o[2] = line - 0.5;
      } else {
        o[0] = line;
        o[2] = along * 0.8 - 0.5;
      }
      o[1] = floor;
      return 0.32;
    }
    // Six months, six pillars, each a little taller.
    const m = i % 6;
    const h = 0.45 + m * 0.36;
    o[0] = -2.2 + m * 0.88 + gauss(r) * 0.05;
    o[1] = floor + r() * h;
    o[2] = 0.4 + gauss(r) * 0.05;
    const top = o[1] > floor + h - 0.08;
    return top ? 1.6 : 0.9;
  });

/** "One conversation…" Everything down to a single flame. */
const flame = () =>
  make(113, (i, r, o) => {
    if (i < COUNT * 0.8) {
      const y = Math.pow(r(), 0.8);
      const width = 0.34 * Math.sin(Math.PI * Math.pow(y, 0.6)) * (1 - y * 0.35);
      const th = r() * Math.PI * 2;
      const rad = Math.sqrt(r()) * width;
      o[0] = Math.cos(th) * rad;
      o[1] = y * 1.5 - 0.6;
      o[2] = Math.sin(th) * rad;
      return 1.5 - y * 0.6 - (rad / Math.max(width, 0.001)) * 0.5;
    }
    sphereShell(r, o, 2.4 + r() * 1.5);
    return 0.12;
  });

export function buildShapes(): Shape[] {
  return [
    future(),
    chaos(),
    lattice(),
    network(),
    gear(),
    halo(),
    shot(),
    wanted(),
    knot(),
    ring(),
    haze(),
    foundation(),
    flame(),
  ];
}
