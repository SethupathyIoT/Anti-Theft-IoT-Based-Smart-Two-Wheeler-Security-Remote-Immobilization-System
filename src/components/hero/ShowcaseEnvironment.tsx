import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { ContactShadows, MeshReflectorMaterial } from '@react-three/drei';
import * as THREE from 'three';

const AnimatedBackdrop: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  const orbRefs = useRef<THREE.Mesh[]>([]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.04;
    }
    orbRefs.current.forEach((orb, i) => {
      if (!orb) return;
      orb.position.y = 2 + Math.sin(t * 0.6 + i * 1.2) * 0.8;
      const pulse = 0.08 + Math.sin(t * 1.1 + i) * 0.04;
      orb.scale.setScalar(pulse * (10 + i * 2));
    });
  });

  return (
    <group ref={groupRef}>
      {[
        { pos: [-8, 3, -6] as [number, number, number], color: '#1D4ED8' },
        { pos: [9, 2, -8] as [number, number, number], color: '#2563EB' },
        { pos: [0, 4, -12] as [number, number, number], color: '#0EA5E9' },
      ].map((orb, i) => (
        <mesh
          key={`orb-${i}`}
          ref={(el) => {
            if (el) orbRefs.current[i] = el;
          }}
          position={orb.pos}
        >
          <sphereGeometry args={[1, 32, 32]} />
          <meshBasicMaterial color={orb.color} transparent opacity={0.12} blending={THREE.AdditiveBlending} />
        </mesh>
      ))}
    </group>
  );
};

export const ShowcaseEnvironment: React.FC = () => {
  const ringRefs = useRef<THREE.Mesh[]>([]);
  const glowRef = useRef<THREE.Mesh>(null);
  const gridRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    ringRefs.current.forEach((ring, i) => {
      if (!ring) return;
      ring.rotation.z = t * (0.12 + i * 0.04);
      const scale = 1 + Math.sin(t * 1.1 + i * 0.7) * 0.02;
      ring.scale.set(scale, scale, 1);
    });

    if (glowRef.current) {
      const pulse = 0.4 + Math.sin(t * 1.8) * 0.1;
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity = pulse;
    }

    if (gridRef.current) {
      gridRef.current.position.z = (t * 0.15) % 2;
    }
  });

  return (
    <group>
      <AnimatedBackdrop />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <planeGeometry args={[30, 30]} />
        <MeshReflectorMaterial
          blur={[300, 100]}
          resolution={1024}
          mixBlur={0.85}
          mixStrength={0.55}
          roughness={0.88}
          depthScale={1.2}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#030712"
          metalness={0.9}
          mirror={0.65}
        />
      </mesh>

      <mesh ref={gridRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]}>
        <planeGeometry args={[24, 24, 24, 24]} />
        <meshBasicMaterial color="#1E40AF" wireframe transparent opacity={0.06} />
      </mesh>

      <mesh ref={glowRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, 0]}>
        <circleGeometry args={[3.5, 64]} />
        <meshBasicMaterial color="#2563EB" transparent opacity={0.4} blending={THREE.AdditiveBlending} />
      </mesh>

      {[3.6, 4.6, 5.6, 6.8].map((radius, i) => (
        <mesh
          key={`ring-${i}`}
          ref={(el) => {
            if (el) ringRefs.current[i] = el;
          }}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -0.02 + i * 0.002, 0]}
        >
          <ringGeometry args={[radius - 0.025, radius, 80]} />
          <meshBasicMaterial
            color={i === 0 ? '#60A5FA' : i === 1 ? '#3B82F6' : i === 2 ? '#2563EB' : '#1D4ED8'}
            transparent
            opacity={0.28 - i * 0.05}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}

      <ContactShadows position={[0, -0.04, 0]} opacity={0.65} scale={14} blur={2.5} far={5} color="#0a1628" />

      <fog attach="fog" args={['#050816', 8, 35]} />
    </group>
  );
};
