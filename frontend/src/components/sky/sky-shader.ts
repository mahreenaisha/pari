import { Skia } from '@shopify/react-native-skia';

/**
 * Procedural daylight sky: a deep blue upper sky meeting a soft cloud bank that
 * rises to the right, matching the listening-orb reference. Coordinates are
 * normalised to the orb so the look is resolution independent.
 *
 * uCenter / uRadius  orb geometry in canvas pixels
 * uTime              seconds; advance faster to make clouds drift quicker
 * uEnergy            0 calm → 1 active (rim light, brighter clouds)
 */
const source = /* glsl */ `
uniform float2 uCenter;
uniform float uRadius;
uniform float uTime;
uniform float uEnergy;

const float3 SKY_DEEP = float3(0.275, 0.459, 0.925);
const float3 SKY_HORIZON = float3(0.345, 0.533, 0.953);
const float3 CLOUD = float3(0.918, 0.941, 1.0);
const float3 HAZE = float3(0.714, 0.784, 0.976);
const float3 RIM = float3(0.62, 0.74, 1.0);

float hash(float2 p) {
  float3 p3 = fract(float3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float noise(float2 p) {
  float2 i = floor(p);
  float2 f = fract(p);
  float2 u = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + float2(1.0, 0.0));
  float c = hash(i + float2(0.0, 1.0));
  float d = hash(i + float2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(float2 p) {
  float2x2 octave = float2x2(1.6, 1.2, -1.2, 1.6);
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 5; i++) {
    value += amplitude * noise(p);
    p = octave * p;
    amplitude *= 0.5;
  }
  return value;
}

half4 main(float2 pos) {
  float2 uv = (pos - uCenter) / uRadius;
  float t = uTime;

  float2 along = float2(0.92, -0.39);
  float2 across = float2(0.39, 0.92);
  float depth = dot(uv, across) + 0.1 - 0.06 * uv.x * uv.x;

  float2 p = float2(dot(uv, along) * 1.7 - t * 0.045, depth * 3.4);
  float warp = fbm(p * 0.6 + float2(t * 0.02, -t * 0.013));
  float n = fbm(p + float2(warp * 1.4, warp * 0.8));

  float edge = depth + (n - 0.5) * 0.62;
  float cover = smoothstep(-0.2, 0.24, edge);

  float3 sky = mix(SKY_DEEP, SKY_HORIZON, smoothstep(-1.1, 0.05, depth));
  float3 cloud = mix(CLOUD, HAZE, smoothstep(0.08, 1.25, depth));
  cloud *= 0.965 + 0.07 * n;
  float3 color = mix(sky, cloud, cover);

  float radial = length(uv);
  color += RIM * smoothstep(0.62, 1.0, radial) * uEnergy * 0.16;
  color = mix(color, float3(1.0), cover * uEnergy * 0.05);
  color *= 1.0 - 0.05 * smoothstep(0.84, 1.0, radial);

  color += (hash(pos + fract(t) * 61.0) - 0.5) / 255.0;
  return half4(half3(color), 1.0);
}
`;

const effect = Skia.RuntimeEffect.Make(source);

if (!effect) {
  throw new Error('Sky shader failed to compile');
}

export const skyEffect = effect;
