import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { COUNT, KEY, PORTRAIT_H, PORTRAIT_W, buildShapes, samplePortrait, type Shape } from './shapes';
import { CHAMBER_RADIUS, createCylinder } from './cylinder';

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

const portraitFragment = /* glsl */ `
  precision highp float;
  uniform sampler2D uMap;
  uniform float uOpacity;
  varying vec2 vUv;
  void main() {
    vec3 c = texture2D(uMap, vUv).rgb;
    float edge = smoothstep(0.0, 0.18, vUv.x) * smoothstep(0.0, 0.18, 1.0 - vUv.x)
               * smoothstep(0.0, 0.25, vUv.y) * (1.0 - smoothstep(0.66, 0.76, vUv.y));
    // Put the sky out, keep the hat: dim bright pixels in the top of the frame.
    float lum = dot(c, vec3(0.3, 0.59, 0.11));
    c *= 1.0 - smoothstep(0.35, 0.7, lum) * smoothstep(0.48, 0.6, vUv.y);
    // Warm the right edge, as if lit by a fire off-frame.
    c += vec3(0.3, 0.12, 0.02) * smoothstep(0.55, 1.0, vUv.x) * c;
    gl_FragColor = vec4(c * 1.15, edge * uOpacity);
  }
`;

const portraitVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/** Camera per key: [x, y, z, lookY]. */
const CAMERA: [number, number, number, number][] = [
  [0, 0, 10, 0], // future
  [0.5, 0.2, 9.4, 0], // chaos
  [-0.4, 0.3, 9, 0.2], // lattice
  [0, 0.4, 10, 0], // network
  [0, 0, 9, 0], // gear
  [0.2, 0.1, 7.6, 0], // cylinder
  [0, 0, 8.2, 0], // portrait
  [0.3, -0.2, 9.5, 0], // knot
  [0, 0, 9, 0], // ring
  [0, 0.3, 11, 0], // haze
  [0, 1.4, 9.6, -0.5], // foundation
  [0, 0.1, 7.5, 0.1], // flame
];

const ease = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
/** 1 at `center`, falling to 0 at ±`width`. */
const near = (k: number, center: number, width: number) => clamp01(1 - Math.abs(k - center) / width);

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
  private cylinder = createCylinder();
  private portrait: THREE.ShaderMaterial;
  private portraitTex: THREE.Texture;
  private forge: THREE.PointLight;

  private key = 0;
  private segment = -1;
  private chamber = 0;
  private spinAngle = 0;
  private spinVel = 0;
  private pointer = new THREE.Vector2();
  private pointerSmooth = new THREE.Vector2();
  private camPos = new THREE.Vector3(0, 0, 10);
  private lookY = 0;
  private gearTime = 0;
  private lastTime = 0;
  private width = 1;
  private height = 1;
  private idle: number;
  /** Pull the camera back on tall, narrow screens so every formation fits. */
  private fit = 1;

  /** Fires once the portrait has been sampled (so the whole story is ready). */
  onReady?: () => void;

  constructor(canvas: HTMLCanvasElement, opts: { reducedMotion: boolean }) {
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

    // The brass cylinder.
    this.scene.add(this.cylinder.group);
    this.cylinder.setOpacity(0);

    // The photograph, faintly under the particle portrait.
    this.portraitTex = new THREE.TextureLoader().load('/about-portrait.jpg');
    this.portraitTex.colorSpace = THREE.SRGBColorSpace;
    this.portrait = new THREE.ShaderMaterial({
      vertexShader: portraitVertex,
      fragmentShader: portraitFragment,
      uniforms: { uMap: { value: this.portraitTex }, uOpacity: { value: 0 } },
      transparent: true,
      depthWrite: false,
    });
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(PORTRAIT_W, PORTRAIT_H), this.portrait);
    plane.position.z = -0.1;
    this.scene.add(plane);

    const img = new Image();
    img.onload = () => {
      samplePortrait(img, this.shapes[KEY.portrait]!);
      this.segment = -1; // re-upload in case we're already on the portrait
      this.onReady?.();
    };
    img.onerror = () => this.onReady?.();
    img.src = '/about-portrait.jpg';

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.55, 0.45, 0.5);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());
  }

  resize(width: number, height: number) {
    this.width = width;
    this.height = height;
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

  /** Continuous position in the story: 0 = future … 11 = flame. */
  setKey(key: number) {
    this.key = Math.min(Math.max(key, 0), this.shapes.length - 1);
  }

  /** Which chamber (0–5) sits under the hammer. */
  setChamber(chamber: number) {
    this.chamber = chamber;
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

    // The portrait is drawn in bone white, not brass; the photo surfaces beneath it.
    const portraitW = near(k, KEY.portrait, 0.75);
    u.uMono!.value = ease(portraitW);
    this.portrait.uniforms.uOpacity!.value = ease(clamp01((portraitW - 0.5) / 0.5)) * 0.9;

    // The cylinder: present for the origin, then we push into a chamber.
    const cyl = this.cylinder;
    const inW = clamp01((k - (KEY.cylinder - 0.7)) / 0.6);
    const push = ease(clamp01(k - KEY.cylinder));
    const fadeOut = 1 - clamp01((push - 0.55) / 0.3);
    cyl.setOpacity(k < KEY.cylinder ? ease(inW) : fadeOut);
    u.uOpacity!.value = 1 - 0.75 * near(k, KEY.cylinder, 0.8) * (1 - push);

    // Chamber spring: a weighted snap with a little overshoot.
    const target = -this.chamber * (Math.PI / 3);
    this.spinVel += (target - this.spinAngle) * 160 * dt;
    this.spinVel *= Math.exp(-14 * dt);
    this.spinAngle += this.spinVel * dt;
    cyl.spin.rotation.z = this.idle ? this.spinAngle : target;

    const scale = 1.35;
    cyl.group.scale.setScalar(scale);
    cyl.group.rotation.set(-0.28 * (1 - push), 0.42 * (1 - push), 0);
    cyl.group.position.set(0, -CHAMBER_RADIUS * scale * push, 6.2 * push);

    // Light and atmosphere.
    this.forge.intensity = 14 * (0.9 + 0.1 * Math.sin(time * 7.3) * Math.sin(time * 3.1) * this.idle);
    this.embers.uniforms.uTime!.value = time * (this.idle || 0.0001);
    this.embers.uniforms.uOpacity!.value = 0.65 * (1 - 0.8 * portraitW) * (1 - 0.6 * near(k, KEY.haze, 1));
    this.bloom.strength = 0.5 + 0.35 * near(k, KEY.haze, 1) + 0.3 * near(k, KEY.flame, 1);

    // Camera: glide between per-key positions, with a touch of hand-held parallax.
    const i = Math.min(Math.floor(k), CAMERA.length - 2);
    const f = ease(k - i);
    const a = CAMERA[i]!;
    const b = CAMERA[i + 1]!;
    this.pointerSmooth.lerp(this.pointer, 1 - Math.pow(0.02, dt));
    const par = 0.35 * this.idle;
    this.camPos.set(
      a[0] + (b[0] - a[0]) * f + this.pointerSmooth.x * par,
      a[1] + (b[1] - a[1]) * f + this.pointerSmooth.y * par * 0.6,
      (a[2] + (b[2] - a[2]) * f) * this.fit,
    );
    this.lookY = a[3] + (b[3] - a[3]) * f;
    this.camera.position.copy(this.camPos);
    this.camera.lookAt(0, this.lookY, 0);

    this.composer.render(dt);
  }

  dispose() {
    this.geometry.dispose();
    this.emberGeo.dispose();
    this.particles.dispose();
    this.embers.dispose();
    this.portrait.dispose();
    this.portraitTex.dispose();
    this.cylinder.dispose();
    this.scene.environment?.dispose();
    this.composer.dispose();
    this.renderer.dispose();
  }
}
