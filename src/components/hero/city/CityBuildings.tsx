import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createFacadeMaps, makeRandom } from './proceduralTextures';
import { STREET_METRICS } from './CityStreet';

const WINDOW_SPACING = 2.4;

interface BuildingSpec {
  position: [number, number, number];
  size: [number, number, number];
  variant: number;
  hasMast: boolean;
  hasCrown: boolean;
}

/** Four facade looks — office glass, apartments, warehouse, tower — reused across the block. */
function useFacadeVariants() {
  return useMemo(
    () => [
      createFacadeMaps({ columns: 8, rows: 12, seed: 11, litRatio: 0.34 }),
      createFacadeMaps({ columns: 6, rows: 10, seed: 27, litRatio: 0.2 }),
      createFacadeMaps({ columns: 10, rows: 8, seed: 53, litRatio: 0.26 }),
      createFacadeMaps({ columns: 7, rows: 14, seed: 71, litRatio: 0.42 }),
    ],
    []
  );
}

function useBuildingLayout(): BuildingSpec[] {
  return useMemo(() => {
    const rand = makeRandom(2024);
    const specs: BuildingSpec[] = [];
    const blockStart = STREET_METRICS.ROAD_WIDTH / 2 + STREET_METRICS.SIDEWALK_WIDTH;

    // Two depth rows per side: a street wall well back off the kerb, then taller
    // towers behind it. Kept distant so the hero frames the bike, not a wall of windows.
    const rows = [
      { depthOffset: blockStart + 14, height: [7, 15], depth: [9, 13] },
      { depthOffset: blockStart + 36, height: [18, 38], depth: [12, 18] },
    ];

    [-1, 1].forEach((side) => {
      rows.forEach((row, rowIndex) => {
        let x = -52;
        while (x < 52) {
          const width = 6 + rand() * 8;
          const height = row.height[0] + rand() * (row.height[1] - row.height[0]);
          const depth = row.depth[0] + rand() * (row.depth[1] - row.depth[0]);
          // Wide, uneven gaps: an unbroken street wall reads as a curtain of window dots.
          const gap = 4 + rand() * 9;

          specs.push({
            position: [x + width / 2, height / 2, side * (row.depthOffset + rand() * 4 + depth / 2)],
            size: [width, height, depth],
            variant: Math.floor(rand() * 4),
            hasMast: rowIndex === 1 && rand() > 0.55,
            hasCrown: rand() > 0.5,
          });

          x += width + gap;
        }
      });
    });

    return specs;
  }, []);
}

const Building: React.FC<{
  spec: BuildingSpec;
  facade: ReturnType<typeof createFacadeMaps>;
}> = ({ spec, facade }) => {
  const [width, height, depth] = spec.size;

  // Clone the shared maps so window density follows the building's real dimensions
  // instead of stretching one texture across every face.
  const material = useMemo(() => {
    const map = facade.map.clone();
    const emissiveMap = facade.emissiveMap.clone();
    map.needsUpdate = true;
    emissiveMap.needsUpdate = true;

    const cols = Math.max(2, Math.round(width / WINDOW_SPACING));
    const rowsCount = Math.max(3, Math.round(height / WINDOW_SPACING));
    map.repeat.set(cols, rowsCount);
    emissiveMap.repeat.set(cols, rowsCount);

    return new THREE.MeshStandardMaterial({
      map,
      emissiveMap,
      emissive: new THREE.Color('#ffffff'),
      emissiveIntensity: 0.55,
      color: '#3f4653',
      roughness: 0.62,
      metalness: 0.25,
      envMapIntensity: 0.6,
    });
  }, [facade, width, height]);

  return (
    <group position={spec.position}>
      <mesh material={material} castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
      </mesh>

      {/* Lit ground-floor band — the warm street-level glow a night city always has. */}
      {height < 17 && (
        <mesh position={[0, -height / 2 + 2.1, 0]}>
          <boxGeometry args={[width + 0.25, 0.42, depth + 0.25]} />
          <meshStandardMaterial color="#3a2c1c" emissive="#ffb765" emissiveIntensity={1.6} toneMapped={false} />
        </mesh>
      )}

      {/* Parapet cap reads as a real roof edge rather than a cut-off box. */}
      {spec.hasCrown && (
        <mesh position={[0, height / 2 + 0.35, 0]} castShadow>
          <boxGeometry args={[width + 0.5, 0.7, depth + 0.5]} />
          <meshStandardMaterial color="#1b1f28" roughness={0.85} metalness={0.15} />
        </mesh>
      )}

      {spec.hasMast && (
        <group position={[width * 0.22, height / 2, 0]}>
          <mesh position={[0, 2, 0]}>
            <cylinderGeometry args={[0.06, 0.09, 4, 6]} />
            <meshStandardMaterial color="#2b313c" roughness={0.7} metalness={0.6} />
          </mesh>
          <mesh position={[0, 4.1, 0]}>
            <sphereGeometry args={[0.13, 12, 12]} />
            <meshStandardMaterial color="#ff4d4d" emissive="#ff2d2d" emissiveIntensity={4} toneMapped={false} />
          </mesh>
        </group>
      )}
    </group>
  );
};

/** Fogged silhouette ring that fills the horizon when the camera orbits wide. */
const DistantSkyline: React.FC = () => {
  const geometry = useMemo(() => {
    const rand = makeRandom(909);
    const boxes: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 90; i++) {
      const angle = (i / 90) * Math.PI * 2 + rand() * 0.05;
      const radius = 95 + rand() * 55;
      const w = 6 + rand() * 14;
      const h = 18 + rand() * 55;
      const d = 6 + rand() * 14;
      // De-index first: the merge below concatenates raw triangles, not index buffers.
      const box = new THREE.BoxGeometry(w, h, d).toNonIndexed();
      box.translate(Math.cos(angle) * radius, h / 2, Math.sin(angle) * radius);
      boxes.push(box);
    }
    // Merge by hand: one geometry keeps the horizon to a single draw call.
    const merged = new THREE.BufferGeometry();
    const positions: number[] = [];
    const normals: number[] = [];
    boxes.forEach((box) => {
      positions.push(...Array.from(box.attributes.position.array as Float32Array));
      normals.push(...Array.from(box.attributes.normal.array as Float32Array));
      box.dispose();
    });
    merged.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    merged.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    return merged;
  }, []);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color="#0b0f18" roughness={1} metalness={0} emissive="#101a2e" emissiveIntensity={0.5} />
    </mesh>
  );
};

/** Slow-drifting aircraft light for a bit of life above the skyline. */
const NightTraffic: React.FC = () => {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime() * 0.06;
    ref.current.position.set(Math.cos(t) * 120, 46 + Math.sin(t * 0.7) * 4, Math.sin(t) * 120);
    const mat = ref.current.material as THREE.MeshBasicMaterial;
    mat.opacity = 0.55 + Math.sin(clock.getElapsedTime() * 3) * 0.45;
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.4, 8, 8]} />
      <meshBasicMaterial color="#ffd9a0" transparent opacity={0.8} toneMapped={false} />
    </mesh>
  );
};

export const CityBuildings: React.FC = () => {
  const facades = useFacadeVariants();
  const layout = useBuildingLayout();

  return (
    <group>
      {layout.map((spec, i) => (
        <Building key={`bld-${i}`} spec={spec} facade={facades[spec.variant]} />
      ))}
      <DistantSkyline />
      <NightTraffic />
    </group>
  );
};
