import React from 'react';

/**
 * If the GLB ever fails to load, keep the rest of the hero scene alive and show a
 * neutral stand-in instead of blanking the canvas.
 */
export class BikeModelBoundary extends React.Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error('[hero] bike model failed to load', error);
  }

  render() {
    if (this.state.failed) {
      return (
        <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
          <boxGeometry args={[3.2, 1.2, 1]} />
          <meshStandardMaterial color="#1E3A8A" metalness={0.6} roughness={0.35} />
        </mesh>
      );
    }
    return this.props.children;
  }
}
