# adityabhardwaj.com

Next.js site. The Art Journal — an infinite, pannable WebGL grid built with
[OGL](https://github.com/oframe/ogl) — lives at `/journal` as one section of the site; the root
route is a placeholder home page. Deploys to Vercel with no extra config.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000 for the home page, http://localhost:3000/journal for the journal.
Drag, scroll, or use the arrow keys to pan; click a plane to flip it and center the camera on
it; click empty space or press `Escape` to exit.

### If dev/build is extremely slow on this machine

This repo lives under `~/Desktop`, which macOS syncs via iCloud Drive. iCloud's File Provider
intercepts bulk file operations (webpack scanning `node_modules`, `tsc` reading thousands of
`.d.ts` files) and can make `next dev` take minutes instead of seconds, or hang entirely on a
`mv`/`rm -rf` of `node_modules`. This isn't a code problem — it reproduces with a stock Next.js
app in the same folder.

**Permanent fix:** move the project out of `~/Desktop` or `~/Documents` (e.g. to `~/Developer/`
or `~/Projects/`), which is also where you'll want it once this becomes a real git repo anyway.
`npm install && npm run dev` there will run at normal speed with no other changes needed.

## Structure

```
app/
  layout.tsx, page.tsx, globals.css     Site shell + placeholder home page
  page.module.css
  journal/
    layout.tsx                           Full-bleed, no-scroll wrapper scoped to this route only
    page.tsx                             Mounts GLCanvas + UIOverlay
    _components/
      GLCanvas.tsx                       React wrapper that mounts/unmounts the OGL scene
      UIOverlay.tsx                      DOM overlay (header, lightbox caption, close button)
    _webgl/                              Framework-agnostic OGL layer (no React imports)
      JournalScene.ts                    Orchestrator: renderer/camera/scene, RAF loop, raycast click handling
      InfiniteGrid.ts                    Plane pool sizing + the wrap math (the core "infinite" trick)
      GridItem.ts                        One recycled plane: position wrap, flip + push-forward animation
      PanController.ts                   Drag / wheel / arrow-key input -> unified pan target + inertia
      CameraRig.ts                       Eases the camera toward the pan target, or a focused plane
      shaders.ts                         Double-sided plane shader (front/back via gl_FrontFacing)
      textures.ts                        Image loading + generated placeholder textures
    _lib/
      constants.ts                       All tunable numbers (grid size, easing speeds, journal items)
      math.ts                            lerp / damp / wrapCentered — the shared math primitives
      types.ts                           JournalItem, Vec2
```

Everything the journal needs is colocated under `app/journal/` using Next.js's `_folder`
convention (excluded from routing), so it's self-contained — add more sections later as sibling
routes under `app/` (e.g. `app/work/page.tsx`, `app/about/page.tsx`) the same way.

## How the infinite grid works

`InfiniteGrid` builds a fixed pool of planes sized to comfortably cover the viewport (plus a
buffer ring on each side) and assigns each one a **permanent logical cell** `(gridCol, gridRow)`
— it never changes after creation. Content is periodic, so a fixed cell is enough: the journal
items already repeat every `TILE_COLS x TILE_ROWS` cells (see `itemForCell` in `InfiniteGrid.ts`).

Every frame, each plane's *world position* is recomputed from its logical cell and the camera's
current position using `wrapCentered` (`_lib/math.ts`):

```ts
offsetX = wrapCentered(gridCol * CELL_WIDTH - camera.x, poolTotalWidth)
plane.x = camera.x + offsetX
```

`wrapCentered` folds that offset into `[-poolWidth/2, poolWidth/2)`. As the camera moves, a
plane's offset shrinks, crosses zero at the camera, then grows again — until it would exceed
half the pool width, at which point it wraps to the opposite edge. Because the pool always
extends past the visible viewport by a buffer ring, that wrap happens off-screen, so the
grid reads as endless in both X and Y.

## Swapping in real imagery

Edit `JOURNAL_ITEMS` in [app/journal/_lib/constants.ts](app/journal/_lib/constants.ts) — add a
`src` (image URL) to any item and it's used as the front-face texture automatically; omitting
it falls back to a generated placeholder (`_webgl/textures.ts`) so the grid always renders
something meaningful.

## Notes

- Shaders use `#version 300 es`, so this targets WebGL2 browsers (i.e. everything current).
- Tuning knobs (drag sensitivity, inertia friction, camera easing speed, lightbox push
  distance) all live in `app/journal/_lib/constants.ts`.
- `next.config.mjs` sets `webpack.resolve.symlinks = false`. That's only needed for the local
  iCloud workaround above (Next's RSC client-reference manifest breaks if the `app/` directory
  is reached through a symlink) — it's a no-op on Vercel, which never symlinks the project.
