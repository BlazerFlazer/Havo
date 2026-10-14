// Builds an equirectangular mask texture from Natural Earth data bundled in
// the `world-atlas` package (no remote assets). Channels:
//   R = land, G = Uzbekistan, B = country borders.
// The texture maps directly onto THREE.SphereGeometry UVs.

import { CanvasTexture, LinearFilter, LinearMipmapLinearFilter, NoColorSpace } from 'three';
import { geoEquirectangular, geoPath } from 'd3-geo';
import { feature, mesh } from 'topojson-client';
import countries from 'world-atlas/countries-110m.json';

const UZBEKISTAN_ID = '860'; // ISO 3166-1 numeric

export function createEarthMaskTexture(width = 2048) {
  const height = width / 2;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const projection = geoEquirectangular()
    .scale(width / (2 * Math.PI))
    .translate([width / 2, height / 2]);
  const path = geoPath(projection, ctx);

  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, width, height);
  // Additive compositing keeps the three channels independent.
  ctx.globalCompositeOperation = 'lighter';

  ctx.fillStyle = 'rgb(255,0,0)';
  ctx.beginPath();
  path(feature(countries, countries.objects.land));
  ctx.fill();

  const uzbekistan = feature(countries, countries.objects.countries).features.find((f) => f.id === UZBEKISTAN_ID);
  if (uzbekistan) {
    ctx.fillStyle = 'rgb(0,255,0)';
    ctx.beginPath();
    path(uzbekistan);
    ctx.fill();
  }

  ctx.strokeStyle = 'rgb(0,0,255)';
  ctx.lineWidth = Math.max(1, width / 1500);
  ctx.beginPath();
  path(mesh(countries, countries.objects.countries, (a, b) => a !== b));
  ctx.stroke();

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = NoColorSpace; // data texture, not colour
  texture.minFilter = LinearMipmapLinearFilter;
  texture.magFilter = LinearFilter;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Converts latitude/longitude (degrees) to a point on a unit sphere using the
 * same convention as THREE.SphereGeometry's UV mapping.
 */
export function latLonToVector(lat, lon, radius = 1) {
  const phi = ((lon + 180) / 360) * Math.PI * 2;
  const theta = ((90 - lat) / 180) * Math.PI;
  return [
    -radius * Math.cos(phi) * Math.sin(theta),
    radius * Math.cos(theta),
    radius * Math.sin(phi) * Math.sin(theta),
  ];
}

export const TASHKENT = { lat: 41.2995, lon: 69.2401 };
