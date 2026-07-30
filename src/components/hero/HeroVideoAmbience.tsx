import React, { useEffect, useRef, useState } from 'react';
import { CINEMATIC_DURATION } from './raceCinematic';
import referenceVideo from '../../assets/video animation.mp4';

export const HeroVideoAmbience: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.playbackRate = 1;
    video.play().catch(() => {});

    const onTime = () => {
      setProgress((video.currentTime / CINEMATIC_DURATION) * 100);
    };

    video.addEventListener('timeupdate', onTime);
    return () => video.removeEventListener('timeupdate', onTime);
  }, []);

  return (
    <>
      <video
        ref={videoRef}
        src={referenceVideo}
        muted
        loop
        playsInline
        autoPlay
        className="hero-ref-video absolute inset-0 w-full h-full object-cover opacity-[0.12] mix-blend-screen pointer-events-none z-[1]"
      />
      <div className="hero-cinematic-progress absolute bottom-4 left-1/2 -translate-x-1/2 z-30 w-48 md:w-64 h-[2px] bg-white/10 rounded-full overflow-hidden pointer-events-none">
        <div
          className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500 transition-[width] duration-300 ease-linear shadow-[0_0_8px_rgba(59,130,246,0.8)]"
          style={{ width: `${progress}%` }}
        />
      </div>
    </>
  );
};
