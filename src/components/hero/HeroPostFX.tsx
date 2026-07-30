import React from 'react';
import { EffectComposer, Bloom, Vignette, SMAA, BrightnessContrast, HueSaturation } from '@react-three/postprocessing';
import { BlendFunction, KernelSize } from 'postprocessing';

/**
 * Post stack for the hero. Bloom does the heavy lifting on the emissive city
 * (windows, lamps, tail lights); the grade afterwards keeps blacks from crushing.
 */
export const HeroPostFX: React.FC = () => (
  <EffectComposer multisampling={0} enableNormalPass={false}>
    <Bloom
      intensity={0.42}
      luminanceThreshold={0.9}
      luminanceSmoothing={0.22}
      kernelSize={KernelSize.LARGE}
      mipmapBlur
    />
    <HueSaturation saturation={0.04} hue={0} />
    <BrightnessContrast brightness={0.005} contrast={0.1} />
    <Vignette offset={0.28} darkness={0.72} blendFunction={BlendFunction.NORMAL} />
    <SMAA />
  </EffectComposer>
);
