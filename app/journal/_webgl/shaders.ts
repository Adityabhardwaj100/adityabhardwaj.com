/**
 * Single double-sided plane shader. Front/back textures are selected in
 * the fragment shader via `gl_FrontFacing`, so a 180deg Y rotation
 * naturally reveals the "back" face without swapping geometry or
 * maintaining two meshes per grid item.
 */

export const vertex = /* glsl */ `#version 300 es
  in vec3 position;
  in vec2 uv;

  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;

  out vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const fragment = /* glsl */ `#version 300 es
  precision highp float;

  uniform sampler2D tFront;
  uniform sampler2D tBack;
  // UV-space sample offset. 0 = fully sharp. Used to soften every other
  // card while one is focused, without a full-scene post-processing pass.
  uniform float uBlur;

  in vec2 vUv;
  out vec4 fragColor;

  vec4 sampleTex(sampler2D tex, vec2 uv) {
    if (uBlur <= 0.0) return texture(tex, uv);

    // 9-tap box blur, weighted toward the center sample.
    vec4 sum = texture(tex, uv) * 4.0;
    sum += texture(tex, uv + vec2(uBlur, 0.0)) * 2.0;
    sum += texture(tex, uv - vec2(uBlur, 0.0)) * 2.0;
    sum += texture(tex, uv + vec2(0.0, uBlur)) * 2.0;
    sum += texture(tex, uv - vec2(0.0, uBlur)) * 2.0;
    sum += texture(tex, uv + vec2(uBlur, uBlur));
    sum += texture(tex, uv + vec2(-uBlur, uBlur));
    sum += texture(tex, uv + vec2(uBlur, -uBlur));
    sum += texture(tex, uv + vec2(-uBlur, -uBlur));
    return sum / 16.0;
  }

  void main() {
    // Back face UVs are mirrored on X so text/images read correctly
    // instead of appearing flipped once the plane has rotated 180deg.
    vec2 uv = gl_FrontFacing ? vUv : vec2(1.0 - vUv.x, vUv.y);
    fragColor = gl_FrontFacing ? sampleTex(tFront, uv) : sampleTex(tBack, uv);
  }
`;
