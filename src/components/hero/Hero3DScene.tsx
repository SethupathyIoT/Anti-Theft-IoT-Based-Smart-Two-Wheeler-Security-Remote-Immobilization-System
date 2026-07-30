import React, { Suspense, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Lightformer, Sparkles, Stars, Loader } from '@react-three/drei';
import * as THREE from 'three';
import { BikeModel } from './BikeModel';
import { BikeModelBoundary } from './BikeModelBoundary';
import { BikeOrbitControls } from './BikeOrbitControls';
import { ShowcaseEnvironment } from './ShowcaseEnvironment';
import { CityEnvironment, CityFog } from './city/CityEnvironment';
import { HeroPostFX } from './HeroPostFX';
import { HeroSceneProvider, useHeroScene } from './HeroSceneContext';
import { HeroViewerHint } from './HeroViewerHint';

/**
 * Studio reflections built entirely in-scene — no HDRI download, so the paint and
 * chrome get real highlights without depending on an asset CDN.
 */
const StudioReflections: React.FC = () => (
  <Environment resolution={256} frames={1}>
    <color attach="background" args={['#05070d']} />
    {/* Overhead softbox: the long highlight that runs down the tank and fairing. */}
    <Lightformer form="rect" intensity={2.6} color="#dbeafe" scale={[9, 3, 1]} position={[0, 6, 1]} rotation={[-Math.PI / 2, 0, 0]} />
    {/* Cool rim from behind, warm street bounce from the front. */}
    <Lightformer form="rect" intensity={3.2} color="#3b82f6" scale={[7, 2, 1]} position={[-5, 3, -5]} rotation={[0, Math.PI / 4, 0]} />
    <Lightformer form="rect" intensity={2.2} color="#f8b878" scale={[6, 2, 1]} position={[5, 2.4, 4]} rotation={[0, -Math.PI / 3, 0]} />
    <Lightformer form="ring" intensity={1.6} color="#22d3ee" scale={3} position={[4, 4, -6]} />
    <Lightformer form="rect" intensity={0.8} color="#1e293b" scale={[14, 8, 1]} position={[0, 2, -10]} />
  </Environment>
);

/** Key/fill/rim rig aimed at the stage, plus the ambient the city sits in. */
const HeroLightRig: React.FC = () => {
  const rimRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    if (!rimRef.current) return;
    const t = clock.getElapsedTime();
    rimRef.current.position.set(Math.cos(t * 0.4) * 6, 2.9 + Math.sin(t * 0.8) * 0.4, Math.sin(t * 0.4) * 6);
    rimRef.current.intensity = 26 + Math.sin(t * 1.6) * 6;
  });

  return (
    <>
      <ambientLight intensity={0.22} color="#8fb3ff" />
      <hemisphereLight intensity={0.35} color="#1e3a8a" groundColor="#05070c" />

      {/* Key: hard spot from front-left, the source of the bike's cast shadow.
          Every spot here aims at the default target (world origin) — the bike's stage —
          because a spotlight target only tracks if it is itself in the scene graph. */}
      <spotLight
        position={[-5.5, 9, 6]}
        angle={0.42}
        penumbra={0.75}
        intensity={190}
        distance={40}
        decay={1.4}
        color="#eaf2ff"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0012}
        shadow-normalBias={0.02}
      />

      {/* Fill: broad and cool, keeps the shadow side readable. */}
      <spotLight
        position={[6.5, 6.5, 4.5]}
        angle={0.65}
        penumbra={1}
        intensity={105}
        distance={34}
        decay={1.5}
        color="#bcd9ff"
      />

      {/* Kicker from behind, separating the bike from the street. */}
      <spotLight
        position={[2.5, 4.2, -7]}
        angle={0.7}
        penumbra={1}
        intensity={55}
        distance={26}
        decay={1.6}
        color="#2563eb"
      />

      <pointLight ref={rimRef} color="#60a5fa" distance={20} decay={1.8} />
    </>
  );
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
      <CityFog />
      <StudioReflections />
      <HeroLightRig />

      <Stars radius={140} depth={50} count={900} factor={4} saturation={0.15} fade speed={0.5} />
      <CityEnvironment />
      <ShowcaseEnvironment />

      <BikeModelBoundary>
        <Suspense fallback={null}>
          <BikeModel />
        </Suspense>
      </BikeModelBoundary>

      <Sparkles count={70} scale={[16, 6, 16]} position={[0, 2, 0]} size={1.6} speed={0.28} color="#7dd3fc" opacity={0.5} />

      <HeroPostFX />
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
        shadows="soft"
        dpr={[1, 1.75]}
        camera={{ position: [1.5, 2.1, 11], fov: 40, near: 0.1, far: 400 }}
        gl={{
          antialias: false,
          alpha: true,
          powerPreference: 'high-performance',
          stencil: false,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.08,
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
