import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { easeOutCubic, lerp } from './heroAnimations';

const LOOK_AT = new THREE.Vector3(0, 0.15, 0);
const BASE_POSITION = new THREE.Vector3(0, 1.4, 10.5);
const START_POSITION = new THREE.Vector3(0, 1.8, 18);
const START_FOV = 54;
const TARGET_FOV = 40;
const ZOOM_DURATION = 2.4;

export const InteractiveCamera: React.FC = () => {
  const { camera, pointer } = useThree();
  const zoomProgress = useRef(0);
  const lookTarget = useRef(new THREE.Vector3().copy(LOOK_AT));
  const smoothMouse = useRef({ x: 0, y: 0 });

  useFrame((_, delta) => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;

    zoomProgress.current = Math.min(1, zoomProgress.current + delta / ZOOM_DURATION);
    const zoomEased = easeOutCubic(zoomProgress.current);

    smoothMouse.current.x = lerp(smoothMouse.current.x, pointer.x, 0.08);
    smoothMouse.current.y = lerp(smoothMouse.current.y, pointer.y, 0.08);

    const parallaxX = smoothMouse.current.x * 0.55;
    const parallaxY = smoothMouse.current.y * 0.22;

    camera.position.x = lerp(START_POSITION.x, BASE_POSITION.x, zoomEased) + parallaxX;
    camera.position.y = lerp(START_POSITION.y, BASE_POSITION.y, zoomEased) + parallaxY;
    camera.position.z = lerp(START_POSITION.z, BASE_POSITION.z, zoomEased);

    camera.fov = lerp(START_FOV, TARGET_FOV, zoomEased);
    camera.updateProjectionMatrix();

    lookTarget.current.set(
      LOOK_AT.x + smoothMouse.current.x * 0.15,
      LOOK_AT.y + smoothMouse.current.y * 0.08,
      LOOK_AT.z
    );
    camera.lookAt(lookTarget.current);
  });

  return null;
};
