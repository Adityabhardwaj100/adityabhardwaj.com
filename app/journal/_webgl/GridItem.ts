import { Mesh, Program, Plane, type OGLRenderingContext, Transform } from 'ogl';
import { vertex, fragment } from './shaders';
import { createPlaceholderTexture, loadTexture } from './textures';
import { clamp, damp, wrapCentered } from '../_lib/math';
import { BACKGROUND_BLUR, CELL_HEIGHT, CELL_WIDTH, ITEM_HEIGHT, ITEM_WIDTH, LIGHTBOX, TILT } from '../_lib/constants';
import type { JournalItem, Vec2 } from '../_lib/types';

// Keyed by gl context (not a single module-level singleton) — navigating
// away from /journal and back creates a fresh WebGL context each time,
// and a geometry's GPU buffers die with the context that created them.
// A plain shared variable would hand the new context stale buffers from
// the old one, which silently renders nothing.
const geometryCache = new WeakMap<OGLRenderingContext, Plane>();
function getGeometry(gl: OGLRenderingContext) {
  let geometry = geometryCache.get(gl);
  if (!geometry) {
    geometry = new Plane(gl, { width: ITEM_WIDTH, height: ITEM_HEIGHT });
    geometryCache.set(gl, geometry);
  }
  return geometry;
}

/**
 * One recycled plane in the pool. Each instance is assigned a fixed
 * *logical* grid cell (gridCol/gridRow) once, at construction — since
 * content is periodic, that cell never needs to change. Only its
 * *rendered* position is re-wrapped every frame based on camera
 * position; see InfiniteGrid.update() for that math.
 */
export class GridItem {
  mesh: Mesh;
  gridCol = 0;
  gridRow = 0;
  item: JournalItem;

  private program: Program;

  /** 0 = resting in the grid, 1 = fully focused (lightbox). */
  private focus = 0;
  private focusTarget = 0;

  /** Cursor-tracking tilt, in radians — the "inside a sphere" effect. */
  private tiltX = 0;
  private tiltY = 0;

  /** Per-plane texture blur amount (UV units), eased toward BACKGROUND_BLUR.amount. */
  private blur = 0;

  constructor(gl: OGLRenderingContext, scene: Transform, item: JournalItem) {
    this.item = item;

    const tFront = item.src ? loadTexture(gl, item.src) : createPlaceholderTexture(gl, item.color);
    const tBack = createPlaceholderTexture(gl, '#111111');

    this.program = new Program(gl, {
      vertex,
      fragment,
      uniforms: { tFront: { value: tFront }, tBack: { value: tBack }, uBlur: { value: 0 } },
      cullFace: false, // render both faces — the shader picks front/back per-fragment
    });

    this.mesh = new Mesh(gl, { geometry: getGeometry(gl), program: this.program });
    this.mesh.setParent(scene);
  }

  /**
   * Positions this plane for the current frame. `camera` position is used
   * to re-center the wrap window so planes crossing the boundary jump to
   * the opposite side while still offscreen.
   */
  setLogicalCell(gridCol: number, gridRow: number, camX: number, camY: number, totalWidth: number, totalHeight: number) {
    this.gridCol = gridCol;
    this.gridRow = gridRow;

    const baseX = gridCol * CELL_WIDTH;
    const baseY = gridRow * CELL_HEIGHT;

    // Core infinite-grid trick: wrap each plane's offset from the camera
    // into a centered window the size of the whole pool. The plane's
    // *logical* address never changes — only where it's drawn this frame.
    const offsetX = wrapCentered(baseX - camX, totalWidth);
    const offsetY = wrapCentered(baseY - camY, totalHeight);

    this.mesh.position.x = camX + offsetX;
    this.mesh.position.y = camY + offsetY;
  }

  setFocused(focused: boolean) {
    this.focusTarget = focused ? 1 : 0;
  }

  /** 0 = showing the front face, 1 = fully flipped to the back — lets the
   *  DOM article panel fade in/out and position itself in step with the
   *  actual WebGL flip animation. */
  get flipProgress() {
    return this.focus;
  }

  /**
   * Advances the flip/push animation, the cursor-tracking tilt, and the
   * background blur. `cursorWorld` is the pointer's projected position at
   * z=0; `anyFocused` is true whenever some card (not necessarily this
   * one) is open — tilt relaxes to flat and this plane blurs whenever
   * that's true and it isn't the focused one.
   */
  update(dt: number, cursorWorld: Vec2, anyFocused: boolean) {
    this.focus = damp(this.focus, this.focusTarget, LIGHTBOX.flipLambda, dt);

    let targetTiltX = 0;
    let targetTiltY = 0;
    if (!anyFocused) {
      const dx = cursorWorld.x - this.mesh.position.x;
      const dy = cursorWorld.y - this.mesh.position.y;
      targetTiltY = clamp(dx * TILT.sensitivity, -TILT.maxAngle, TILT.maxAngle);
      targetTiltX = clamp(-dy * TILT.sensitivity, -TILT.maxAngle, TILT.maxAngle);
    }
    this.tiltX = damp(this.tiltX, targetTiltX, TILT.lambda, dt);
    this.tiltY = damp(this.tiltY, targetTiltY, TILT.lambda, dt);

    this.mesh.position.z = this.focus * LIGHTBOX.zOffset;
    this.mesh.rotation.y = this.focus * Math.PI + this.tiltY;
    this.mesh.rotation.x = this.tiltX;

    const targetBlur = anyFocused && this.focusTarget !== 1 ? BACKGROUND_BLUR.amount : 0;
    this.blur = damp(this.blur, targetBlur, BACKGROUND_BLUR.lambda, dt);
    this.program.uniforms.uBlur.value = this.blur;
  }

  dispose() {
    this.mesh.setParent(null);
  }
}
