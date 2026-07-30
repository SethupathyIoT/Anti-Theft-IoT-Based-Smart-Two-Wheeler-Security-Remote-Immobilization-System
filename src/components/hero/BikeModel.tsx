import React, { useMemo } from 'react';
import { useGLTF, Center } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Superbike hero asset: 335k triangles, full PBR set (base colour, metal/rough,
 * normal, emissive) at 2K, served from `public/models` so nothing depends on a CDN.
 * Swap the filename to change bikes — the component refits any GLB automatically.
 */
export const MOTORCYCLE_MODEL_URL = `${import.meta.env.BASE_URL}models/superbike-zx10r.glb`;

/** World-space length the bike is normalised to, whatever units the GLB ships in. */
const TARGET_SIZE = 4.2;

/** Name used by the double-click zoom raycast so it only picks bike parts. */
export const BIKE_MODEL_NAME = 'hero-bike-model';

useGLTF.preload(MOTORCYCLE_MODEL_URL);

/**
 * Upgrades the imported materials to a showroom finish: clearcoat over the paint,
 * full anisotropic filtering on every map, and emissive lamps that survive tone mapping.
 */
function refineMaterial(source: THREE.Material, maxAnisotropy: number): THREE.Material {
  if (!(source instanceof THREE.MeshStandardMaterial)) return source;

  // Assigned field by field on purpose: MeshPhysicalMaterial.copy() would read
  // clearcoat/sheen/transmission off a Standard material and write undefined into the
  // shader inputs.
  const refined = new THREE.MeshPhysicalMaterial({
    name: source.name,
    map: source.map,
    normalMap: source.normalMap,
    normalScale: source.normalScale.clone(),
    roughnessMap: source.roughnessMap,
    metalnessMap: source.metalnessMap,
    aoMap: source.aoMap,
    aoMapIntensity: source.aoMapIntensity,
    emissiveMap: source.emissiveMap,
    alphaMap: source.alphaMap,
    color: source.color.clone(),
    emissive: source.emissive.clone(),
    emissiveIntensity: source.emissiveIntensity,
    roughness: source.roughness,
    metalness: source.metalness,
    transparent: source.transparent,
    opacity: source.opacity,
    alphaTest: source.alphaTest,
    side: source.side,
    depthWrite: source.depthWrite,
    vertexColors: source.vertexColors,
    flatShading: source.flatShading,
  });

  (
    [refined.map, refined.normalMap, refined.roughnessMap, refined.metalnessMap, refined.emissiveMap, refined.aoMap] as (
      | THREE.Texture
      | null
    )[]
  ).forEach((texture) => {
    if (!texture) return;
    texture.anisotropy = maxAnisotropy;
    texture.needsUpdate = true;
  });

  refined.envMapIntensity = 1.25;

  const name = source.name.toLowerCase();
  const isGlass = /glass|visor|screen|windshield|lens/.test(name);
  const isDecal = /decal|sticker|logo/.test(name);

  if (isGlass) {
    // Screen and visor: thin, smooth, slightly tinted.
    refined.roughness = Math.min(refined.roughness, 0.08);
    refined.metalness = 0;
    refined.clearcoat = 1;
    refined.clearcoatRoughness = 0.02;
    refined.envMapIntensity = 2;
    refined.transparent = true;
    refined.side = THREE.FrontSide;
  } else if (isDecal) {
    // Cut out on alpha rather than blending, so decals sort correctly against the paint.
    refined.transparent = false;
    refined.opacity = 1;
    refined.alphaTest = 0.5;
    refined.depthWrite = true;
    refined.side = THREE.DoubleSide;
    refined.clearcoat = 0.65;
    refined.clearcoatRoughness = 0.14;
  } else {
    // The GLB exports every material as alphaMode BLEND + doubleSided, which makes solid
    // parts (tyres, fairings) render see-through and sort wrongly. Force them opaque.
    refined.transparent = false;
    refined.opacity = 1;
    refined.depthWrite = true;
    refined.side = THREE.FrontSide;
    // Bodywork and metals: lacquered coat lifts reflections without washing out the maps.
    refined.clearcoat = 0.65;
    refined.clearcoatRoughness = 0.14;
    refined.roughness = THREE.MathUtils.clamp(refined.roughness * 0.85, 0.06, 1);
  }

  return refined;
}

export const BikeModel: React.FC = () => {
  const { scene } = useGLTF(MOTORCYCLE_MODEL_URL);
  const { gl } = useThree();

  const { model, fitScale, faceCamera } = useMemo(() => {
    const clone = scene.clone(true);
    const maxAnisotropy = gl.capabilities.getMaxAnisotropy();
    const cache = new Map<THREE.Material, THREE.Material>();

    clone.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      child.castShadow = true;
      child.receiveShadow = true;

      const materials = Array.isArray(child.material) ? child.material : [child.material];
      const refined = materials.map((mat) => {
        if (!mat) return mat;
        if (!cache.has(mat)) cache.set(mat, refineMaterial(mat, maxAnisotropy));
        return cache.get(mat)!;
      });
      child.material = Array.isArray(child.material) ? refined : refined[0];
    });

    const size = new THREE.Box3().setFromObject(clone).getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;

    return {
      model: clone,
      fitScale: TARGET_SIZE / maxDim,
      // Turn the bike side-on to the default camera regardless of how it was authored.
      faceCamera: size.z > size.x ? Math.PI / 2 : 0,
    };
  }, [scene, gl]);

  return (
    <Center top position={[0, 0.12, 0]}>
      <group name={BIKE_MODEL_NAME} rotation={[0, faceCamera, 0]} scale={fitScale}>
        <primitive object={model} />
      </group>
    </Center>
  );
};
