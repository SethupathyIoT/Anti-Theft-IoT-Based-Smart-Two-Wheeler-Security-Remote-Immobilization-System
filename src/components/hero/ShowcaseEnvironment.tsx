import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

/**
 * The bike's stage: a lit ground pool, scanning rings and grounded contact shadows.
 * The surrounding street lives in `city/CityEnvironment`.
 */
export const ShowcaseEnvironment: React.FC = () => {
  const ringRefs = useRef<THREE.Mesh[]>([]);
  const glowRef = useRef<THREE.Mesh>(null);
  const scanRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    ringRefs.current.forEach((ring, i) => {
      if (!ring) return;
      ring.rotation.z = t * (0.12 + i * 0.04);
      const scale = 1 + Math.sin(t * 1.1 + i * 0.7) * 0.02;
      ring.scale.set(scale, scale, 1);
    });

    if (glowRef.current) {
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity = 0.09 + Math.sin(t * 1.8) * 0.025;
    }

    if (scanRef.current) {
      // Security-scan sweep rising through the bike.
      const cycle = (t * 0.35) % 1;
      scanRef.current.position.y = cycle * 2.4;
      (scanRef.current.material as THREE.MeshBasicMaterial).opacity = Math.sin(cycle * Math.PI) * 0.09;
    }
  });

  return (
    <group>
      {/* Raised stage deck, so the bike is not simply parked on the tarmac. */}
      <mesh position={[0, 0.055, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[3.5, 3.6, 0.11, 64]} />
        <meshStandardMaterial color="#0c1017" roughness={0.28} metalness={0.85} envMapIntensity={1.4} />
      </mesh>

      {/* Edge-lit rim only — a fully emissive deck blows the whole frame out.
          ringGeometry is authored in the XY plane, so it has to be laid flat. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.115, 0]}>
        <ringGeometry args={[3.34, 3.52, 96]} />
        <meshBasicMaterial
          color="#3b82f6"
          transparent
          opacity={0.85}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>

      <mesh ref={glowRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.118, 0]}>
        <circleGeometry args={[3.4, 64]} />
        <meshBasicMaterial color="#1d4ed8" transparent opacity={0.09} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      {[3.9, 4.7, 5.6].map((radius, i) => (
        <mesh
          key={`ring-${i}`}
          ref={(el) => {
            if (el) ringRefs.current[i] = el;
          }}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.03 + i * 0.002, 0]}
        >
          <ringGeometry args={[radius - 0.03, radius, 96]} />
          <meshBasicMaterial
            color={i === 0 ? '#60A5FA' : i === 1 ? '#3B82F6' : '#1D4ED8'}
            transparent
            opacity={0.16 - i * 0.04}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ))}

      <mesh ref={scanRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.2, 0]}>
        <ringGeometry args={[1.1, 3.3, 64]} />
        <meshBasicMaterial
          color="#38BDF8"
          transparent
          opacity={0.12}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      <ContactShadows position={[0, 0.121, 0]} opacity={0.85} scale={11} blur={2.2} far={4} resolution={1024} color="#000308" />
    </group>
  );
};
