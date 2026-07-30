import * as THREE from 'three';

export const CINEMATIC_DURATION = 30;

export interface CameraKeyframe {
  t: number;
  position: [number, number, number];
  lookAt: [number, number, number];
  fov: number;
}

export const CAMERA_KEYFRAMES: CameraKeyframe[] = [
  { t: 0, position: [0, 2.2, 16], lookAt: [0, 0.2, 0], fov: 48 },
  { t: 3, position: [9, 3.5, 10], lookAt: [0, 0.3, 0], fov: 44 },
  { t: 6, position: [6, 1.2, 5], lookAt: [0, 0.2, 0], fov: 40 },
  { t: 9, position: [-7, 2, 7], lookAt: [0, 0.4, 0], fov: 42 },
  { t: 12, position: [-3, 0.15, 4.5], lookAt: [0, 0.5, 0], fov: 36 },
  { t: 15, position: [0, 5.5, 6], lookAt: [0, 0, 0], fov: 52 },
  { t: 18, position: [10, 1.8, 2.5], lookAt: [0, 0.2, 0], fov: 38 },
  { t: 21, position: [-10, 1.8, 2.5], lookAt: [0, 0.2, 0], fov: 38 },
  { t: 24, position: [0, 0.6, 3.8], lookAt: [0, 0.6, 0], fov: 34 },
  { t: 27, position: [4, 1.5, 8], lookAt: [0, 0.3, 0], fov: 42 },
  { t: 30, position: [0, 2.2, 16], lookAt: [0, 0.2, 0], fov: 48 },
];

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function getCameraAtTime(elapsed: number): {
  position: THREE.Vector3;
  lookAt: THREE.Vector3;
  fov: number;
  phase: number;
} {
  const t = ((elapsed % CINEMATIC_DURATION) + CINEMATIC_DURATION) % CINEMATIC_DURATION;

  let i = 0;
  while (i < CAMERA_KEYFRAMES.length - 1 && CAMERA_KEYFRAMES[i + 1].t <= t) i++;

  const current = CAMERA_KEYFRAMES[i];
  const next = CAMERA_KEYFRAMES[Math.min(i + 1, CAMERA_KEYFRAMES.length - 1)];
  const segmentDuration = next.t - current.t || 1;
  const rawAlpha = (t - current.t) / segmentDuration;
  const alpha = easeInOutCubic(Math.min(1, Math.max(0, rawAlpha)));

  const position = new THREE.Vector3(
    lerp(current.position[0], next.position[0], alpha),
    lerp(current.position[1], next.position[1], alpha),
    lerp(current.position[2], next.position[2], alpha)
  );

  const lookAt = new THREE.Vector3(
    lerp(current.lookAt[0], next.lookAt[0], alpha),
    lerp(current.lookAt[1], next.lookAt[1], alpha),
    lerp(current.lookAt[2], next.lookAt[2], alpha)
  );

  const fov = lerp(current.fov, next.fov, alpha);
  const phase = t / CINEMATIC_DURATION;

  return { position, lookAt, fov, phase };
}

export function getBikeRotation(elapsed: number): number {
  const t = elapsed % CINEMATIC_DURATION;
  const base = (t / CINEMATIC_DURATION) * Math.PI * 2;
  const wobble = Math.sin(t * 0.7) * 0.06;
  return base + wobble;
}

export function getBikeFloat(elapsed: number): number {
  return Math.sin(elapsed * 1.1) * 0.08 + Math.sin(elapsed * 2.3) * 0.03;
}
