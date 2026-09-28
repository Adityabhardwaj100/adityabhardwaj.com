import * as THREE from 'three';

/** Canvas size of the poster artwork. */
const CW = 1024;
const CH = 1440;

/** The poster hangs on the far wall, in the dark behind everything else. */
export const POSTER_Z = -8;
export const POSTER_H = 3.9;
export const POSTER_W = POSTER_H * (CW / CH);

const NAIL: [number, number] = [512, 50];
const HOLE: [number, number] = [806, 372];

const toWorld = ([x, y]: [number, number]): [number, number] => [(x / CW - 0.5) * POSTER_W, (0.5 - y / CH) * POSTER_H];

/** Where the bullet goes through, in world space. */
export const POSTER_HOLE: [number, number, number] = [...toWorld(HOLE), POSTER_Z];

export interface PosterFonts {
  poster: string;
  display: string;
  body: string;
}

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

/** A sheet with torn, uneven edges. */
function tornSheet(ctx: CanvasRenderingContext2D, r: () => number) {
  const m = 26;
  const jag = () => (r() - 0.5) * 14;
  ctx.beginPath();
  ctx.moveTo(m, m);
  for (let x = m; x <= CW - m; x += 18) ctx.lineTo(x, m + jag());
  for (let y = m; y <= CH - m; y += 18) ctx.lineTo(CW - m + jag(), y);
  for (let x = CW - m; x >= m; x -= 18) ctx.lineTo(x, CH - m + jag());
  for (let y = CH - m; y >= m; y -= 18) ctx.lineTo(m + jag(), y);
  ctx.closePath();
}

function centered(ctx: CanvasRenderingContext2D, text: string, y: number, font: string, color: string, spacing = 0) {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  if ('letterSpacing' in ctx) (ctx as unknown as { letterSpacing: string }).letterSpacing = `${spacing}px`;
  ctx.fillText(text, CW / 2 + spacing / 2, y);
}

/** Paint the WANTED poster, with the photograph printed into the paper. */
export async function drawPoster(img: HTMLImageElement, fonts: PosterFonts) {
  await Promise.all([
    document.fonts.load(`200px ${fonts.poster}`),
    document.fonts.load(`60px ${fonts.display}`),
    document.fonts.load(`italic 40px ${fonts.body}`),
  ]).catch(() => undefined);

  const canvas = document.createElement('canvas');
  canvas.width = CW;
  canvas.height = CH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  const r = rng(7);

  // Paper.
  ctx.save();
  tornSheet(ctx, r);
  ctx.clip();
  const paper = ctx.createLinearGradient(0, 0, CW, CH);
  paper.addColorStop(0, '#e2d2ad');
  paper.addColorStop(0.5, '#d6c49c');
  paper.addColorStop(1, '#c4ae82');
  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, CW, CH);

  // Fibre and grime.
  for (let i = 0; i < 26000; i++) {
    ctx.fillStyle = r() < 0.5 ? 'rgba(60,40,15,0.06)' : 'rgba(255,248,230,0.05)';
    ctx.fillRect(r() * CW, r() * CH, 1 + r() * 2, 1 + r() * 2);
  }
  // Water stains.
  for (let i = 0; i < 7; i++) {
    const x = r() * CW;
    const y = r() * CH;
    const rad = 60 + r() * 180;
    const g = ctx.createRadialGradient(x, y, rad * 0.6, x, y, rad);
    g.addColorStop(0, 'rgba(120,80,30,0.05)');
    g.addColorStop(0.9, 'rgba(110,70,25,0.13)');
    g.addColorStop(1, 'rgba(110,70,25,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  // Scorched, darkened edges.
  const edge = ctx.createRadialGradient(CW / 2, CH / 2, CH * 0.38, CW / 2, CH / 2, CH * 0.78);
  edge.addColorStop(0, 'rgba(60,35,10,0)');
  edge.addColorStop(1, 'rgba(60,35,10,0.55)');
  ctx.fillStyle = edge;
  ctx.fillRect(0, 0, CW, CH);

  // Double border.
  ctx.strokeStyle = 'rgba(40,24,10,0.85)';
  ctx.lineWidth = 6;
  ctx.strokeRect(66, 66, CW - 132, CH - 132);
  ctx.lineWidth = 2;
  ctx.strokeRect(80, 80, CW - 160, CH - 160);

  const ink = '#2a190c';
  centered(ctx, 'WANTED', 268, `164px ${fonts.poster}`, ink, 6);

  // The photograph, cropped to the man, printed into the paper.
  const px = 176;
  const py = 312;
  const pw = CW - px * 2;
  const ph = 700;
  const sw = img.naturalWidth * 0.9;
  const sh = sw * (ph / pw);
  const sx = img.naturalWidth * 0.05;
  const sy = img.naturalHeight * 0.24;
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.filter = 'grayscale(1) sepia(0.6) contrast(1.25) brightness(1.02)';
  ctx.drawImage(img, sx, sy, sw, sh, px, py, pw, ph);
  ctx.restore();
  ctx.strokeStyle = ink;
  ctx.lineWidth = 5;
  ctx.strokeRect(px, py, pw, ph);

  centered(ctx, 'ADITYA BHARDWAJ', 1112, `76px ${fonts.poster}`, ink, 4);
  centered(ctx, 'For delivering the future', 1176, `italic 46px ${fonts.body}`, '#3b2614');

  ctx.fillStyle = ink;
  ctx.fillRect(CW / 2 - 170, 1214, 340, 3);
  centered(ctx, 'REWARD', 1282, `52px ${fonts.poster}`, ink, 12);
  centered(ctx, 'One Conversation', 1352, `70px ${fonts.display}`, ink, 1);

  // Fold creases.
  for (const [x1, y1, x2, y2] of [
    [0, CH / 2, CW, CH / 2],
    [CW / 2, 0, CW / 2, CH],
  ] as const) {
    ctx.strokeStyle = 'rgba(255,245,220,0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(60,35,10,0.18)';
    ctx.beginPath();
    ctx.moveTo(x1 + 2, y1 + 2);
    ctx.lineTo(x2 + 2, y2 + 2);
    ctx.stroke();
  }

  // The bullet hole: scorched ring, splits in the paper, a clean hole through.
  const [hx, hy] = HOLE;
  const burn = ctx.createRadialGradient(hx, hy, 10, hx, hy, 78);
  burn.addColorStop(0, 'rgba(20,10,4,0.95)');
  burn.addColorStop(0.35, 'rgba(70,35,10,0.6)');
  burn.addColorStop(1, 'rgba(90,50,15,0)');
  ctx.fillStyle = burn;
  ctx.fillRect(hx - 80, hy - 80, 160, 160);
  ctx.strokeStyle = 'rgba(25,12,4,0.8)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + r() * 0.4;
    const len = 30 + r() * 38;
    ctx.beginPath();
    ctx.moveTo(hx + Math.cos(a) * 12, hy + Math.sin(a) * 12);
    ctx.lineTo(hx + Math.cos(a + 0.15) * len * 0.6, hy + Math.sin(a + 0.15) * len * 0.6);
    ctx.lineTo(hx + Math.cos(a) * len, hy + Math.sin(a) * len);
    ctx.stroke();
  }
  ctx.restore();

  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.arc(hx, hy, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';

  // The nail it hangs from.
  const [nx, ny] = NAIL;
  const nail = ctx.createRadialGradient(nx - 4, ny - 4, 1, nx, ny, 13);
  nail.addColorStop(0, '#9a9288');
  nail.addColorStop(0.5, '#3c3731');
  nail.addColorStop(1, '#141210');
  ctx.fillStyle = nail;
  ctx.beginPath();
  ctx.arc(nx, ny, 13, 0, Math.PI * 2);
  ctx.fill();

  return canvas;
}

/** The poster mesh, pivoting on its nail so it can swing after the hit. */
export function createPoster() {
  const pivotY = (0.5 - NAIL[1] / CH) * POSTER_H;
  const pivot = new THREE.Group();
  pivot.position.set(0, pivotY, POSTER_Z);

  const material = new THREE.MeshStandardMaterial({
    // Paper is pale; keep it lit, not glowing, under the bloom.
    color: '#8a806c',
    roughness: 0.95,
    envMapIntensity: 0.45,
    metalness: 0,
    transparent: true,
    alphaTest: 0.02,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(POSTER_W, POSTER_H), material);
  mesh.position.y = -pivotY;
  pivot.add(mesh);

  let texture: THREE.CanvasTexture | null = null;

  return {
    pivot,
    setArtwork(canvas: HTMLCanvasElement, anisotropy: number) {
      texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = anisotropy;
      material.map = texture;
      material.needsUpdate = true;
    },
    setOpacity(o: number) {
      material.opacity = o;
      pivot.visible = o > 0.002 && texture !== null;
    },
    dispose() {
      mesh.geometry.dispose();
      material.dispose();
      texture?.dispose();
    },
  };
}
