import * as THREE from 'three';

/** Sample a radius profile r(y) along a length into points for LatheGeometry (evenly spaced, so UV v ≈ y / length). */
function profile(length: number, radius: (y: number) => number, steps = 72) {
  const pts: THREE.Vector2[] = [new THREE.Vector2(0, 0)];
  for (let i = 0; i <= steps; i++) {
    const y = (i / steps) * length;
    pts.push(new THREE.Vector2(Math.max(radius(y), 0.0001), y));
  }
  pts.push(new THREE.Vector2(0, length));
  return pts;
}

/**
 * A loaded round, sized for the cylinder's chambers. Local axis runs along
 * -z from the base (at z = 0, facing the viewer) to the tip.
 */
export function createCartridge() {
  const group = new THREE.Group();
  const brass = new THREE.MeshStandardMaterial({ color: '#b8904f', metalness: 1, roughness: 0.4, envMapIntensity: 0.6, transparent: true });
  const copper = new THREE.MeshStandardMaterial({ color: '#9a5a33', metalness: 1, roughness: 0.4, envMapIntensity: 0.6, transparent: true });
  const nickel = new THREE.MeshStandardMaterial({ color: '#7d776e', metalness: 1, roughness: 0.5, envMapIntensity: 0.5, transparent: true });

  const caseLen = 1.25;
  const caseGeo = new THREE.LatheGeometry(
    profile(caseLen, (y) => (y < 0.045 ? 0.25 : y < 0.07 ? 0.2 : 0.21), 40),
    40,
  );
  const tipLen = 0.52;
  const tipGeo = new THREE.LatheGeometry(
    profile(tipLen, (y) => {
      const t = y / tipLen;
      return t < 0.35 ? 0.2 : 0.2 * Math.sqrt(Math.max(0, 1 - Math.pow((t - 0.35) / 0.65, 2)));
    }, 24),
    40,
  );
  const caseMesh = new THREE.Mesh(caseGeo, brass);
  const tipMesh = new THREE.Mesh(tipGeo, copper);
  tipMesh.position.y = caseLen;
  const primer = new THREE.Mesh(new THREE.CircleGeometry(0.075, 32), nickel);
  primer.rotation.x = Math.PI / 2;
  primer.position.y = -0.002;

  // Lathe axis is +Y; point it into the chamber (-z) with the base facing us.
  const body = new THREE.Group();
  body.add(caseMesh, tipMesh, primer);
  body.rotation.x = -Math.PI / 2;
  group.add(body);

  const materials = [brass, copper, nickel];
  return {
    group,
    setOpacity(o: number) {
      for (const m of materials) m.opacity = o;
      group.visible = o > 0.002;
    },
    dispose() {
      caseGeo.dispose();
      tipGeo.dispose();
      (primer.geometry as THREE.BufferGeometry).dispose();
      materials.forEach((m) => m.dispose());
    },
  };
}

/** Copper jacket with ADI hand-engraved along one side. */
function engraving(font: string) {
  const w = 1024;
  const h = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  const metal = ctx.createLinearGradient(0, 0, w, 0);
  metal.addColorStop(0, '#9c5a30');
  metal.addColorStop(0.5, '#c77b45');
  metal.addColorStop(1, '#9c5a30');
  ctx.fillStyle = metal;
  ctx.fillRect(0, 0, w, h);
  // Fine machining lines around the jacket.
  for (let y = 0; y < h; y += 3) {
    ctx.fillStyle = `rgba(${y % 2 ? '255,220,180' : '60,25,8'},0.05)`;
    ctx.fillRect(0, y, w, 1);
  }
  // Cannelure groove near the base.
  ctx.fillStyle = 'rgba(50,20,6,0.55)';
  ctx.fillRect(0, h * 0.86, w, 14);

  // ADI runs along the length (canvas v), centred on the side facing the camera (u = 0.5).
  ctx.save();
  ctx.translate(w * 0.5, h * 0.6);
  ctx.rotate(-Math.PI / 2);
  ctx.font = `210px ${font}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if ('letterSpacing' in ctx) (ctx as unknown as { letterSpacing: string }).letterSpacing = '30px';
  ctx.fillStyle = 'rgba(255,215,170,0.55)';
  ctx.fillText('ADI', 3, 3);
  ctx.fillStyle = '#2b1206';
  ctx.fillText('ADI', 0, 0);
  ctx.restore();
  return canvas;
}

/** The fired slug. Centred on its middle, axis along +Y (tip at +Y). */
export function createSlug() {
  const length = 2.1;
  const radius = 0.42;
  const geometry = new THREE.LatheGeometry(
    profile(length, (y) => {
      const t = y / length;
      if (t < 0.02) return radius * (0.9 + t * 5);
      if (t < 0.55) return radius;
      const n = (t - 0.55) / 0.45;
      return radius * Math.sqrt(Math.max(0, 1 - n * n * n * 0.98 - n * 0.02)) * (1 - n * 0.2);
    }),
    96,
  );
  geometry.translate(0, -length / 2, 0);

  const material = new THREE.MeshStandardMaterial({ color: '#c9c0b4', metalness: 0.9, roughness: 0.36, envMapIntensity: 0.55 });
  const mesh = new THREE.Mesh(geometry, material);
  let texture: THREE.CanvasTexture | null = null;

  return {
    mesh,
    length,
    engrave(font: string, anisotropy: number) {
      const canvas = engraving(font);
      texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = anisotropy;
      material.map = texture;
      material.bumpMap = texture;
      material.bumpScale = 1.5;
      material.needsUpdate = true;
    },
    dispose() {
      geometry.dispose();
      material.dispose();
      texture?.dispose();
    },
  };
}
