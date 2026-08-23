import type { Mesh, OGLRenderingContext, Transform } from 'ogl';
import { GridItem } from './GridItem';
import { BUFFER_RINGS, CELL_HEIGHT, CELL_WIDTH, JOURNAL_ITEMS } from '../_lib/constants';
import type { JournalItem, Vec2 } from '../_lib/types';

/** Repeating content tile size — content itself is periodic, so a pool
 *  slot's logical (col, row) never needs to change after creation; only
 *  its *rendered* position is re-wrapped every frame (see GridItem). */
const TILE_COLS = Math.ceil(Math.sqrt(JOURNAL_ITEMS.length));
const TILE_ROWS = Math.ceil(JOURNAL_ITEMS.length / TILE_COLS);

const mod = (n: number, m: number) => ((n % m) + m) % m;

function itemForCell(gridCol: number, gridRow: number): JournalItem {
  const tileCol = mod(gridCol, TILE_COLS);
  const tileRow = mod(gridRow, TILE_ROWS);
  const index = mod(tileRow * TILE_COLS + tileCol, JOURNAL_ITEMS.length);
  return JOURNAL_ITEMS[index]!;
}

export class InfiniteGrid {
  private gl: OGLRenderingContext;
  private scene: Transform;
  private items: GridItem[] = [];
  private byMesh = new Map<Mesh, GridItem>();
  private poolCols = 0;
  private poolRows = 0;
  totalWidth = 0;
  totalHeight = 0;

  constructor(gl: OGLRenderingContext, scene: Transform) {
    this.gl = gl;
    this.scene = scene;
  }

  /** (Re)builds the plane pool so it comfortably covers the given
   *  viewport (in world units at z=0) plus a buffer of extra rings. */
  resize(visibleWidth: number, visibleHeight: number) {
    const neededCols = Math.ceil(visibleWidth / CELL_WIDTH) + BUFFER_RINGS * 2 + 1;
    const neededRows = Math.ceil(visibleHeight / CELL_HEIGHT) + BUFFER_RINGS * 2 + 1;

    // Odd counts keep a plane exactly centered, which makes the wrap
    // window symmetric around the camera.
    const cols = neededCols % 2 === 0 ? neededCols + 1 : neededCols;
    const rows = neededRows % 2 === 0 ? neededRows + 1 : neededRows;

    if (cols === this.poolCols && rows === this.poolRows) return;

    this.items.forEach((it) => it.dispose());
    this.items = [];
    this.byMesh.clear();
    this.poolCols = cols;
    this.poolRows = rows;
    this.totalWidth = cols * CELL_WIDTH;
    this.totalHeight = rows * CELL_HEIGHT;

    const centerCol = Math.floor(cols / 2);
    const centerRow = Math.floor(rows / 2);

    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const gridCol = i - centerCol;
        const gridRow = j - centerRow;
        const item = new GridItem(this.gl, this.scene, itemForCell(gridCol, gridRow));
        item.gridCol = gridCol;
        item.gridRow = gridRow;
        this.items.push(item);
        this.byMesh.set(item.mesh, item);
      }
    }
  }

  /** Re-wraps every plane's position around the current camera and
   *  advances each plane's focus (lightbox), cursor-tilt, and blur
   *  animations. `cursorWorld` is the pointer projected to world space;
   *  `anyFocused` is true whenever some card is open. */
  update(dt: number, camX: number, camY: number, cursorWorld: Vec2, anyFocused: boolean) {
    for (const item of this.items) {
      item.setLogicalCell(item.gridCol, item.gridRow, camX, camY, this.totalWidth, this.totalHeight);
      item.update(dt, cursorWorld, anyFocused);
    }
  }

  get meshes() {
    return this.items.map((it) => it.mesh);
  }

  findByMesh(mesh: Mesh) {
    return this.byMesh.get(mesh);
  }

  clearFocus(except?: GridItem) {
    for (const item of this.items) {
      if (item !== except) item.setFocused(false);
    }
  }

  dispose() {
    this.items.forEach((it) => it.dispose());
    this.items = [];
    this.byMesh.clear();
  }
}
