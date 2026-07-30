import React from 'react';
import { Hand, RotateCcw, ZoomIn } from 'lucide-react';
import { useHeroScene } from './HeroSceneContext';

export const HeroViewerHint: React.FC = () => {
  const { isDragging, isHovered, resetView } = useHeroScene();
  const showHint = !isDragging;

  return (
    <>
      <div
        className={`hero-viewer-hint pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-center transition-opacity duration-500 ${
          showHint && !isHovered ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="hero-viewer-hint-ring mb-4 flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-black/20 backdrop-blur-sm">
          <Hand className="h-9 w-9 text-white/80" strokeWidth={1.5} />
        </div>
        <p className="text-sm font-medium tracking-wide text-white/90 md:text-base">click &amp; hold to rotate</p>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-white/50 md:text-sm">
          <ZoomIn className="h-3.5 w-3.5" />
          double-click to zoom into parts
        </p>
      </div>

      <button
        type="button"
        onClick={resetView}
        className="hero-viewer-reset absolute bottom-4 right-4 z-30 flex items-center gap-2 rounded-full border border-blue-500/30 bg-[#0B1220]/80 px-3 py-2 text-xs font-medium text-blue-200/90 backdrop-blur-sm transition hover:border-blue-400/50 hover:bg-[#0B1220] hover:text-white md:bottom-6 md:right-6 md:px-4 md:text-sm"
        aria-label="Reset camera view"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        Reset view
      </button>
    </>
  );
};
