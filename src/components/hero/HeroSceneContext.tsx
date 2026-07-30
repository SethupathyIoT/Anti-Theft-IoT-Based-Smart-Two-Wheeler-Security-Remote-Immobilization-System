import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

interface HeroSceneContextValue {
  isHovered: boolean;
  setIsHovered: (hovered: boolean) => void;
  isDragging: boolean;
  setIsDragging: (dragging: boolean) => void;
  registerResetView: (fn: () => void) => void;
  resetView: () => void;
}

const HeroSceneContext = createContext<HeroSceneContextValue | null>(null);

export const HeroSceneProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const resetViewRef = useRef<(() => void) | null>(null);

  const registerResetView = useCallback((fn: () => void) => {
    resetViewRef.current = fn;
  }, []);

  const resetView = useCallback(() => {
    resetViewRef.current?.();
  }, []);

  const value = useMemo(
    () => ({
      isHovered,
      setIsHovered,
      isDragging,
      setIsDragging,
      registerResetView,
      resetView,
    }),
    [isHovered, isDragging, registerResetView, resetView]
  );

  return <HeroSceneContext.Provider value={value}>{children}</HeroSceneContext.Provider>;
};

export function useHeroScene() {
  const ctx = useContext(HeroSceneContext);
  if (!ctx) throw new Error('useHeroScene must be used within HeroSceneProvider');
  return ctx;
}
