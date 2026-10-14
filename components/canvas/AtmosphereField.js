'use client';

import { useEffect, useRef } from 'react';
import { useInViewport } from '@/hooks/useInViewport';
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery';

// Lightweight 2D particle field. Particles drift like airborne dust, shy away
// from the pointer and shift from a dusty amber to clean green as the visitor
// scrolls through the section (`progress` is a motion value 0..1).

const HAZE = [214, 160, 92];
const CLEAN = [184, 243, 107];

function mix(a, b, t) {
  return Math.round(a + (b - a) * t);
}

export function AtmosphereField({ progress, className }) {
  const canvasRef = useRef(null);
  const visible = useInViewport(canvasRef, { rootMargin: '80px 0px' });
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !visible) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    let width = 0;
    let height = 0;
    let particles = [];
    let raf = 0;
    const pointer = { x: -9999, y: -9999 };

    const seed = (count) => {
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.12,
        vy: -0.05 - Math.random() * 0.18,
        r: 0.6 + Math.random() * 2.2,
        a: 0.15 + Math.random() * 0.45,
        phase: Math.random() * Math.PI * 2,
      }));
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(170, Math.round((width * height) / 8000));
      seed(count);
    };

    const draw = (t) => {
      const p = Math.min(1, Math.max(0, progress?.get?.() ?? 0));
      const color = HAZE.map((c, i) => mix(c, CLEAN[i], p));
      ctx.clearRect(0, 0, width, height);
      for (const pt of particles) {
        if (!reduced) {
          const dx = pt.x - pointer.x;
          const dy = pt.y - pointer.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 14000) {
            const f = (1 - d2 / 14000) * 0.6;
            const d = Math.sqrt(d2) || 1;
            pt.x += (dx / d) * f * 2;
            pt.y += (dy / d) * f * 2;
          }
          pt.x += pt.vx + Math.sin(t * 0.0004 + pt.phase) * 0.12;
          pt.y += pt.vy * (1 + p);
          if (pt.y < -10) pt.y = height + 10;
          if (pt.x < -10) pt.x = width + 10;
          if (pt.x > width + 10) pt.x = -10;
        }
        // Dust gets sparser and finer as the "air clears".
        const alpha = pt.a * (1 - p * 0.55);
        const r = pt.r * (1 - p * 0.35);
        ctx.beginPath();
        ctx.fillStyle = `rgba(${color[0]},${color[1]},${color[2]},${alpha.toFixed(3)})`;
        ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      if (!reduced) raf = requestAnimationFrame(draw);
    };

    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
    };
    const onLeave = () => {
      pointer.x = -9999;
      pointer.y = -9999;
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerleave', onLeave);
    raf = requestAnimationFrame(draw);
    // Reduced motion: redraw a static frame when the scroll position changes.
    const unsubscribe = reduced && progress?.on ? progress.on('change', () => requestAnimationFrame(draw)) : null;

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
      unsubscribe?.();
    };
  }, [visible, reduced, progress]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
