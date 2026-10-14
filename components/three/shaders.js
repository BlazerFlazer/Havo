// GLSL for the hero globe. Colours are authored directly in display (sRGB)
// space; the shaders intentionally skip three.js tone-mapping/colour-space
// chunks so the palette matches the CSS design tokens.

// 3D simplex noise — Ian McEwan, Ashima Arts (MIT licence).
const NOISE = /* glsl */ `
vec3 mod289(vec3 x){ return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x){ return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x){ return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v){
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
            i.z + vec4(0.0, i1.z, i2.z, 1.0))
          + i.y + vec4(0.0, i1.y, i2.y, 1.0))
          + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

// Fractal noise in roughly [-1, 1]. OCTAVES is injected as a define so weaker
// devices can use fewer octaves.
float fbm(vec3 p){
  float f = 0.0;
  float a = 0.5;
  for (int i = 0; i < OCTAVES; i++) {
    f += a * snoise(p);
    p = p * 2.03 + vec3(1.7, 9.2, 3.1);
    a *= 0.5;
  }
  return f;
}
`;

const SURFACE_VERTEX = /* glsl */ `
varying vec2 vUv;
varying vec3 vPosObj;
varying vec3 vNormalW;
varying vec3 vViewDirW;

void main() {
  vUv = uv;
  vPosObj = position;
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vNormalW = normalize(mat3(modelMatrix) * normal);
  vViewDirW = normalize(cameraPosition - worldPos.xyz);
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

export const earthShader = {
  vertexShader: SURFACE_VERTEX,
  fragmentShader: /* glsl */ `
uniform sampler2D uMask;   // r: land, g: Uzbekistan, b: borders
uniform float uMaskReady;
uniform float uTime;
uniform float uClean;      // 0 = hazy atmosphere, 1 = clean
uniform vec3 uSunDir;

varying vec2 vUv;
varying vec3 vPosObj;
varying vec3 vNormalW;
varying vec3 vViewDirW;

${NOISE}

void main() {
  vec3 n = normalize(vNormalW);
  vec3 v = normalize(vViewDirW);
  vec3 sun = normalize(uSunDir);

  vec4 mask = texture2D(uMask, vUv);
  // Until the geographic mask is ready, fall back to procedural continents.
  float proceduralLand = smoothstep(0.08, 0.22, fbm(vPosObj * 1.4));
  float land = mix(proceduralLand, mask.r, uMaskReady);
  float uz = mask.g * uMaskReady;
  float border = mask.b * uMaskReady;

  float n1 = fbm(vPosObj * 2.4) * 0.5 + 0.5;
  float n2 = fbm(vPosObj * 9.0 + 4.0) * 0.5 + 0.5;
  float lat = abs(vPosObj.y);

  vec3 ocean = mix(vec3(0.014, 0.06, 0.05), vec3(0.03, 0.115, 0.09), smoothstep(0.3, 0.85, n1));
  vec3 landCol = mix(vec3(0.12, 0.27, 0.18), vec3(0.24, 0.42, 0.25), smoothstep(0.3, 0.8, n1));
  landCol *= 0.92 + 0.16 * n2; // fine relief, kept subtle
  // Drier belts in the subtropics/mid-latitudes: a stylised hint of deserts.
  float aridBand = smoothstep(0.24, 0.4, lat) * (1.0 - smoothstep(0.64, 0.76, lat));
  landCol = mix(landCol, vec3(0.46, 0.44, 0.31), aridBand * smoothstep(0.42, 0.68, n1) * 0.55);
  float ice = smoothstep(0.9, 0.97, lat + (n2 - 0.5) * 0.06);

  vec3 col = mix(ocean, landCol, land);
  col = mix(col, vec3(0.58, 0.66, 0.62), ice);

  vec3 lime = vec3(0.722, 0.953, 0.42);
  col = mix(col, lime * 0.92, uz * 0.88);

  float ndl = dot(n, sun);
  float day = smoothstep(-0.2, 0.55, ndl);
  vec3 lit = col * (0.14 + 1.08 * day);

  // Soft specular glint on water.
  vec3 h = normalize(sun + v);
  float spec = pow(max(dot(n, h), 0.0), 48.0) * (1.0 - land) * day;
  lit += vec3(0.62, 0.86, 0.72) * spec * 0.32;

  lit += vec3(0.55, 0.80, 0.62) * border * 0.16 * (0.3 + day);

  // Uzbekistan keeps a gentle glow even on the night side.
  float pulse = 0.5 + 0.5 * sin(uTime * 1.6);
  lit += lime * uz * (0.16 + 0.12 * pulse);

  // Atmospheric rim inside the disc: dusty amber when hazy, green-cyan when clean.
  float fres = pow(1.0 - max(dot(n, v), 0.0), 3.2);
  vec3 hazeCol = vec3(0.80, 0.56, 0.30);
  vec3 clearCol = vec3(0.45, 0.88, 0.66);
  lit = mix(lit, mix(hazeCol, clearCol, uClean), fres * (0.18 + 0.34 * day));

  // A thin brownish veil over the planet while the air is "polluted".
  lit = mix(lit, hazeCol * (0.12 + 0.3 * day), (1.0 - uClean) * 0.26);

  gl_FragColor = vec4(lit, 1.0);
}
`,
};

export const cloudShader = {
  vertexShader: SURFACE_VERTEX,
  fragmentShader: /* glsl */ `
uniform float uTime;
uniform float uClean;
uniform vec3 uSunDir;

varying vec2 vUv;
varying vec3 vPosObj;
varying vec3 vNormalW;
varying vec3 vViewDirW;

${NOISE}

void main() {
  vec3 p = vPosObj * 2.3 + vec3(uTime * 0.012, 0.0, uTime * 0.008);
  float c = fbm(p) * 0.5 + 0.5;
  float detail = fbm(p * 2.6 + 10.0) * 0.5 + 0.5;
  float cloud = smoothstep(0.54, 0.78, c) * (0.55 + 0.45 * detail);

  vec3 n = normalize(vNormalW);
  float day = smoothstep(-0.15, 0.6, dot(n, normalize(uSunDir)));
  vec3 dusty = vec3(0.84, 0.70, 0.50);
  vec3 white = vec3(0.92, 0.97, 0.94);
  vec3 col = mix(dusty, white, uClean) * (0.22 + 0.86 * day);

  float fres = pow(1.0 - max(dot(n, normalize(vViewDirW)), 0.0), 2.0);
  float alpha = cloud * (0.55 - 0.3 * fres) * mix(0.75, 0.5, uClean) * (0.3 + 0.7 * day);
  gl_FragColor = vec4(col, alpha);
}
`,
};

export const atmosphereShader = {
  vertexShader: /* glsl */ `
varying vec3 vNormalV;
varying vec3 vPosV;
varying vec3 vNormalW;
void main() {
  vNormalV = normalize(normalMatrix * normal);
  vNormalW = normalize(mat3(modelMatrix) * normal);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vPosV = mv.xyz;
  gl_Position = projectionMatrix * mv;
}
`,
  fragmentShader: /* glsl */ `
uniform float uClean;
uniform float uEdge;     // |dot| at the planet's silhouette for this shell radius
uniform vec3 uSunDir;
varying vec3 vNormalV;
varying vec3 vPosV;
varying vec3 vNormalW;
void main() {
  // Rendered on the back faces of a larger shell: brightest next to the planet,
  // fading to zero at the outer edge of the shell.
  float d = -dot(normalize(vNormalV), normalize(-vPosV));
  float glow = pow(clamp(d / uEdge, 0.0, 1.0), 2.6);
  float lit = 0.25 + 0.75 * smoothstep(-0.35, 0.6, dot(normalize(vNormalW), normalize(uSunDir)));
  vec3 haze = vec3(0.86, 0.58, 0.28);
  vec3 clear = vec3(0.36, 0.80, 0.56);
  vec3 col = mix(haze, clear, uClean);
  gl_FragColor = vec4(col * glow * lit * 0.62, 1.0);
}
`,
};

export const hazeShader = {
  vertexShader: /* glsl */ `
uniform float uTime;
uniform float uClean;
uniform float uSize;
uniform float uPixelRatio;
attribute vec3 aRand;
varying float vAlpha;
varying float vMix;

void main() {
  vec3 dir = normalize(position);
  float baseR = length(position);

  // Slow drift around the planet.
  float ang = uTime * (0.012 + aRand.y * 0.03);
  float c = cos(ang);
  float s = sin(ang);
  dir = vec3(dir.x * c - dir.z * s, dir.y, dir.x * s + dir.z * c);

  // Each particle disperses at a slightly different moment.
  float k = clamp(uClean * (1.2 + aRand.x * 0.5) - aRand.z * 0.2, 0.0, 1.0);
  float disperse = k * k * (3.0 - 2.0 * k);
  float r = baseR + disperse * (0.8 + aRand.x * 2.4);

  vec3 wobble = vec3(
    sin(uTime * 0.4 + aRand.z * 12.0),
    cos(uTime * 0.33 + aRand.x * 9.0),
    sin(uTime * 0.27 + aRand.y * 7.0)
  ) * 0.014;

  vec4 mv = modelViewMatrix * vec4(dir * r + wobble, 1.0);
  gl_Position = projectionMatrix * mv;

  float size = uSize * (0.45 + aRand.x * 1.1) * mix(1.0, 0.5, disperse);
  gl_PointSize = size * uPixelRatio * (8.0 / -mv.z);

  float hazeAlpha = 0.28 + 0.42 * aRand.y;
  // A few particles turn into faint green "clean air" sparkles.
  float sparkle = step(0.82, aRand.z) * 0.55 * (1.0 - 0.5 * disperse);
  vAlpha = mix(hazeAlpha, sparkle, disperse);
  vMix = disperse;
}
`,
  fragmentShader: /* glsl */ `
uniform vec3 uHazeColor;
uniform vec3 uCleanColor;
varying float vAlpha;
varying float vMix;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d);
  a *= a;
  gl_FragColor = vec4(mix(uHazeColor, uCleanColor, vMix), a * vAlpha);
}
`,
};

export const dustShader = {
  vertexShader: /* glsl */ `
uniform float uTime;
uniform float uSize;
uniform float uPixelRatio;
attribute vec2 aRand;
varying float vAlpha;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = min(uSize * (0.5 + aRand.x) * uPixelRatio * (6.0 / -mv.z), 5.0 * uPixelRatio);
  float twinkle = 0.65 + 0.35 * sin(uTime * (0.6 + aRand.y * 1.4) + aRand.x * 40.0);
  vAlpha = (0.18 + 0.5 * aRand.y) * twinkle;
}
`,
  fragmentShader: /* glsl */ `
uniform vec3 uColor;
varying float vAlpha;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.05, d);
  gl_FragColor = vec4(uColor, a * vAlpha);
}
`,
};
