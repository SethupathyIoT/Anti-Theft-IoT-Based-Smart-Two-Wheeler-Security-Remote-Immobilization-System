import * as THREE from 'three';

/**
 * Canvas-generated maps for the city scene. Everything is authored at runtime so the
 * hero stays a single 3D asset download — no texture packs to ship or CDN to trust.
 */

/** Deterministic PRNG so the skyline looks identical on every reload. */
export function makeRandom(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function createCanvas(width: number, height: number) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return { canvas, ctx: canvas.getContext('2d')! };
}

function finish(canvas: HTMLCanvasElement, repeat: [number, number], srgb: boolean) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeat[0], repeat[1]);
  texture.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  texture.anisotropy = 8;
  return texture;
}

/** Wet-asphalt colour + roughness pair: gravel speckle over a dark base. */
export function createAsphaltMaps(repeat: [number, number] = [8, 8]) {
  const size = 512;
  const color = createCanvas(size, size);
  const rough = createCanvas(size, size);
  const rand = makeRandom(1337);

  color.ctx.fillStyle = '#14161c';
  color.ctx.fillRect(0, 0, size, size);
  rough.ctx.fillStyle = '#8a8a8a';
  rough.ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 26000; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = rand() * 1.6 + 0.2;
    const shade = 24 + rand() * 42;
    color.ctx.fillStyle = `rgba(${shade},${shade + 2},${shade + 6},${0.35 + rand() * 0.4})`;
    color.ctx.beginPath();
    color.ctx.arc(x, y, r, 0, Math.PI * 2);
    color.ctx.fill();

    const wet = 90 + rand() * 130;
    rough.ctx.fillStyle = `rgba(${wet},${wet},${wet},0.5)`;
    rough.ctx.beginPath();
    rough.ctx.arc(x, y, r * 2.4, 0, Math.PI * 2);
    rough.ctx.fill();
  }

  // Broad damp patches so reflections break up instead of mirroring uniformly.
  for (let i = 0; i < 24; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 40 + rand() * 120;
    const gradient = rough.ctx.createRadialGradient(x, y, 0, x, y, r);
    gradient.addColorStop(0, 'rgba(30,30,30,0.55)');
    gradient.addColorStop(1, 'rgba(30,30,30,0)');
    rough.ctx.fillStyle = gradient;
    rough.ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  return {
    map: finish(color.canvas, repeat, true),
    roughnessMap: finish(rough.canvas, repeat, false),
  };
}

/** Poured-concrete sidewalk with expansion joints. */
export function createConcreteMap(repeat: [number, number] = [6, 2]) {
  const size = 512;
  const { canvas, ctx } = createCanvas(size, size);
  const rand = makeRandom(48);

  ctx.fillStyle = '#2a2e36';
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 12000; i++) {
    const shade = 34 + rand() * 30;
    ctx.fillStyle = `rgba(${shade},${shade + 2},${shade + 6},${rand() * 0.5})`;
    ctx.fillRect(rand() * size, rand() * size, 2, 2);
  }

  ctx.strokeStyle = 'rgba(12,14,18,0.85)';
  ctx.lineWidth = 3;
  for (let i = 0; i <= 4; i++) {
    const p = (i / 4) * size;
    ctx.beginPath();
    ctx.moveTo(p, 0);
    ctx.lineTo(p, size);
    ctx.moveTo(0, p);
    ctx.lineTo(size, p);
    ctx.stroke();
  }

  return finish(canvas, repeat, true);
}

interface FacadeOptions {
  columns: number;
  rows: number;
  seed: number;
  /** Fraction of windows with the lights on. */
  litRatio?: number;
}

/**
 * Building facade: a dark cladding grid plus a matching emissive map so lit windows
 * glow through bloom while the wall itself stays unlit.
 */
export function createFacadeMaps({ columns, rows, seed, litRatio = 0.55 }: FacadeOptions) {
  const cell = 32;
  const width = columns * cell;
  const height = rows * cell;
  const color = createCanvas(width, height);
  const emissive = createCanvas(width, height);
  const rand = makeRandom(seed);

  color.ctx.fillStyle = '#0d1017';
  color.ctx.fillRect(0, 0, width, height);
  emissive.ctx.fillStyle = '#000000';
  emissive.ctx.fillRect(0, 0, width, height);

  // Cladding panel variation.
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < columns; x++) {
      const shade = 12 + rand() * 10;
      color.ctx.fillStyle = `rgb(${shade},${shade + 2},${shade + 6})`;
      color.ctx.fillRect(x * cell, y * cell, cell, cell);
    }
  }

  const palette = ['#ffd9a0', '#ffe9c4', '#bcd8ff', '#8fb6ff', '#fff3d6'];
  const pad = 6;
  const w = cell - pad * 2;
  const h = cell - pad * 2 - 4;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < columns; x++) {
      const px = x * cell + pad;
      const py = y * cell + pad + 2;
      const lit = rand() < litRatio;

      color.ctx.fillStyle = lit ? '#2b3446' : '#0a0d13';
      color.ctx.fillRect(px, py, w, h);

      if (!lit) continue;

      const tint = palette[Math.floor(rand() * palette.length)];
      const brightness = 0.45 + rand() * 0.55;
      emissive.ctx.globalAlpha = brightness;
      emissive.ctx.fillStyle = tint;
      emissive.ctx.fillRect(px, py, w, h);

      // Occasional blown-out pane reads as an interior light source.
      if (rand() > 0.88) {
        emissive.ctx.globalAlpha = brightness * 0.35;
        emissive.ctx.fillRect(px - 3, py - 3, w + 6, h + 6);
      }
      emissive.ctx.globalAlpha = 1;
    }
  }

  // Floor slab shadow lines break up the grid.
  color.ctx.fillStyle = 'rgba(0,0,0,0.5)';
  for (let y = 0; y < rows; y++) {
    color.ctx.fillRect(0, y * cell + cell - 3, width, 3);
  }

  return {
    map: finish(color.canvas, [1, 1], true),
    emissiveMap: finish(emissive.canvas, [1, 1], true),
  };
}

/** Vertical night gradient: light-polluted haze at the horizon into deep sky above. */
export function createSkyGradient() {
  const { canvas, ctx } = createCanvas(4, 256);
  const gradient = ctx.createLinearGradient(0, 0, 0, 256);
  gradient.addColorStop(0, '#01030a');
  gradient.addColorStop(0.55, '#070d1c');
  gradient.addColorStop(0.82, '#122038');
  gradient.addColorStop(1, '#1f3358');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 4, 256);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** Soft radial falloff used for lamp glows and headlight pools. */
export function createGlowMap() {
  const size = 256;
  const { canvas, ctx } = createCanvas(size, size);
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.35, 'rgba(255,255,255,0.35)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
