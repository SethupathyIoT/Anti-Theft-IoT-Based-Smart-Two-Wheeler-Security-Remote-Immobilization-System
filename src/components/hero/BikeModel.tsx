import React, { useMemo } from 'react';
import { useGLTF, Center } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Sport bike model, served from `public/models` so the hero never depends on a
 * third-party CDN staying alive (the old pmndrs Supabase asset host 404s now).
 */
export const MOTORCYCLE_MODEL_URL = `${import.meta.env.BASE_URL}models/yamaha-r1.glb`;

/** World-space length the bike is normalised to, whatever units the GLB ships in. */
const TARGET_SIZE = 4.2;

/** Name used by the double-click zoom raycast so it only picks bike parts. */
export const BIKE_MODEL_NAME = 'hero-bike-model';

useGLTF.preload(MOTORCYCLE_MODEL_URL);

export const BikeModel: React.FC = () => {
  const { scene } = useGLTF(MOTORCYCLE_MODEL_URL);

  const { model, fitScale, faceCamera } = useMemo(() => {
    const clone = scene.clone(true);

    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((mat) => {
          if (mat && 'envMapIntensity' in mat) {
            (mat as THREE.MeshStandardMaterial).envMapIntensity = 1.4;
          }
        });
      }
    });

    const size = new THREE.Box3().setFromObject(clone).getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;

    return {
      model: clone,
      fitScale: TARGET_SIZE / maxDim,
      // Turn the bike side-on to the default camera regardless of how it was authored.
      faceCamera: size.z > size.x ? Math.PI / 2 : 0,
    };
  }, [scene]);

  return (
    <Center top>
      <group name={BIKE_MODEL_NAME} rotation={[0, faceCamera, 0]} scale={fitScale}>
        <primitive object={model} />
      </group>
    </Center>
  );
};
