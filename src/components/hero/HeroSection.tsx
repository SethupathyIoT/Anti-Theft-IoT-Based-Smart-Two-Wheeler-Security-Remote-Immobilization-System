import React from 'react';

import { HeroBackgroundEffects } from './HeroBackgroundEffects';

import { Hero3DScene } from './Hero3DScene';

import { HeroSecurityOverlay } from './HeroSecurityOverlay';

import { HeroContentPanel } from './HeroContentPanel';



interface HeroSectionProps {

  onLaunchDashboard: () => void;

  onViewFirmware: () => void;

}



export const HeroSection: React.FC<HeroSectionProps> = ({

  onLaunchDashboard,

  onViewFirmware,

}) => {

  return (

    <div className="hero-section -mx-4 md:-mx-0 space-y-0">

      <section className="relative w-full overflow-hidden rounded-2xl md:rounded-3xl border border-blue-500/20 shadow-[0_0_60px_rgba(59,130,246,0.08)]">

        <div className="relative h-[55vh] min-h-[380px] sm:h-[62vh] md:h-[72vh] lg:h-[78vh] max-h-[820px]">

          <HeroBackgroundEffects />

          <HeroSecurityOverlay />



          <div className="absolute inset-0 z-10">

            <Hero3DScene />

          </div>



          <div className="absolute top-0 left-0 right-0 h-12 md:h-16 bg-gradient-to-b from-[#050816] to-transparent z-20 pointer-events-none" />

          <div className="absolute bottom-0 left-0 right-0 h-28 md:h-40 bg-gradient-to-t from-[#0B1220] via-[#0B1220]/90 to-transparent z-20 pointer-events-none" />

        </div>

      </section>



      <HeroContentPanel

        onLaunchDashboard={onLaunchDashboard}

        onViewFirmware={onViewFirmware}

      />

    </div>

  );

};

