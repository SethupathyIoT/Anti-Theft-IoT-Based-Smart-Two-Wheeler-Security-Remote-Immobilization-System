import React, { Suspense, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Sparkles, Stars, Loader } from '@react-three/drei';
import * as THREE from 'three';
import { BikeModel } from './BikeModel';
import { BikeModelBoundary } from './BikeModelBoundary';
import { BikeOrbitControls } from './BikeOrbitControls';
import { ShowcaseEnvironment } from './ShowcaseEnvironment';
import { HeroSceneProvider, useHeroScene } from './HeroSceneContext';
import { HeroViewerHint } from './HeroViewerHint';

const OrbitRimLight: React.FC = () => {
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    if (!lightRef.current) return;
    const t = clock.getElapsedTime();
    lightRef.current.position.x = Math.cos(t * 0.45) * 7;
    lightRef.current.position.z = Math.sin(t * 0.45) * 7;
    lightRef.current.position.y = 2.8 + Math.sin(t * 0.8) * 0.5;
    lightRef.current.intensity = 1.8 + Math.sin(t * 1.6) * 0.5;
  });

  return <pointLight ref={lightRef} color="#60A5FA" distance={18} />;
};

const SceneContent: React.FC<{ onReady: () => void }> = ({ onReady }) => {
  const readySent = useRef(false);

  useFrame(({ clock }) => {
    if (!readySent.current && clock.getElapsedTime() > 0.6) {
      readySent.current = true;
      onReady();
    }
  });

  return (
    <>
      <BikeOrbitControls />
      <ambientLight intensity={0.35} color="#BFDBFE" />
      <directionalLight position={[6, 10, 5]} intensity={1.1} color="#DBEAFE" castShadow shadow-mapSize={[2048, 2048]} />
      <directionalLight position={[-6, 4, -5]} intensity={0.45} color="#34D399" />
      <spotLight position={[0, 8, 0]} angle={0.5} penumbra={1} intensity={0.6} color="#3B82F6" distance={20} />
      <OrbitRimLight />
      <Environment preset="night" />
      <Stars radius={80} depth={40} count={1200} factor={3} saturation={0.2} fade speed={0.6} />
      <ShowcaseEnvironment />
      <BikeModelBoundary>
        <Suspense fallback={null}>
          <BikeModel />
        </Suspense>
      </BikeModelBoundary>
      <Sparkles count={80} scale={[14, 5, 14]} position={[0, 1, 0]} size={2} speed={0.35} color="#38BDF8" />
    </>
  );
};

const SceneCanvas: React.FC<{ onReady: () => void }> = ({ onReady }) => {
  const { setIsHovered } = useHeroScene();

  return (
    <div
      className="w-full h-full cursor-grab active:cursor-grabbing"
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
    >
      <Canvas
        shadows
        dpr={[1, 1.75]}
        camera={{ position: [0, 1.2, 8], fov: 45, near: 0.1, far: 100 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          stencil: false,
        }}
        style={{ background: 'transparent' }}
      >
        <SceneContent onReady={onReady} />
      </Canvas>
    </div>
  );
};

export const Hero3DScene: React.FC = () => {
  const [loaded, setLoaded] = useState(false);

  return (
    <HeroSceneProvider>
      <div className={`hero-3d-canvas relative ${loaded ? 'hero-3d-loaded' : ''}`}>
        <SceneCanvas onReady={() => setLoaded(true)} />
        <HeroViewerHint />
        <Loader
          containerStyles={{ background: 'rgba(5, 8, 22, 0.85)' }}
          innerStyles={{ width: '220px', height: '2px', background: '#1e293b' }}
          barStyles={{ background: 'linear-gradient(90deg, #2563EB, #38BDF8)' }}
          dataStyles={{ color: '#94A3B8', fontSize: '12px', marginTop: '12px' }}
        />
      </div>
    </HeroSceneProvider>
  );
};
