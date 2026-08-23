import { Texture, type OGLRenderingContext } from 'ogl';

/** Loads an image URL into an OGL Texture. */
export function loadTexture(gl: OGLRenderingContext, src: string): Texture {
  const texture = new Texture(gl, { generateMipmaps: false });
  const image = new Image();
  image.crossOrigin = 'anonymous';
  image.onload = () => {
    texture.image = image;
  };
  image.src = src;
  return texture;
}

/**
 * Draws a flat accent-color field to a canvas and uploads it as a
 * texture. Lets the grid render meaningfully before real journal imagery
 * is wired up — swap `JournalItem.src` in _lib/constants.ts once assets
 * exist and this path is skipped automatically.
 */
export function createPlaceholderTexture(gl: OGLRenderingContext, color: string): Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 384;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = color;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  return new Texture(gl, { image: canvas, generateMipmaps: false });
}
