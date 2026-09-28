import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { COUNT, KEY, buildShapes, type Shape } from './shapes';
import { CHAMBER_RADIUS, DEPTH, createCylinder } from './cylinder';
import { createCartridge, createSlug } from './bullets';
import { POSTER_HOLE, POSTER_Z, createPoster, drawPoster, type PosterFonts } from './poster';

const particleVertex = /* glsl */ `
  attribute vec3 aFrom;
  attribute vec3 aTo;
  attribute float aBrightFrom;
  attribute float aBrightTo;
  attribute vec4 aRand;
  uniform float uMix;
  uniform float uTime;
  uniform float uScale;
  uniform float uSpin;
  uniform float uIdle;
  varying float vBright;
  varying float vHeat;

  void main() {
    // Each particle leaves on its own beat, so formations dissolve rather than slide.
    float delay = aRand.x * 0.4;
    float m = smoothstep(delay, delay + 0.6, uMix);
    vec3 p = mix(aFrom, aTo, m);
    // Mid-flight, particles loosen into smoke.
    float flight = sin(m * 3.14159);
    p += (aRand.yzw - 0.5) * flight * 1.8;
    // Breathing.
    float t = uTime * 0.5;
    p += vec3(sin(t + aRand.x * 40.0), cos(t * 0.8 + aRand.y * 40.0), sin(t * 0.6 + aRand.z * 40.0)) * 0.018 * uIdle;
    // Gear spin (INOX).
    float c = cos(uSpin), s = sin(uSpin);
    p.xy = mat2(c, s, -s, c) * p.xy;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    vBright = mix(aBrightFrom, aBrightTo, m) * (1.0 - flight * 0.35);
    vHeat = aRand.y;
    gl_PointSize = min(uScale * (0.02 + aRand.w * 0.022) / -mv.z, 14.0);
  }
`;

const particleFragment = /* glsl */ `
  precision highp float;
  uniform float uMono;
  uniform float uOpacity;
  varying float vBright;
  varying float vHeat;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    vec3 brass = vec3(0.85, 0.62, 0.34);
    vec3 forge = vec3(1.0, 0.45, 0.14);
    vec3 bone = vec3(0.93, 0.9, 0.84);
    vec3 col = mix(brass, forge, smoothstep(0.72, 1.0, vHeat));
    col = mix(col, bone, uMono);
    gl_FragColor = vec4(col * vBright, a * uOpacity * 0.5);
  }
`;

const emberVertex = /* glsl */ `
  attribute vec4 aRand;
  uniform float uTime;
  uniform float uScale;
  varying float vLife;
  void main() {
    float life = fract(aRand.x + uTime * (0.02 + aRand.y * 0.04));
    vLife = life;
    vec3 p = vec3(
      (aRand.z - 0.5) * 14.0 + sin(uTime * 0.4 + aRand.w * 20.0) * 0.4,
      life * 10.0 - 5.0,
      (aRand.w - 0.5) * 8.0 - 1.0
    );
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = min(uScale * (0.016 + aRand.y * 0.026) * (1.0 - life * 0.5) / -mv.z, 10.0);
  }
`;

const emberFragment = /* glsl */ `
  precision highp float;
  uniform float uOpacity;
  varying float vLife;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d) * smoothstep(0.0, 0.1, vLife) * (1.0 - smoothstep(0.5, 1.0, vLife));
    vec3 col = mix(vec3(1.0, 0.5, 0.16), vec3(0.45, 0.42, 0.38), smoothstep(0.2, 0.9, vLife));
    gl_FragColor = vec4(col * 1.4, a * uOpacity);
  }
`;

/** The hammer falls just after the story reaches the cylinder's last line. */
export const FIRE_KEY = KEY.cylinder + 0.06;
/** The bullet goes through the poster. */
export const IMPACT_KEY = KEY.shot + 0.62;

/** Camera per key: [x, y, z, lookY, lookZ]. */
const CAMERA: [number, number, number, number, number][] = [
  [0, 0, 10, 0, 0], // future
  [0.5, 0.2, 9.4, 0, 0], // chaos
  [-0.4, 0.3, 9, 0.2, 0], // lattice
  [0, 0.4, 10, 0, 0], // network
  [0, 0, 9, 0, 0], // gear
  [0.2, 0.1, 7.6, 0, 0], // cylinder
  [0, 0.25, 7.4, 0, 0], // shot — bullet-time
  [0.15, -0.1, POSTER_Z + 8.4, 0, POSTER_Z], // wanted
  [0.3, -0.2, 9.5, 0, 0], // knot
  [0, 0, 9, 0, 0], // ring
  [0, 0.3, 11, 0, 0], // haze
  [0, 1.4, 9.6, -0.5, 0], // foundation
  [0, 0.1, 7.5, 0.1, 0], // flame
];

const ease = (t: number) => t * t * (3 - 2 * t);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
/** 1 at `center`, falling to 0 at ±`width`. */
const near = (k: number, center: number, width: number) => clamp01(1 - Math.abs(k - center) / width);

const SEAT_Z = DEPTH / 2 + 0.04;

/** A muzzle-flash starburst: hot core, ragged spikes. */
function starburst() {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const c = size / 2;
  const core = ctx.createRadialGradient(c, c, 0, c, c, c * 0.5);
  core.addColorStop(0, 'rgba(255,255,255,1)');
  core.addColorStop(0.3, 'rgba(255,210,150,0.9)');
  core.addColorStop(1, 'rgba(255,120,40,0)');
  ctx.fillStyle = core;
  ctx.fillRect(0, 0, size, size);
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 11; i++) {
    const a = (i / 11) * Math.PI * 2 + (i % 2) * 0.2;
    const len = c * (i % 3 === 0 ? 0.98 : 0.6);
    const g = ctx.createLinearGradient(c, c, c + Math.cos(a) * len, c + Math.sin(a) * len);
    g.addColorStop(0, 'rgba(255,230,190,0.9)');
    g.addColorStop(1, 'rgba(255,120,40,0)');
    ctx.strokeStyle = g;
    ctx.lineWidth = i % 3 === 0 ? 7 : 4;
    ctx.beginPath();
    ctx.moveTo(c, c);
    ctx.lineTo(c + Math.cos(a) * len, c + Math.sin(a) * len);
    ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export class AboutStage {
  private renderer: THREE.WebGLRenderer;
  private composer: EffectComposer;
  private bloom: UnrealBloomPass;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);

  private shapes: Shape[] = buildShapes();
  private geometry = new THREE.BufferGeometry();
  private particles: THREE.ShaderMaterial;
  private embers: THREE.ShaderMaterial;
  private emberGeo = new THREE.BufferGeometry();
  private forge: THREE.PointLight;

  private cylinder = createCylinder();
  private cartridges = Array.from({ length: 6 }, () => createCartridge());
  private flash: THREE.Sprite;
  private flashLight = new THREE.PointLight('#ffb266', 0, 12, 2);
  private slug = createSlug();
  private bullet = new THREE.Group();
  private bulletSpin = new THREE.Group();
  private poster = createPoster();
  private posterLight = new THREE.PointLight('#ffb070', 0, 14, 2);
  private impactLight = new THREE.PointLight('#ffcf99', 0, 8, 2);

  private key = 0;
  private lastKey = 0;
  private load = 0;
  private segment = -1;
  private chamber = 0;
  private spinAngle = 0;
  private spinVel = 0;
  private impactTime = -1;
  private pointer = new THREE.Vector2();
  private pointerSmooth = new THREE.Vector2();
  private gearTime = 0;
  private lastTime = 0;
  private idle: number;
  /** Pull the camera back on tall, narrow screens so every formation fits. */
  private fit = 1;
  private tmp = new THREE.Vector3();

  /** Fires once the poster and the engraved round are painted (so the whole story is ready). */
  onReady?: () => void;

  constructor(canvas: HTMLCanvasElement, opts: { reducedMotion: boolean; fonts: PosterFonts }) {
    this.idle = opts.reducedMotion ? 0 : 1;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    // The composer's linear buffer is cleared with the *sRGB-encoded* clear colour, and
    // OutputPass then tone-maps and encodes again; these values land on coal (#0b0b0a).
    this.renderer.setClearColor(new THREE.Color().setRGB(0.0115, 0.0115, 0.0105, THREE.SRGBColorSpace));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.75;
    pmrem.dispose();

    // One hot light from off-frame right, one cold rim from behind-left.
    this.forge = new THREE.PointLight('#ff7a30', 14, 30, 2);
    this.forge.position.set(3.5, 1.2, 3.5);
    const rim = new THREE.DirectionalLight('#8fa4b8', 0.6);
    rim.position.set(-4, 3, -3);
    this.scene.add(this.forge, rim, new THREE.AmbientLight('#ffffff', 0.05));

    // Particles.
    const from = this.shapes[0]!;
    const rand = new Float32Array(COUNT * 4);
    for (let i = 0; i < rand.length; i++) rand[i] = Math.random();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(from.pos.slice(), 3));
    this.geometry.setAttribute('aFrom', new THREE.BufferAttribute(from.pos.slice(), 3));
    this.geometry.setAttribute('aTo', new THREE.BufferAttribute(from.pos.slice(), 3));
    this.geometry.setAttribute('aBrightFrom', new THREE.BufferAttribute(from.bright.slice(), 1));
    this.geometry.setAttribute('aBrightTo', new THREE.BufferAttribute(from.bright.slice(), 1));
    this.geometry.setAttribute('aRand', new THREE.BufferAttribute(rand, 4));
    this.geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 50);
    this.particles = new THREE.ShaderMaterial({
      vertexShader: particleVertex,
      fragmentShader: particleFragment,
      uniforms: {
        uMix: { value: 0 },
        uTime: { value: 0 },
        uScale: { value: 1 },
        uSpin: { value: 0 },
        uIdle: { value: this.idle },
        uMono: { value: 0 },
        uOpacity: { value: 1 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.scene.add(new THREE.Points(this.geometry, this.particles));

    // Embers drifting up through everything.
    const emberCount = 260;
    const emberRand = new Float32Array(emberCount * 4);
    for (let i = 0; i < emberRand.length; i++) emberRand[i] = Math.random();
    this.emberGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(emberCount * 3), 3));
    this.emberGeo.setAttribute('aRand', new THREE.BufferAttribute(emberRand, 4));
    this.emberGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 50);
    this.embers = new THREE.ShaderMaterial({
      vertexShader: emberVertex,
      fragmentShader: emberFragment,
      uniforms: { uTime: { value: 0 }, uScale: { value: 1 }, uOpacity: { value: 0.6 } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.scene.add(new THREE.Points(this.emberGeo, this.embers));

    // The brass cylinder and its six rounds, each seated in its own chamber.
    this.scene.add(this.cylinder.group);
    this.cylinder.setOpacity(0);
    this.cartridges.forEach((c) => {
      this.cylinder.spin.add(c.group);
      c.setOpacity(0);
    });

    // Muzzle flash.
    this.flash = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: starburst(),
        color: '#ffd9a8',
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    this.scene.add(this.flash, this.flashLight);

    // The round with ADI on it: yaw on the outer group, lying along +x, spinning on its own axis.
    const lying = new THREE.Group();
    lying.rotation.z = -Math.PI / 2;
    lying.add(this.bulletSpin);
    this.bulletSpin.add(this.slug.mesh);
    this.bullet.add(lying);
    this.bullet.visible = false;
    this.scene.add(this.bullet);

    // The poster on the far wall, its lamp, and the light of the hit.
    this.scene.add(this.poster.pivot, this.posterLight, this.impactLight);
    this.posterLight.position.set(1.8, 2.2, POSTER_Z + 3.4);
    this.impactLight.position.set(POSTER_HOLE[0], POSTER_HOLE[1], POSTER_Z + 0.4);
    this.poster.setOpacity(0);

    void this.prepare(opts.fonts);

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.55, 0.45, 0.5);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());
  }

  /** Paint the poster from the photograph and engrave the round, once fonts are in. */
  private async prepare(fonts: PosterFonts) {
    const anisotropy = this.renderer.capabilities.getMaxAnisotropy();
    try {
      const img = new Image();
      img.src = '/about-portrait.jpg';
      await img.decode();
      this.poster.setArtwork(await drawPoster(img, fonts), anisotropy);
      this.slug.engrave(fonts.poster, anisotropy);
    } catch {
      // The story still runs; the poster just stays blank.
    }
    this.onReady?.();
  }

  resize(width: number, height: number) {
    const dpr = Math.min(window.devicePixelRatio || 1, width < 760 ? 1.5 : 1.75);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(width, height, false);
    this.composer.setPixelRatio(dpr);
    this.composer.setSize(width, height);
    this.bloom.resolution.set(width / 2, height / 2);
    this.camera.aspect = width / height;
    this.fit = Math.max(1, 0.82 / this.camera.aspect);

    // Push the world right of the text column on wide screens, and up on phones.
    if (width >= 900) this.camera.setViewOffset(width, height, -width * 0.2, 0, width, height);
    else this.camera.setViewOffset(width, height, 0, height * 0.18, width, height);
    this.camera.updateProjectionMatrix();

    const scale = (height * dpr) / (2 * Math.tan((this.camera.fov * Math.PI) / 360));
    this.particles.uniforms.uScale!.value = scale;
    this.embers.uniforms.uScale!.value = scale;
  }

  /** Continuous position in the story: 0 = future … 12 = flame. */
  setKey(key: number) {
    this.key = Math.min(Math.max(key, 0), this.shapes.length - 1);
  }

  /** Which chamber (0–5) sits under the hammer. */
  setChamber(chamber: number) {
    this.chamber = chamber;
  }

  /** How many rounds are in, as a continuous 0→6 (a fraction is a round sliding home). */
  setLoad(load: number) {
    this.load = load;
  }

  setPointer(x: number, y: number) {
    this.pointer.set(x, y);
  }

  render(timeMs: number) {
    const time = timeMs / 1000;
    const dt = Math.min(0.05, this.lastTime ? time - this.lastTime : 0.016);
    this.lastTime = time;
    const k = this.key;

    // Morph: swap source/target formations when we cross into a new segment.
    const seg = Math.min(Math.floor(k), this.shapes.length - 2);
    if (seg !== this.segment) {
      this.segment = seg;
      const a = this.shapes[seg]!;
      const b = this.shapes[seg + 1]!;
      (this.geometry.getAttribute('aFrom') as THREE.BufferAttribute).copyArray(a.pos).needsUpdate = true;
      (this.geometry.getAttribute('aTo') as THREE.BufferAttribute).copyArray(b.pos).needsUpdate = true;
      (this.geometry.getAttribute('aBrightFrom') as THREE.BufferAttribute).copyArray(a.bright).needsUpdate = true;
      (this.geometry.getAttribute('aBrightTo') as THREE.BufferAttribute).copyArray(b.bright).needsUpdate = true;
    }
    const u = this.particles.uniforms;
    u.uMix!.value = k - seg;
    u.uTime!.value = time;

    // INOX's gear turns by itself; the spin unwinds as we leave it.
    const gearW = near(k, KEY.gear, 0.6);
    this.gearTime += dt * 0.35 * this.idle;
    u.uSpin!.value = this.gearTime * ease(gearW);

    // The vapour trail is white, not brass.
    u.uMono!.value = 0.7 * ease(near(k, KEY.shot, 0.8));

    this.renderCylinder(k, dt);
    this.renderShot(k, time);
    this.renderPoster(k, time);

    // Light and atmosphere.
    this.forge.intensity = 14 * (0.9 + 0.1 * Math.sin(time * 7.3) * Math.sin(time * 3.1) * this.idle);
    this.embers.uniforms.uTime!.value = time * (this.idle || 0.0001);
    this.embers.uniforms.uOpacity!.value =
      0.65 * (1 - 0.6 * near(k, KEY.haze, 1)) * (1 - 0.5 * near(k, KEY.shot, 1)) * (1 - 0.4 * near(k, KEY.wanted, 1));
    this.bloom.strength = 0.5 + 0.35 * near(k, KEY.haze, 1) + 0.3 * near(k, KEY.flame, 1);

    // Camera: glide between per-key positions, with a touch of hand-held parallax.
    const i = Math.min(Math.floor(k), CAMERA.length - 2);
    const f = ease(k - i);
    const a = CAMERA[i]!;
    const b = CAMERA[i + 1]!;
    const lerp = (n: number) => a[n]! + (b[n]! - a[n]!) * f;
    this.pointerSmooth.lerp(this.pointer, 1 - Math.pow(0.02, dt));
    const par = 0.35 * this.idle;
    const lookZ = lerp(4);
    this.camera.position.set(
      lerp(0) + this.pointerSmooth.x * par,
      lerp(1) + this.pointerSmooth.y * par * 0.6,
      lookZ + (lerp(2) - lookZ) * this.fit,
    );
    this.camera.lookAt(0, lerp(3), lookZ);

    this.lastKey = k;
    this.composer.render(dt);
  }

  /** Six rounds slide home one line at a time; then the hammer falls. */
  private renderCylinder(k: number, dt: number) {
    const cyl = this.cylinder;
    const fired = clamp01(k - KEY.cylinder);
    const arrive = ease(clamp01((k - (KEY.cylinder - 0.7)) / 0.6));
    const leave = 1 - clamp01((fired - 0.14) / 0.16);
    const opacity = k < KEY.cylinder ? arrive : leave;
    cyl.setOpacity(opacity);

    // Particles step back while the metal holds the stage.
    this.particles.uniforms.uOpacity!.value = 1 - 0.75 * near(k, KEY.cylinder, 0.8) * (k < KEY.cylinder ? 1 : 1 - fired);

    // Chamber spring: a weighted snap with a little overshoot.
    const target = -this.chamber * (Math.PI / 3);
    this.spinVel += (target - this.spinAngle) * 160 * dt;
    this.spinVel *= Math.exp(-14 * dt);
    this.spinAngle += this.spinVel * dt;
    cyl.spin.rotation.z = this.idle ? this.spinAngle : target;

    // Recoil: a hard kick back as the round goes, settling fast.
    const since = k >= FIRE_KEY ? fired - (FIRE_KEY - KEY.cylinder) : -1;
    const kick = since >= 0 ? Math.exp(-since * 22) : 0;
    const scale = 1.35;
    cyl.group.scale.setScalar(scale);
    cyl.group.rotation.set(-0.28 + kick * 0.12, 0.42, kick * 0.05);
    cyl.group.position.set(0, 0, -kick * 0.4 - fired * 1.2);

    // Each round: in from the front right, turning, then seated flush.
    this.cartridges.forEach((c, n) => {
      const t = clamp01((this.load - n - 0.05) / 0.4);
      const e = easeOut(t);
      const th = Math.PI / 2 + (n * Math.PI) / 3;
      c.group.position.set(
        Math.cos(th) * CHAMBER_RADIUS + (1 - e) * 1.4,
        Math.sin(th) * CHAMBER_RADIUS + (1 - e) * 0.6,
        SEAT_Z + (1 - e) * 3.6,
      );
      c.group.rotation.set((1 - e) * 0.5, (1 - e) * -0.9, 0);
      c.setOpacity(clamp01(t * 6) * opacity);
    });

    // Muzzle flash at the chamber under the hammer.
    const flash = since >= 0 && since < 0.5 ? Math.exp(-since * 18) : 0;
    this.tmp.set(0, CHAMBER_RADIUS, SEAT_Z);
    cyl.group.localToWorld(this.tmp);
    this.flash.position.copy(this.tmp);
    this.flash.scale.setScalar(0.6 + flash * 4.2);
    this.flash.material.rotation = since * 3;
    this.flash.material.opacity = flash;
    this.flash.visible = flash > 0.01;
    this.flashLight.position.copy(this.tmp);
    this.flashLight.intensity = 90 * flash;
  }

  /** Bullet-time, then the chase to the wall. */
  private renderShot(k: number, time: number) {
    const inbound = clamp01((k - KEY.cylinder - 0.15) / 0.85);
    const outbound = clamp01(k - KEY.shot);
    this.bullet.visible = k > KEY.cylinder + 0.15 && k < IMPACT_KEY;
    if (!this.bullet.visible) return;

    const drift = Math.sin(time * 0.5) * 0.04 * this.idle;
    if (k < KEY.shot) {
      // Slowing into frame from the left, unwinding its spin.
      const e = easeOut(inbound);
      this.bullet.position.set(-9 * (1 - e), 0.35 * (1 - e) + drift, 0);
      this.bullet.rotation.set(0, 0, 0);
      this.bulletSpin.rotation.y = Math.PI - (1 - e) * 6 * Math.PI;
      return;
    }

    // Turn toward the wall, then go.
    const turn = ease(clamp01(outbound / 0.22));
    const go = clamp01((outbound - 0.18) / (IMPACT_KEY - KEY.shot - 0.18));
    const s = go * go;
    this.bullet.rotation.set(0, turn * (Math.PI / 2), 0);
    this.bullet.position.set(POSTER_HOLE[0] * s, drift * (1 - s) + POSTER_HOLE[1] * s, (POSTER_Z + 1.1) * s);
    this.bulletSpin.rotation.y = Math.PI + Math.sin(time * 0.7) * 0.35 * this.idle * (1 - turn) + s * 14;
  }

  /** The WANTED poster: dark on the wall, lit by the hit, swinging on its nail. */
  private renderPoster(k: number, time: number) {
    if (this.lastKey < IMPACT_KEY && k >= IMPACT_KEY) this.impactTime = time;
    if (k < IMPACT_KEY) this.impactTime = -1;

    const hit = k >= IMPACT_KEY;
    const waiting = ease(clamp01((k - KEY.shot - 0.3) / 0.3)) * 0.35;
    const gone = 1 - clamp01((k - KEY.wanted - 0.25) / 0.35);
    const visible = (hit ? 1 : waiting) * gone;
    this.poster.setOpacity(visible);
    this.posterLight.intensity = 3 * (hit ? 1 : waiting) * gone;

    const t = this.impactTime >= 0 ? time - this.impactTime : -1;
    const swing = t >= 0 ? 0.16 * Math.exp(-t * 1.4) * Math.sin(t * 5.2) * (this.idle || 0) : 0;
    this.poster.pivot.rotation.set(0, 0, -0.025 + swing);
    this.impactLight.intensity = t >= 0 ? 18 * Math.exp(-t * 5) : 0;
  }

  dispose() {
    this.geometry.dispose();
    this.emberGeo.dispose();
    this.particles.dispose();
    this.embers.dispose();
    this.cylinder.dispose();
    this.cartridges.forEach((c) => c.dispose());
    this.flash.material.map?.dispose();
    this.flash.material.dispose();
    this.slug.dispose();
    this.poster.dispose();
    this.scene.environment?.dispose();
    this.composer.dispose();
    this.renderer.dispose();
  }
}
