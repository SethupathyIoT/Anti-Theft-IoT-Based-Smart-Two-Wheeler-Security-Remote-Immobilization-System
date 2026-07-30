import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  glow: number;
}

export const HeroBackgroundEffects: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const particles: Particle[] = [];
    let width = 0;
    let height = 0;

    const resize = () => {
      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      canvas.width = width * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
      ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    };

    const initParticles = () => {
      particles.length = 0;
      const count = window.innerWidth < 768 ? 30 : 55;
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 2.2 + 0.4,
          speedX: (Math.random() - 0.5) * 0.25,
          speedY: (Math.random() - 0.5) * 0.25,
          opacity: Math.random() * 0.45 + 0.08,
          glow: Math.random() * 0.5 + 0.5,
        });
      }
    };

    const drawParticle = (p: Particle) => {
      const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
      gradient.addColorStop(0, `rgba(96, 165, 250, ${p.opacity * p.glow})`);
      gradient.addColorStop(0.5, `rgba(59, 130, 246, ${p.opacity * 0.4})`);
      gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(186, 230, 253, ${p.opacity})`;
      ctx.fill();
    };

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p, i) => {
        p.x += p.speedX;
        p.y += p.speedY;
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10;
        if (p.y > height + 10) p.y = -10;

        drawParticle(p);

        const next = particles[(i + 1) % particles.length];
        const dist = Math.hypot(p.x - next.x, p.y - next.y);
        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(next.x, next.y);
          ctx.strokeStyle = `rgba(59, 130, 246, ${0.06 * (1 - dist / 120)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      });

      animationId = requestAnimationFrame(animate);
    };

    const onResize = () => {
      resize();
      initParticles();
    };

    resize();
    initParticles();
    animate();
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <div className="hero-bg-effects absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-b from-[#050816] via-[#0a1020] to-[#0B1220]" />

      <div className="hero-gradient-orb hero-gradient-orb-1" />
      <div className="hero-gradient-orb hero-gradient-orb-2" />
      <div className="hero-gradient-orb hero-gradient-orb-3" />

      <div className="hero-grid absolute inset-0 opacity-[0.12]" />

      <div className="hero-streak hero-streak-1" />
      <div className="hero-streak hero-streak-2" />
      <div className="hero-streak hero-streak-3" />

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-70" />

      <div className="absolute inset-0 hero-subtle-vignette" />

      <div className="absolute top-6 left-6 hidden md:block">
        <div className="hero-hud-corner w-16 h-16 border-l-2 border-t-2 border-blue-500/25" />
        <span className="absolute top-2 left-6 text-[9px] font-mono text-blue-400/40 tracking-widest">SYS.ONLINE</span>
      </div>
      <div className="absolute top-6 right-6 hidden md:block">
        <div className="hero-hud-corner w-16 h-16 border-r-2 border-t-2 border-blue-500/25 ml-auto" />
        <span className="absolute top-2 right-6 text-[9px] font-mono text-emerald-400/40 tracking-widest">GPS:LOCK</span>
      </div>
      <div className="absolute bottom-6 left-6 hidden md:block">
        <div className="hero-hud-corner w-16 h-16 border-l-2 border-b-2 border-blue-500/25" />
        <span className="absolute bottom-2 left-6 text-[9px] font-mono text-blue-400/40 tracking-widest">3D.TRACK</span>
      </div>
      <div className="absolute bottom-6 right-6 hidden md:block">
        <div className="hero-hud-corner w-16 h-16 border-r-2 border-b-2 border-blue-500/25 ml-auto" />
        <span className="absolute bottom-2 right-6 text-[9px] font-mono text-blue-400/40 tracking-widest">SEC.ACTIVE</span>
      </div>
    </div>
  );
};
