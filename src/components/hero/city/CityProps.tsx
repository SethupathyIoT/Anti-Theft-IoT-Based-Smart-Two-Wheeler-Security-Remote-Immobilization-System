import React, { useMemo, useRef } from 'react';
import { Instance, Instances } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createGlowMap, makeRandom } from './proceduralTextures';
import { STREET_METRICS } from './CityStreet';

const { ROAD_WIDTH, SIDEWALK_WIDTH, CURB_HEIGHT } = STREET_METRICS;
const WALK_CENTRE = ROAD_WIDTH / 2 + SIDEWALK_WIDTH / 2;
const LAMP_HEIGHT = 5.4;

type V3 = [number, number, number];

/* ------------------------------------------------------------------ lighting */

/** Positions for the lamp columns down both kerbs, skipping the bike's stage. */
function useLampLayout() {
  return useMemo(() => {
    const out: { position: V3; side: number }[] = [];
    for (let x = -48; x <= 48; x += 12) {
      if (Math.abs(x) < 6) continue; // keep the bike's immediate surroundings clear
      [-1, 1].forEach((side) => {
        out.push({ position: [x, 0, side * (WALK_CENTRE - 1.4)], side });
      });
    }
    return out;
  }, []);
}

/**
 * Street lamps. Geometry is instanced; only the two nearest columns cast real
 * light — everything else sells itself through emissive heads and bloom.
 */
const StreetLamps: React.FC = () => {
  const lamps = useLampLayout();
  const glow = useMemo(() => createGlowMap(), []);

  return (
    <group>
      <Instances limit={lamps.length} castShadow receiveShadow>
        <cylinderGeometry args={[0.09, 0.14, LAMP_HEIGHT, 10]} />
        <meshStandardMaterial color="#20242d" roughness={0.45} metalness={0.85} envMapIntensity={1.2} />
        {lamps.map((lamp, i) => (
          <Instance key={`pole-${i}`} position={[lamp.position[0], LAMP_HEIGHT / 2 + CURB_HEIGHT, lamp.position[2]]} />
        ))}
      </Instances>

      <Instances limit={lamps.length} castShadow>
        <boxGeometry args={[0.12, 0.12, 1.7]} />
        <meshStandardMaterial color="#20242d" roughness={0.45} metalness={0.85} />
        {lamps.map((lamp, i) => (
          <Instance
            key={`arm-${i}`}
            position={[lamp.position[0], LAMP_HEIGHT + CURB_HEIGHT - 0.1, lamp.position[2] - lamp.side * 0.85]}
          />
        ))}
      </Instances>

      <Instances limit={lamps.length}>
        <boxGeometry args={[0.5, 0.14, 0.9]} />
        <meshStandardMaterial
          color="#fff1d0"
          emissive="#ffd79a"
          emissiveIntensity={6}
          toneMapped={false}
        />
        {lamps.map((lamp, i) => (
          <Instance
            key={`head-${i}`}
            position={[lamp.position[0], LAMP_HEIGHT + CURB_HEIGHT - 0.22, lamp.position[2] - lamp.side * 1.6]}
          />
        ))}
      </Instances>

      {/* Pooled light on the tarmac under every lamp. (Volumetric cones were tried here
          and cut: a lamp near the camera fills half the frame with a flat warm wedge.) */}
      <Instances limit={lamps.length}>
        {/* A plain disc gives a hard-edged ellipse on the tarmac; the radial map fades out. */}
        <planeGeometry args={[6, 6]} />
        <meshBasicMaterial
          map={glow}
          color="#ffc178"
          transparent
          opacity={0.16}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
        {lamps.map((lamp, i) => (
          <Instance
            key={`pool-${i}`}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[lamp.position[0], 0.03, lamp.position[2] - lamp.side * 1.6]}
          />
        ))}
      </Instances>

      {/* Only the columns near the bike carry a real light. Point lights, not spots:
          a spotlight's target has to live in the scene graph to aim anywhere but the
          origin, and every lamp aiming at the origin would be wrong. */}
      {lamps
        .filter((lamp) => Math.abs(lamp.position[0]) < 15)
        .map((lamp, i) => (
          <pointLight
            key={`lamp-light-${i}`}
            position={[lamp.position[0], LAMP_HEIGHT + CURB_HEIGHT - 0.5, lamp.position[2] - lamp.side * 1.6]}
            intensity={26}
            distance={15}
            decay={1.7}
            color="#ffc98a"
          />
        ))}
    </group>
  );
};

/* ---------------------------------------------------------------- vegetation */

/** Stylised street trees: tapered trunk plus three offset foliage blobs. */
const StreetTrees: React.FC = () => {
  const trees = useMemo(() => {
    const rand = makeRandom(77);
    const out: { position: V3; scale: number; rotation: number }[] = [];
    for (let x = -46; x <= 46; x += 12) {
      // Nothing directly behind the bike: a tree crown there reads as a dark blob.
      if (Math.abs(x + 6) < 15) continue;
      [-1, 1].forEach((side) => {
        out.push({
          position: [x + 6, CURB_HEIGHT, side * (WALK_CENTRE + 0.6)],
          scale: 0.85 + rand() * 0.5,
          rotation: rand() * Math.PI,
        });
      });
    }
    return out;
  }, []);

  const blobs = useMemo(() => {
    const rand = makeRandom(31);
    return trees.flatMap((tree, treeIndex) =>
      [0, 1, 2].map((i) => ({
        key: `${treeIndex}-${i}`,
        position: [
          tree.position[0] + (rand() - 0.5) * 0.9 * tree.scale,
          tree.position[1] + (2.5 + i * 0.55) * tree.scale,
          tree.position[2] + (rand() - 0.5) * 0.9 * tree.scale,
        ] as V3,
        scale: (1.15 - i * 0.22 + rand() * 0.2) * tree.scale,
      }))
    );
  }, [trees]);

  return (
    <group>
      <Instances limit={trees.length} castShadow receiveShadow>
        <cylinderGeometry args={[0.11, 0.19, 2.8, 8]} />
        <meshStandardMaterial color="#3a2f28" roughness={0.95} metalness={0} />
        {trees.map((tree, i) => (
          <Instance
            key={`trunk-${i}`}
            position={[tree.position[0], tree.position[1] + 1.4 * tree.scale, tree.position[2]]}
            scale={[tree.scale, tree.scale, tree.scale]}
          />
        ))}
      </Instances>

      <Instances limit={blobs.length} castShadow receiveShadow>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color="#2f5c40" roughness={0.9} metalness={0} flatShading />
        {blobs.map((blob) => (
          <Instance key={`foliage-${blob.key}`} position={blob.position} scale={blob.scale} />
        ))}
      </Instances>

      {/* Tree pits, so trunks meet the pavement properly. */}
      <Instances limit={trees.length}>
        <boxGeometry args={[1.3, 0.06, 1.3]} />
        <meshStandardMaterial color="#15181e" roughness={1} />
        {trees.map((tree, i) => (
          <Instance key={`pit-${i}`} position={[tree.position[0], CURB_HEIGHT + 0.02, tree.position[2]]} />
        ))}
      </Instances>
    </group>
  );
};

/** Low hedges in planters, filling the gaps between trees. */
const Hedges: React.FC = () => {
  const hedges = useMemo(() => {
    const rand = makeRandom(404);
    const out: { position: V3; length: number }[] = [];
    for (let x = -40; x <= 40; x += 12) {
      if (Math.abs(x) < 10) continue;
      [-1, 1].forEach((side) => {
        out.push({ position: [x, CURB_HEIGHT, side * (WALK_CENTRE + 1.5)], length: 2.5 + rand() * 2 });
      });
    }
    return out;
  }, []);

  return (
    <group>
      <Instances limit={hedges.length} castShadow receiveShadow>
        <boxGeometry args={[1, 0.55, 0.8]} />
        <meshStandardMaterial color="#22452f" roughness={0.95} flatShading />
        {hedges.map((hedge, i) => (
          <Instance
            key={`hedge-${i}`}
            position={[hedge.position[0], hedge.position[1] + 0.4, hedge.position[2]]}
            scale={[hedge.length, 1, 1]}
          />
        ))}
      </Instances>

      <Instances limit={hedges.length} receiveShadow>
        <boxGeometry args={[1, 0.28, 1]} />
        <meshStandardMaterial color="#3a3f49" roughness={0.85} metalness={0.1} />
        {hedges.map((hedge, i) => (
          <Instance
            key={`planter-${i}`}
            position={[hedge.position[0], hedge.position[1] + 0.14, hedge.position[2]]}
            scale={[hedge.length + 0.2, 1, 1.05]}
          />
        ))}
      </Instances>
    </group>
  );
};

/* ----------------------------------------------------------- street furniture */

const Bollards: React.FC = () => {
  const bollards = useMemo(() => {
    const out: V3[] = [];
    for (let x = -18; x <= 18; x += 2.2) {
      if (Math.abs(x) < 5) continue;
      [-1, 1].forEach((side) => out.push([x, CURB_HEIGHT, side * (WALK_CENTRE - 2.1)]));
    }
    return out;
  }, []);

  return (
    <group>
      <Instances limit={bollards.length} castShadow receiveShadow>
        <cylinderGeometry args={[0.09, 0.11, 0.85, 10]} />
        <meshStandardMaterial color="#2c313b" roughness={0.4} metalness={0.9} envMapIntensity={1.4} />
        {bollards.map((p, i) => (
          <Instance key={`bollard-${i}`} position={[p[0], p[1] + 0.42, p[2]]} />
        ))}
      </Instances>

      <Instances limit={bollards.length}>
        <cylinderGeometry args={[0.095, 0.095, 0.06, 10]} />
        <meshStandardMaterial color="#67e8f9" emissive="#22d3ee" emissiveIntensity={3.5} toneMapped={false} />
        {bollards.map((p, i) => (
          <Instance key={`bollard-band-${i}`} position={[p[0], p[1] + 0.72, p[2]]} />
        ))}
      </Instances>
    </group>
  );
};

const Bench: React.FC<{ position: V3; rotation?: number }> = ({ position, rotation = 0 }) => (
  <group position={position} rotation={[0, rotation, 0]}>
    <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
      <boxGeometry args={[2.2, 0.09, 0.55]} />
      <meshStandardMaterial color="#5a4632" roughness={0.85} metalness={0.05} />
    </mesh>
    <mesh position={[0, 0.78, -0.24]} rotation={[-0.22, 0, 0]} castShadow>
      <boxGeometry args={[2.2, 0.09, 0.42]} />
      <meshStandardMaterial color="#5a4632" roughness={0.85} metalness={0.05} />
    </mesh>
    {[-0.9, 0.9].map((x) => (
      <mesh key={`leg-${x}`} position={[x, 0.22, 0]} castShadow>
        <boxGeometry args={[0.09, 0.45, 0.5]} />
        <meshStandardMaterial color="#22262e" roughness={0.4} metalness={0.85} />
      </mesh>
    ))}
  </group>
);

const TrashBin: React.FC<{ position: V3 }> = ({ position }) => (
  <group position={position}>
    <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[0.3, 0.24, 0.9, 14]} />
      <meshStandardMaterial color="#2a2f38" roughness={0.5} metalness={0.7} />
    </mesh>
    <mesh position={[0, 0.93, 0]} castShadow>
      <cylinderGeometry args={[0.33, 0.33, 0.07, 14]} />
      <meshStandardMaterial color="#3b414c" roughness={0.35} metalness={0.85} />
    </mesh>
  </group>
);

const TrafficLight: React.FC<{ position: V3; rotation?: number }> = ({ position, rotation = 0 }) => {
  const amberRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(({ clock }) => {
    if (!amberRef.current) return;
    const cycle = Math.sin(clock.getElapsedTime() * 1.4) > 0 ? 1 : 0.15;
    amberRef.current.emissiveIntensity = 2 + cycle * 5;
  });

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 2.1, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.11, 4.2, 8]} />
        <meshStandardMaterial color="#22262e" roughness={0.45} metalness={0.85} />
      </mesh>
      <mesh position={[0, 3.9, 0.35]} castShadow>
        <boxGeometry args={[0.42, 1.15, 0.4]} />
        <meshStandardMaterial color="#171b22" roughness={0.6} metalness={0.4} />
      </mesh>
      {[
        { y: 4.28, color: '#ff4444', intensity: 0.4 },
        { y: 3.9, color: '#ffb545', intensity: 0 },
        { y: 3.52, color: '#3ddc84', intensity: 6 },
      ].map((lamp, i) => (
        <mesh key={`bulb-${i}`} position={[0, lamp.y, 0.57]}>
          <circleGeometry args={[0.13, 16]} />
          <meshStandardMaterial
            ref={i === 1 ? amberRef : undefined}
            color={lamp.color}
            emissive={lamp.color}
            emissiveIntensity={lamp.intensity}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
};

/** Overhead gantry with a lit sign — gives the street some architectural scale. */
const RoadGantry: React.FC<{ x: number }> = ({ x }) => (
  <group position={[x, 0, 0]}>
    {[-1, 1].map((side) => (
      <mesh key={`gantry-leg-${side}`} position={[0, 3.4, side * (ROAD_WIDTH / 2 + 0.6)]} castShadow>
        <cylinderGeometry args={[0.16, 0.2, 6.8, 10]} />
        <meshStandardMaterial color="#262b34" roughness={0.4} metalness={0.9} envMapIntensity={1.3} />
      </mesh>
    ))}
    <mesh position={[0, 6.6, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
      <cylinderGeometry args={[0.16, 0.16, ROAD_WIDTH + 1.6, 10]} />
      <meshStandardMaterial color="#262b34" roughness={0.4} metalness={0.9} />
    </mesh>
    <mesh position={[0, 5.9, 0]} castShadow>
      <boxGeometry args={[0.18, 1.3, 4.2]} />
      <meshStandardMaterial color="#0d1b2e" roughness={0.5} metalness={0.3} />
    </mesh>
    <mesh position={[-0.12, 5.9, 0]} rotation={[0, -Math.PI / 2, 0]}>
      <planeGeometry args={[4, 1.05]} />
      <meshStandardMaterial color="#0a1626" emissive="#2563eb" emissiveIntensity={2.2} toneMapped={false} />
    </mesh>
  </group>
);

/** Zebra crossing ahead of the bike, adds a readable focal band on the tarmac. */
const Crosswalk: React.FC<{ x: number }> = ({ x }) => (
  <group position={[x, 0.014, 0]}>
    {Array.from({ length: 9 }, (_, i) => (
      <mesh key={`stripe-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -ROAD_WIDTH / 2 + 1 + i * 1.4]}>
        <planeGeometry args={[2.6, 0.6]} />
        <meshStandardMaterial color="#4a5058" roughness={0.78} />
      </mesh>
    ))}
  </group>
);

/** Barriers cordoning the bike's stage, like a show floor. */
const StageBarriers: React.FC = () => {
  const posts = useMemo(() => {
    const out: V3[] = [];
    [-3.6, 3.6].forEach((z) => {
      for (let x = -4.5; x <= 4.5; x += 3) out.push([x, 0, z]);
    });
    return out;
  }, []);

  return (
    <Instances limit={posts.length} castShadow receiveShadow>
      <cylinderGeometry args={[0.05, 0.07, 1, 8]} />
      <meshStandardMaterial color="#39404c" roughness={0.35} metalness={0.9} envMapIntensity={1.5} />
      {posts.map((p, i) => (
        <Instance key={`post-${i}`} position={[p[0], 0.5, p[2]]} />
      ))}
    </Instances>
  );
};

export const CityProps: React.FC = () => (
  <group>
    <StreetLamps />
    <StreetTrees />
    <Hedges />
    <Bollards />
    <StageBarriers />

    <Bench position={[-9, CURB_HEIGHT, WALK_CENTRE + 0.3]} rotation={Math.PI} />
    <Bench position={[11, CURB_HEIGHT, -WALK_CENTRE - 0.3]} />
    <TrashBin position={[-7.2, CURB_HEIGHT, WALK_CENTRE + 0.4]} />
    <TrashBin position={[13, CURB_HEIGHT, -WALK_CENTRE - 0.4]} />

    <TrafficLight position={[-16, CURB_HEIGHT, WALK_CENTRE - 1.2]} rotation={Math.PI} />
    <TrafficLight position={[16, CURB_HEIGHT, -WALK_CENTRE + 1.2]} />

    <RoadGantry x={-22} />
    <Crosswalk x={-11} />
    <Crosswalk x={11} />
  </group>
);
