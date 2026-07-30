import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { getCameraAtTime } from './raceCinematic';

export const CinematicRaceCamera: React.FC = () => {
  const { camera } = useThree();
  const lookTarget = useRef(new THREE.Vector3());
  const initialized = useRef(false);

  useFrame(({ clock }) => {
    const { position, lookAt, fov } = getCameraAtTime(clock.getElapsedTime());

    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = THREE.MathUtils.lerp(camera.fov, fov, 0.08);
      camera.updateProjectionMatrix();
    }

    camera.position.lerp(position, initialized.current ? 0.06 : 0.15);
    lookTarget.current.lerp(lookAt, initialized.current ? 0.08 : 0.2);
    camera.lookAt(lookTarget.current);

    if (!initialized.current && camera.position.distanceTo(position) < 0.5) {
      initialized.current = true;
    }
  });

  return null;
};
