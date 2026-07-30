import React, { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { easeOutCubic } from './heroAnimations';
import { BIKE_MODEL_NAME } from './BikeModel';
import { useHeroScene } from './HeroSceneContext';

const DEFAULT_TARGET = new THREE.Vector3(0, 0.75, 0);
const DEFAULT_CAMERA = new THREE.Vector3(1.5, 2.1, 11);

interface ZoomAnimation {
  startPos: THREE.Vector3;
  endPos: THREE.Vector3;
  startTarget: THREE.Vector3;
  endTarget: THREE.Vector3;
  progress: number;
}

export const BikeOrbitControls: React.FC = () => {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { camera, gl, scene } = useThree();
  const { setIsDragging, registerResetView } = useHeroScene();
  const zoomAnim = useRef<ZoomAnimation | null>(null);

  useEffect(() => {
    registerResetView(() => {
      if (!controlsRef.current) return;
      zoomAnim.current = {
        startPos: camera.position.clone(),
        endPos: DEFAULT_CAMERA.clone(),
        startTarget: controlsRef.current.target.clone(),
        endTarget: DEFAULT_TARGET.clone(),
        progress: 0,
      };
    });
  }, [camera, registerResetView]);

  useEffect(() => {
    const canvas = gl.domElement;
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const handleDoubleClick = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      // Only bike parts are zoom targets — the ground plane and backdrop are not.
      const bike = scene.getObjectByName(BIKE_MODEL_NAME);
      if (!bike) return;

      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObject(bike, true);
      const meshHit = hits.find((hit) => hit.object instanceof THREE.Mesh && hit.object.visible);

      if (!meshHit || !controlsRef.current) return;

      const focusPoint = meshHit.point.clone();
      const viewDir = camera.position.clone().sub(focusPoint).normalize();
      const zoomDistance = Math.max(0.55, Math.min(3.5, camera.position.distanceTo(focusPoint) * 0.4));
      const endPos = focusPoint.clone().add(viewDir.multiplyScalar(zoomDistance));

      zoomAnim.current = {
        startPos: camera.position.clone(),
        endPos,
        startTarget: controlsRef.current.target.clone(),
        endTarget: focusPoint,
        progress: 0,
      };
    };

    canvas.addEventListener('dblclick', handleDoubleClick);
    return () => canvas.removeEventListener('dblclick', handleDoubleClick);
  }, [camera, gl, scene]);

  useFrame((_, delta) => {
    const anim = zoomAnim.current;
    if (!anim || !controlsRef.current) return;

    anim.progress = Math.min(1, anim.progress + delta * 2.2);
    const t = easeOutCubic(anim.progress);

    camera.position.lerpVectors(anim.startPos, anim.endPos, t);
    controlsRef.current.target.lerpVectors(anim.startTarget, anim.endTarget, t);
    controlsRef.current.update();

    if (anim.progress >= 1) {
      zoomAnim.current = null;
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      target={DEFAULT_TARGET}
      enableDamping
      dampingFactor={0.06}
      rotateSpeed={0.7}
      zoomSpeed={0.9}
      panSpeed={0.5}
      minDistance={0.35}
      maxDistance={34}
      minPolarAngle={0.05}
      // Stop just above the horizon — the street is a real surface now.
      maxPolarAngle={Math.PI / 2.06}
      mouseButtons={{
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN,
      }}
      onStart={() => setIsDragging(true)}
      onEnd={() => setIsDragging(false)}
    />
  );
};
