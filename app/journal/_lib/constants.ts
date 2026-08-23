import type { JournalItem } from './types';

/** Plane dimensions in world units — 3x4 aspect ratio as specified. */
export const ITEM_WIDTH = 3;
export const ITEM_HEIGHT = 4;

/** Gap between planes, in world units. */
export const GAP_X = 0.7;
export const GAP_Y = 0.9;

export const CELL_WIDTH = ITEM_WIDTH + GAP_X;
export const CELL_HEIGHT = ITEM_HEIGHT + GAP_Y;

/** Extra rings of planes rendered past the visible viewport so the
 *  wrap boundary never becomes visible, even during fast inertia. */
export const BUFFER_RINGS = 2;

export const CAMERA = {
  fov: 45,
  near: 0.1,
  far: 100,
  distance: 9,
};

export const PAN = {
  /** 1:1 drag responsiveness. */
  dragSensitivity: 1,
  wheelSensitivity: 0.0025,
  keySpeed: 6,
  /** Exponential velocity decay per second once input stops (inertia). */
  friction: 3.2,
  /** Easing speed of the smoothed camera chasing the raw target while
   *  actively dragging/scrolling/holding a key (kept snappy, near 1:1). */
  followLambda: 9,
  /** Gentler easing speed used once input has stopped and the target has
   *  snapped to the nearest cell — makes the final approach to center
   *  read as a deliberate, gradual settle rather than an abrupt catch-up. */
  settleLambda: 4,
  /** Below this residual inertia speed (world units/frame), coasting is
   *  considered finished and the pan target snaps to the nearest cell. */
  snapVelocityEpsilon: 0.0015,
};

export const LIGHTBOX = {
  /** How far the clicked plane pushes toward the camera on Z. */
  zOffset: 1.6,
  followLambda: 5,
  flipLambda: 6,
};

/**
 * "Inside a sphere" cursor effect: every plane tilts to orient toward the
 * cursor's world position, more so the further it is from the cursor —
 * planes right under the cursor stay flat, planes further away curve
 * away, like tangents on the inside of a sphere focused on the pointer.
 * Disabled (eased back to flat) while any card is focused.
 */
export const TILT = {
  /** Radians of tilt per world unit of distance from the cursor, before clamping. */
  sensitivity: 0.11,
  /** Hard cap on tilt so far-away planes don't over-rotate. */
  maxAngle: 0.62,
  /** Easing speed for chasing the cursor / relaxing back to flat. */
  lambda: 7,
};

/** Background-card blur shown while a card is focused, so the open card
 *  reads as the clear subject and everything else recedes. */
export const BACKGROUND_BLUR = {
  /** Blur sample offset in UV units — small, since it applies per-plane. */
  amount: 0.006,
  lambda: 5,
};

/** A pointer must move at least this many pixels to count as a drag
 *  rather than a click (used to disambiguate raycasted selection). */
export const CLICK_DRAG_THRESHOLD = 6;

/** Charcoal placeholder background — used for every card until real
 *  imagery (JournalItem.src) is wired up. */
const PLACEHOLDER_COLOR = '#2a2a28';

const GLOBALIZATION_BODY = `Good Morning !

This is the start of a new day and i just woke up.

Plugged in the kettle for boiling water to drink tea and played Seeds of Growth by Malte Marten | Handpan meditation music in the background.

The weather outside is rainy but it's a good feeling because it was quite hot for some days and the wind is also cold, probably rained already somewhere.

I'm sitting at my sofa and let's start writing /discussing as to what's upcoming!

All right so It's 2026 right now and I believe in 2028 US elections Donald Trump will again become the president of USA.

The American Empire is declining and in the last decades of it's fall.

In order to shift from Pax Americana to Pax Judaica Mr. Trump will initiate a full fledged war in Iran and of course there will be a war in that gulf region.

Now America is like the first domino of the global economy collapse when it falls the effect will be seen on China, Russia, Europe but I also believe that China won't let America to complete crash instead save it only till they have full control.

But the game will be played in such a way that the control will be given to Israel and the shield of the David will now protect everyone.

So that's that's what's upcoming in the near future let's say starting from 2030 and probably consuming the whole decade for restructuring.

How To Survive ?

Techno - Feudalism will replace capitalism and the new lords will be the tech giants who control these assets

1. Massive Energy Infrastructure

2. Compute and Semiconductors

3. Sovereign Infrastructure (The Network State)

4. Orbital and Global Logistics

5. Physical Effectors (Robotics)

The people at the top of the pyramid will own the AI, the energy that powers it, the robots that enforce it, and the land it operates on. The rest of humanity will likely be users, renters, and consumers within those privately owned, trillion-dollar ecosystems.

I would like to end by saying that craft your own story as to how you can start accumulating these assets and what strategy you'll incorporate ?
Can tell in the comments as well !

Have a good day and we'll see each other in the next morning session :)`;

export const JOURNAL_ITEMS: JournalItem[] = [
  {
    id: '01',
    title: 'Globalization',
    date: '2024.01',
    color: PLACEHOLDER_COLOR,
    src: '/journal/globalization.jpg',
    body: GLOBALIZATION_BODY,
  },
  { id: '02', title: 'Access Denied', date: '2024.02', color: PLACEHOLDER_COLOR, src: '/journal/access-denied.jpg' },
  { id: '03', title: 'Medication', date: '2024.03', color: PLACEHOLDER_COLOR, src: '/journal/medication.jpg' },
  { id: '04', title: 'Skull Music', date: '2024.04', color: PLACEHOLDER_COLOR, src: '/journal/skull-music.jpg' },
  { id: '05', title: 'The Matrix', date: '2024.05', color: PLACEHOLDER_COLOR, src: '/journal/the-matrix.jpg' },
  { id: '06', title: 'Screen Time', date: '2024.06', color: PLACEHOLDER_COLOR, src: '/journal/screen-time.jpg' },
  { id: '07', title: 'Fake News', date: '2024.07', color: PLACEHOLDER_COLOR, src: '/journal/fake-news.jpg' },
  { id: '08', title: 'Rooftop', date: '2024.08', color: PLACEHOLDER_COLOR },
  { id: '09', title: 'Static', date: '2024.09', color: PLACEHOLDER_COLOR },
  { id: '10', title: 'Glasshouse', date: '2024.10', color: PLACEHOLDER_COLOR },
  { id: '11', title: 'Afterimage', date: '2024.11', color: PLACEHOLDER_COLOR },
  { id: '12', title: 'Quiet Hour', date: '2024.12', color: PLACEHOLDER_COLOR },
];
