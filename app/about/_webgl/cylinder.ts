import * as THREE from 'three';

export const CHAMBER_RADIUS = 0.58;
const DEPTH = 1.5;

/**
 * A six-chamber revolver cylinder in brushed, engraved brass.
 * Returns an outer group (for placement/tilt) and an inner `spin` group
 * that turns one chamber (60°) at a time.
 */
export function createCylinder() {
  const group = new THREE.Group();
  const spin = new THREE.Group();
  group.add(spin);

  // Outline with six fluted grooves between the chambers.
  const shape = new THREE.Shape();
  const steps = 240;
  for (let i = 0; i <= steps; i++) {
    const th = (i / steps) * Math.PI * 2;
    const flute = Math.pow(Math.max(0, Math.cos(6 * (th - Math.PI / 2 - Math.PI / 6))), 10);
    const r = 1 - 0.085 * flute;
    const x = Math.cos(th) * r;
    const y = Math.sin(th) * r;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  for (let k = 0; k < 6; k++) {
    const th = Math.PI / 2 + (k * Math.PI) / 3;
    const hole = new THREE.Path();
    hole.absarc(Math.cos(th) * CHAMBER_RADIUS, Math.sin(th) * CHAMBER_RADIUS, 0.235, 0, Math.PI * 2, true);
    shape.holes.push(hole);
  }
  const pin = new THREE.Path();
  pin.absarc(0, 0, 0.07, 0, Math.PI * 2, true);
  shape.holes.push(pin);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: DEPTH,
    bevelEnabled: true,
    bevelThickness: 0.035,
    bevelSize: 0.03,
    bevelSegments: 4,
    curveSegments: 64,
  });
  geometry.translate(0, 0, -DEPTH / 2);
  geometry.computeVertexNormals();

  const brass = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#b8904f'),
    metalness: 1,
    roughness: 0.34,
    envMapIntensity: 1,
    transparent: true,
  });
  spin.add(new THREE.Mesh(geometry, brass));

  // Darkness down each bore.
  const boreMat = new THREE.MeshBasicMaterial({ color: '#000000', transparent: true });
  const boreGeo = new THREE.CircleGeometry(0.236, 48);
  for (let k = 0; k < 6; k++) {
    const th = Math.PI / 2 + (k * Math.PI) / 3;
    const bore = new THREE.Mesh(boreGeo, boreMat);
    bore.position.set(Math.cos(th) * CHAMBER_RADIUS, Math.sin(th) * CHAMBER_RADIUS, -DEPTH / 2 + 0.25);
    spin.add(bore);
  }

  // Engraved rings on the face.
  const engraveMat = new THREE.MeshStandardMaterial({ color: '#3a2a14', metalness: 0.6, roughness: 0.6, transparent: true });
  const faceZ = DEPTH / 2 + 0.036;
  for (const radius of [0.93, 0.88, 0.3]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.0065, 6, 160), engraveMat);
    ring.position.z = faceZ;
    spin.add(ring);
  }

  // Centre pin.
  const pinMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.068, 0.068, DEPTH + 0.3, 32),
    new THREE.MeshStandardMaterial({ color: '#d9b77a', metalness: 1, roughness: 0.22, transparent: true }),
  );
  pinMesh.rotation.x = Math.PI / 2;
  spin.add(pinMesh);

  const materials = [brass, boreMat, engraveMat, pinMesh.material as THREE.MeshStandardMaterial];
  const setOpacity = (o: number) => {
    for (const m of materials) m.opacity = o;
    group.visible = o > 0.002;
  };

  const dispose = () => {
    group.traverse((obj) => {
      if (obj instanceof THREE.Mesh) obj.geometry.dispose();
    });
    materials.forEach((m) => m.dispose());
  };

  return { group, spin, setOpacity, dispose };
}
