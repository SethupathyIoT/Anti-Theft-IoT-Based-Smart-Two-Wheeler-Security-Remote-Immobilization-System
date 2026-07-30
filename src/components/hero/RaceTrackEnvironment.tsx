import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshReflectorMaterial } from '@react-three/drei';
import * as THREE from 'three';

const SPEED_LINE_COUNT = 80;

export const RaceTrackEnvironment: React.FC = () => {
  const gridRef = useRef<THREE.Group>(null);
  const speedLinesRef = useRef<THREE.Points>(null);
  const ringRefs = useRef<THREE.Mesh[]>([]);

  const speedLinePositions = useMemo(() => {
    const arr = new Float32Array(SPEED_LINE_COUNT * 3);
    for (let i = 0; i < SPEED_LINE_COUNT; i++) {
      const angle = (i / SPEED_LINE_COUNT) * Math.PI * 2;
      const radius = 4 + Math.random() * 8;
      arr[i * 3] = Math.cos(angle) * radius;
      arr[i * 3 + 1] = -1.2 + Math.random() * 0.5;
      arr[i * 3 + 2] = Math.sin(angle) * radius;
    }
    return arr;
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (gridRef.current) {
      gridRef.current.position.z = (t * 2.5) % 4;
    }

    if (speedLinesRef.current) {
      const positions = speedLinesRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < SPEED_LINE_COUNT; i++) {
        positions[i * 3 + 2] -= 0.12 + Math.sin(t + i) * 0.02;
        if (positions[i * 3 + 2] < -12) {
          positions[i * 3 + 2] = 12;
        }
      }
      speedLinesRef.current.geometry.attributes.position.needsUpdate = true;
    }

    ringRefs.current.forEach((ring, i) => {
      if (ring) {
        ring.rotation.z = t * (0.3 + i * 0.1);
        const scale = 1 + Math.sin(t * 1.5 + i) * 0.02;
        ring.scale.set(scale, scale, 1);
      }
    });
  });

  return (
    <group>
      {/* Reflective race floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.42, 0]}>
        <planeGeometry args={[30, 30]} />
        <MeshReflectorMaterial
          blur={[300, 100]}
          resolution={512}
          mixBlur={1}
          mixStrength={0.65}
          roughness={0.85}
          depthScale={1.2}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#030712"
          metalness={0.9}
          mirror={0.75}
        />
      </mesh>

      {/* Neon track grid */}
      <group ref={gridRef} position={[0, -1.4, 0]}>
        {Array.from({ length: 12 }).map((_, i) => (
          <mesh key={`line-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, i * 4 - 20]}>
            <planeGeometry args={[24, 0.04]} />
            <meshBasicMaterial color="#3B82F6" transparent opacity={0.25} />
          </mesh>
        ))}
        {Array.from({ length: 8 }).map((_, i) => (
          <mesh key={`cross-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[(i - 4) * 3, 0.01, 0]}>
            <planeGeometry args={[0.03, 30]} />
            <meshBasicMaterial color="#1D4ED8" transparent opacity={0.15} />
          </mesh>
        ))}
      </group>

      {/* Rotating neon rings under bike */}
      {[2.8, 3.4, 4.2].map((radius, i) => (
        <mesh
          key={`ring-${i}`}
          ref={(el) => { if (el) ringRefs.current[i] = el; }}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -1.38 + i * 0.002, 0]}
        >
          <ringGeometry args={[radius - 0.03, radius, 64]} />
          <meshBasicMaterial
            color={i === 0 ? '#60A5FA' : i === 1 ? '#3B82F6' : '#2563EB'}
            transparent
            opacity={0.35 - i * 0.08}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}

      {/* Speed streak particles */}
      <points ref={speedLinesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[speedLinePositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.06}
          color="#93C5FD"
          transparent
          opacity={0.6}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
        />
      </points>

      {/* Side neon pillars */}
      {[-8, 8].map((x) => (
        <mesh key={`pillar-${x}`} position={[x, 0, -6]}>
          <boxGeometry args={[0.08, 3, 0.08]} />
          <meshBasicMaterial color="#3B82F6" transparent opacity={0.5} />
        </mesh>
      ))}

      {/* Fog for depth */}
      <fog attach="fog" args={['#050816', 8, 22]} />
    </group>
  );
};
