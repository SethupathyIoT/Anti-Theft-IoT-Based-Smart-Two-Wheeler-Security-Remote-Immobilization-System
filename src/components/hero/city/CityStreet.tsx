import React, { useMemo } from 'react';
import { MeshReflectorMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { createAsphaltMaps, createConcreteMap } from './proceduralTextures';

const ROAD_LENGTH = 120;
const ROAD_WIDTH = 13;
const SIDEWALK_WIDTH = 4.5;
const CURB_HEIGHT = 0.18;

/** Centre-line dashes plus solid edge lines, kept just above the asphalt. */
const LaneMarkings: React.FC = () => {
  const dashes = useMemo(() => {
    const out: number[] = [];
    for (let x = -ROAD_LENGTH / 2; x < ROAD_LENGTH / 2; x += 6) out.push(x);
    return out;
  }, []);

  return (
    <group position={[0, 0.012, 0]}>
      {dashes.map((x) => (
        <mesh key={`dash-${x}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0, 0]} receiveShadow>
          <planeGeometry args={[3.2, 0.18]} />
          <meshStandardMaterial color="#7c828c" roughness={0.7} metalness={0} />
        </mesh>
      ))}

      {[-ROAD_WIDTH / 2 + 0.55, ROAD_WIDTH / 2 - 0.55].map((z) => (
        <mesh key={`edge-${z}`} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, z]}>
          <planeGeometry args={[ROAD_LENGTH, 0.14]} />
          <meshStandardMaterial color="#767c86" roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
};

const Sidewalk: React.FC<{ z: number; concrete: THREE.Texture }> = ({ z, concrete }) => {
  const side = Math.sign(z);

  return (
    <group position={[0, 0, z]}>
      <mesh position={[0, CURB_HEIGHT / 2, 0]} receiveShadow castShadow>
        <boxGeometry args={[ROAD_LENGTH, CURB_HEIGHT, SIDEWALK_WIDTH]} />
        <meshStandardMaterial map={concrete} color="#3a3f47" roughness={0.95} metalness={0.02} />
      </mesh>

      {/* Kerb face catching the street lighting. */}
      <mesh position={[0, CURB_HEIGHT / 2, (-side * SIDEWALK_WIDTH) / 2 - 0.02]} receiveShadow>
        <boxGeometry args={[ROAD_LENGTH, CURB_HEIGHT + 0.02, 0.06]} />
        <meshStandardMaterial color="#9aa1ab" roughness={0.75} />
      </mesh>
    </group>
  );
};

export const CityStreet: React.FC = () => {
  const asphalt = useMemo(() => createAsphaltMaps([14, 2]), []);
  const concrete = useMemo(() => createConcreteMap([28, 2]), []);

  const sidewalkZ = ROAD_WIDTH / 2 + SIDEWALK_WIDTH / 2;

  return (
    <group>
      {/* Wet asphalt: reflective enough to carry the neon, rough enough to read as tarmac. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[ROAD_LENGTH, ROAD_WIDTH]} />
        <MeshReflectorMaterial
          blur={[420, 120]}
          resolution={1024}
          mixBlur={1}
          mixStrength={2.4}
          depthScale={1.15}
          minDepthThreshold={0.3}
          maxDepthThreshold={1.5}
          roughnessMap={asphalt.roughnessMap}
          map={asphalt.map}
          color="#0e1116"
          metalness={0.55}
          roughness={0.72}
          mirror={0.45}
        />
      </mesh>

      <LaneMarkings />

      <Sidewalk z={sidewalkZ} concrete={concrete} />
      <Sidewalk z={-sidewalkZ} concrete={concrete} />

      {/* Ground plane beyond the kerbs so the city never floats over a void. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[400, 400]} />
        <meshStandardMaterial color="#080a0f" roughness={1} metalness={0} />
      </mesh>
    </group>
  );
};

export const STREET_METRICS = { ROAD_LENGTH, ROAD_WIDTH, SIDEWALK_WIDTH, CURB_HEIGHT };
