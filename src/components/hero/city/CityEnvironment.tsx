import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CityStreet } from './CityStreet';
import { CityBuildings } from './CityBuildings';
import { CityProps } from './CityProps';
import { createGlowMap, createSkyGradient } from './proceduralTextures';

/** Sky dome. Unlit and unfogged, so the horizon glow stays put behind the skyline. */
const CitySky: React.FC = () => {
  const gradient = useMemo(() => createSkyGradient(), []);

  return (
    <mesh scale={[-1, 1, 1]}>
      <sphereGeometry args={[260, 32, 24]} />
      <meshBasicMaterial map={gradient} side={THREE.BackSide} fog={false} depthWrite={false} toneMapped={false} />
    </mesh>
  );
};

/** Haze billboards drifting between the buildings so the depth reads at night. */
const AtmosphericHaze: React.FC = () => {
  const glow = useMemo(() => createGlowMap(), []);
  const groupRef = useRef<THREE.Group>(null);

  const puffs = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        position: [
          -50 + (i * 100) / 14 + (i % 3) * 4,
          2.4 + (i % 4) * 1.6,
          (i % 2 === 0 ? 1 : -1) * (26 + (i % 5) * 8),
        ] as [number, number, number],
        scale: 12 + (i % 4) * 6,
        speed: 0.02 + (i % 3) * 0.012,
      })),
    []
  );

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    groupRef.current.children.forEach((child, i) => {
      const puff = puffs[i];
      child.position.x = puff.position[0] + Math.sin(t * puff.speed + i) * 6;
      child.position.y = puff.position[1] + Math.sin(t * 0.15 + i) * 0.4;
    });
  });

  return (
    <group ref={groupRef}>
      {puffs.map((puff, i) => (
        <sprite key={`haze-${i}`} position={puff.position} scale={[puff.scale, puff.scale * 0.55, 1]}>
          <spriteMaterial
            map={glow}
            color={i % 3 === 0 ? '#1d4ed8' : '#334155'}
            transparent
            opacity={0.03}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </sprite>
      ))}
    </group>
  );
};

/**
 * Scene fog. Lives at the top level of the canvas because `attach="fog"` binds to the
 * parent object — nested inside a group it would silently do nothing.
 */
export const CityFog: React.FC = () => <fogExp2 attach="fog" args={['#080d18', 0.028]} />;

/** The full street block the bike sits in: road surface, buildings, and every prop. */
export const CityEnvironment: React.FC = () => (
  <group>
    <CitySky />
    <CityStreet />
    <CityBuildings />
    <CityProps />
    <AtmosphericHaze />
  </group>
);
