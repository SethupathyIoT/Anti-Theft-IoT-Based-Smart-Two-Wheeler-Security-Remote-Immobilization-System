export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function getBikeBaseRotation(elapsed: number): number {
  return elapsed * 0.12;
}

export function getBikeFloat(elapsed: number): number {
  return Math.sin(elapsed * 0.9) * 0.1 + Math.sin(elapsed * 1.7) * 0.04;
}
