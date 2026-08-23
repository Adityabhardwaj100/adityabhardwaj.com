import type { Camera } from 'ogl';
import { damp } from '../_lib/math';
import { LIGHTBOX, PAN } from '../_lib/constants';
import type { Vec2 } from '../_lib/types';

/**
 * Smooths the camera toward a target position. In "free" mode the target
 * is PanController's raw input target (drag/wheel/keys + inertia). In
 * "focused" mode the target is a fixed snapshot of the clicked plane's
 * world position, so the camera glides to center on it (Lightbox view).
 */
export class CameraRig {
  private camera: Camera;
  private focused = false;
  private focusTarget: Vec2 = { x: 0, y: 0 };

  constructor(camera: Camera) {
    this.camera = camera;
  }

  focusOn(worldPos: Vec2) {
    this.focused = true;
    this.focusTarget = { ...worldPos };
  }

  release(panTarget: Vec2) {
    this.focused = false;
    // Resume free panning from exactly where the camera currently is,
    // so exiting the lightbox never causes a jump.
    panTarget.x = this.camera.position.x;
    panTarget.y = this.camera.position.y;
  }

  get isFocused() {
    return this.focused;
  }

  update(dt: number, panTarget: Vec2, isSettling: boolean) {
    const target = this.focused ? this.focusTarget : panTarget;
    const lambda = this.focused ? LIGHTBOX.followLambda : isSettling ? PAN.settleLambda : PAN.followLambda;
    this.camera.position.x = damp(this.camera.position.x, target.x, lambda, dt);
    this.camera.position.y = damp(this.camera.position.y, target.y, lambda, dt);
  }
}
