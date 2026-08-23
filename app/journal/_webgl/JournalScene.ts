import { Camera, Raycast, Renderer, Transform, Vec3 } from 'ogl';
import { InfiniteGrid } from './InfiniteGrid';
import { PanController } from './PanController';
import { CameraRig } from './CameraRig';
import { CAMERA, ITEM_HEIGHT, ITEM_WIDTH } from '../_lib/constants';
import type { Vec2 } from '../_lib/types';
import type { GridItem } from './GridItem';

export interface FocusRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface FocusedCardState {
  rect: FocusRect;
  /** 0 = showing front face, 1 = fully flipped to the back. */
  flipProgress: number;
}

/**
 * Owns the full OGL scene graph and render loop for the Art Journal
 * canvas: renderer/camera setup, the infinite grid, unified input,
 * camera easing, and click-to-focus (lightbox) raycasting.
 *
 * This is framework-agnostic — GLCanvas.tsx is the thin React wrapper
 * that mounts/unmounts it against a <canvas> element.
 */
export class JournalScene {
  private canvas: HTMLCanvasElement;
  private renderer: Renderer;
  private camera: Camera;
  private scene: Transform;
  private grid: InfiniteGrid;
  private pan: PanController;
  private cameraRig: CameraRig;
  private raycast = new Raycast();

  private focusedItem: GridItem | null = null;
  private rafId = 0;
  private lastTime = 0;
  private disposed = false;

  /** Pointer position in NDC (-1..1), tracked continuously — drives the
   *  cursor-tracking tilt effect (see GridItem.update / TILT constants). */
  private pointerNDC: Vec2 = { x: 0, y: 0 };

  onFocusChange: (item: GridItem | null) => void = () => {};

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;

    this.renderer = new Renderer({ canvas, alpha: true, dpr: Math.min(window.devicePixelRatio || 1, 2) });
    this.renderer.gl.clearColor(0, 0, 0, 0);

    this.camera = new Camera(this.renderer.gl, { fov: CAMERA.fov, near: CAMERA.near, far: CAMERA.far });
    this.camera.position.z = CAMERA.distance;

    this.scene = new Transform();
    this.grid = new InfiniteGrid(this.renderer.gl, this.scene);

    this.pan = new PanController(canvas);
    this.cameraRig = new CameraRig(this.camera);

    canvas.addEventListener('pointerup', this.onPointerUp);
    canvas.addEventListener('pointermove', this.onPointerMoveTrack);
    window.addEventListener('keydown', this.onKeyDown);

    this.resize(window.innerWidth, window.innerHeight);
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  /** World-space viewport size at the z=0 plane, given the current fov
   *  and camera distance — used to size the plane pool so it always
   *  covers the screen (see InfiniteGrid.resize). */
  private visibleSize() {
    const fovRad = (CAMERA.fov * Math.PI) / 180;
    const height = 2 * Math.tan(fovRad / 2) * this.camera.position.z;
    const width = height * (this.canvas.clientWidth / this.canvas.clientHeight || 1);
    return { width, height };
  }

  resize(width: number, height: number) {
    this.renderer.setSize(width, height);
    this.camera.perspective({ aspect: width / height });
    const { width: vw, height: vh } = this.visibleSize();
    this.grid.resize(vw, vh);
  }

  private onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && this.focusedItem) this.exitFocus();
  };

  private onPointerMoveTrack = (e: PointerEvent) => {
    const rect = this.canvas.getBoundingClientRect();
    this.pointerNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointerNDC.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
  };

  private onPointerUp = (e: PointerEvent) => {
    if (this.pan.isDragGesture) return; // was a pan, not a click

    const rect = this.canvas.getBoundingClientRect();
    const ndcX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ndcY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

    this.raycast.castMouse(this.camera, [ndcX, ndcY]);
    const hits = this.raycast.intersectBounds(this.grid.meshes);
    const hit = hits[0];
    const gridItem = hit ? this.grid.findByMesh(hit) : undefined;

    if (gridItem) this.enterFocus(gridItem);
    else if (this.focusedItem) this.exitFocus();
  };

  private enterFocus(item: GridItem) {
    if (this.focusedItem === item) return;
    this.grid.clearFocus(item);
    item.setFocused(true);
    this.focusedItem = item;
    this.cameraRig.focusOn({ x: item.mesh.position.x, y: item.mesh.position.y });
    this.onFocusChange(item);
  }

  /** Public so the DOM overlay's close button can drive it directly. */
  exitFocus() {
    if (!this.focusedItem) return;
    this.focusedItem.setFocused(false);
    this.focusedItem = null;
    this.cameraRig.release(this.pan.target);
    this.onFocusChange(null);
  }

  /**
   * Live screen-space rect + flip progress of the focused plane, for the
   * DOM article panel to track exactly — including through the
   * flip/push-forward animation and window resizes. Returns null when
   * nothing is focused.
   */
  getFocusedCardState(): FocusedCardState | null {
    const item = this.focusedItem;
    if (!item) return null;

    const hw = ITEM_WIDTH / 2;
    const hh = ITEM_HEIGHT / 2;
    const corners = [
      new Vec3(-hw, -hh, 0),
      new Vec3(hw, -hh, 0),
      new Vec3(hw, hh, 0),
      new Vec3(-hw, hh, 0),
    ];

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;

    for (const corner of corners) {
      corner.applyMatrix4(item.mesh.worldMatrix);
      this.camera.project(corner); // mutates corner into NDC (-1..1)
      const x = (corner.x * 0.5 + 0.5) * width;
      const y = (1 - (corner.y * 0.5 + 0.5)) * height;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }

    return {
      rect: { left: minX, top: minY, width: maxX - minX, height: maxY - minY },
      flipProgress: item.flipProgress,
    };
  }

  private loop = (time: number) => {
    if (this.disposed) return;
    this.rafId = requestAnimationFrame(this.loop);

    const dt = Math.min((time - this.lastTime) / 1000, 1 / 30);
    this.lastTime = time;

    if (!this.cameraRig.isFocused) this.pan.update(dt);
    this.cameraRig.update(dt, this.pan.target, this.pan.isSettling);

    const { width: vw, height: vh } = this.visibleSize();
    const cursorWorld: Vec2 = {
      x: this.camera.position.x + this.pointerNDC.x * (vw / 2),
      y: this.camera.position.y + this.pointerNDC.y * (vh / 2),
    };
    this.grid.update(dt, this.camera.position.x, this.camera.position.y, cursorWorld, !!this.focusedItem);

    this.renderer.render({ scene: this.scene, camera: this.camera });
  };

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.rafId);
    this.canvas.removeEventListener('pointerup', this.onPointerUp);
    this.canvas.removeEventListener('pointermove', this.onPointerMoveTrack);
    window.removeEventListener('keydown', this.onKeyDown);
    this.pan.dispose();
    this.grid.dispose();
  }
}
