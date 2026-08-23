import { CELL_HEIGHT, CELL_WIDTH, CLICK_DRAG_THRESHOLD, PAN } from '../_lib/constants';
import type { Vec2 } from '../_lib/types';

const ARROW_KEYS: Record<string, Vec2> = {
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  ArrowUp: { x: 0, y: 1 },
  ArrowDown: { x: 0, y: -1 },
};

/**
 * Unifies pointer drag, wheel, and keyboard arrows into a single target
 * position with inertia. `target` is what the camera chases (see
 * CameraRig) — this class owns the "raw" input side only.
 *
 * Once all input stops and residual inertia has decayed below a small
 * threshold, `target` snaps to the nearest grid cell so the view always
 * comes to rest with a card centered — CameraRig's existing damped
 * follow (at a gentler lambda while `isSettling`) turns that snap into a
 * smooth, gradual glide rather than a jump.
 */
export class PanController {
  /** Raw accumulated pan target, in world units. */
  target: Vec2 = { x: 0, y: 0 };
  private velocity: Vec2 = { x: 0, y: 0 };

  private dragging = false;
  private lastPointer: Vec2 = { x: 0, y: 0 };
  private dragDistance = 0;

  private keysDown = new Set<string>();

  /** True once coasting has finished and `target` has snapped to a cell —
   *  cleared the instant fresh input arrives. */
  private settling = false;

  private el: HTMLElement;
  private onPointerDown = (e: PointerEvent) => {
    this.dragging = true;
    this.settling = false;
    this.dragDistance = 0;
    this.lastPointer = { x: e.clientX, y: e.clientY };
    this.velocity = { x: 0, y: 0 };
    this.el.setPointerCapture(e.pointerId);
  };

  private onPointerMove = (e: PointerEvent) => {
    if (!this.dragging) return;
    const dx = e.clientX - this.lastPointer.x;
    const dy = e.clientY - this.lastPointer.y;
    this.lastPointer = { x: e.clientX, y: e.clientY };
    this.dragDistance += Math.hypot(dx, dy);

    // Screen space -> world space: drag right moves the *view* right,
    // which means the camera (and therefore the pan target) moves left,
    // and screen-down maps to world +Y since Y is flipped between the two.
    const worldDx = -dx * PAN.dragSensitivity * 0.01;
    const worldDy = dy * PAN.dragSensitivity * 0.01;

    this.target.x += worldDx;
    this.target.y += worldDy;
    this.velocity.x = worldDx;
    this.velocity.y = worldDy;
  };

  private endDrag = () => {
    this.dragging = false;
  };

  private onWheel = (e: WheelEvent) => {
    e.preventDefault();
    this.settling = false;
    const dx = e.deltaX * PAN.wheelSensitivity;
    const dy = -e.deltaY * PAN.wheelSensitivity;
    this.target.x += dx;
    this.target.y += dy;
    this.velocity.x += dx;
    this.velocity.y += dy;
  };

  private onKeyDown = (e: KeyboardEvent) => {
    if (e.key in ARROW_KEYS) {
      e.preventDefault();
      this.settling = false;
      this.keysDown.add(e.key);
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keysDown.delete(e.key);
  };

  constructor(el: HTMLElement) {
    this.el = el;
    el.addEventListener('pointerdown', this.onPointerDown);
    el.addEventListener('pointermove', this.onPointerMove);
    el.addEventListener('pointerup', this.endDrag);
    el.addEventListener('pointercancel', this.endDrag);
    el.addEventListener('wheel', this.onWheel, { passive: false });
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  /** True if the pointer moved far enough that the gesture in progress
   *  should be treated as a drag/pan rather than a click on a plane. */
  get isDragGesture() {
    return this.dragDistance > CLICK_DRAG_THRESHOLD;
  }

  get isDragging() {
    return this.dragging;
  }

  /** True once the target has snapped to rest on a cell — CameraRig uses
   *  this to ease in more gently for the final approach to center. */
  get isSettling() {
    return this.settling;
  }

  update(dt: number) {
    for (const key of this.keysDown) {
      const dir = ARROW_KEYS[key]!;
      this.target.x += dir.x * PAN.keySpeed * dt;
      this.target.y += dir.y * PAN.keySpeed * dt;
    }

    if (this.dragging) return;

    // Inertia: once the pointer is released, coast on the last velocity
    // and exponentially decay it (framerate-independent).
    const decay = Math.exp(-PAN.friction * dt);
    this.velocity.x *= decay;
    this.velocity.y *= decay;
    this.target.x += this.velocity.x;
    this.target.y += this.velocity.y;

    // Once coasting has all but stopped and no key is actively driving
    // movement, snap the target onto the nearest cell center so the view
    // always settles with a card in the middle, never at an arbitrary
    // offset. CameraRig's damped follow smooths this into a glide.
    const speed = Math.hypot(this.velocity.x, this.velocity.y);
    if (speed < PAN.snapVelocityEpsilon && this.keysDown.size === 0) {
      this.target.x = Math.round(this.target.x / CELL_WIDTH) * CELL_WIDTH;
      this.target.y = Math.round(this.target.y / CELL_HEIGHT) * CELL_HEIGHT;
      this.velocity.x = 0;
      this.velocity.y = 0;
      this.settling = true;
    }
  }

  dispose() {
    this.el.removeEventListener('pointerdown', this.onPointerDown);
    this.el.removeEventListener('pointermove', this.onPointerMove);
    this.el.removeEventListener('pointerup', this.endDrag);
    this.el.removeEventListener('pointercancel', this.endDrag);
    this.el.removeEventListener('wheel', this.onWheel);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }
}
