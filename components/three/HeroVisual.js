'use client';

import { Component, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useInViewport } from '@/hooks/useInViewport';
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery';
import { useIsClient } from '@/hooks/useIsClient';
import styles from './HeroVisual.module.css';

// The WebGL scene (three.js, R3F, map data) is code-split and client-only.
const HeroScene = dynamic(() => import('./HeroScene'), { ssr: false, loading: () => null });

let webglSupport = null;
function hasWebGL() {
  if (webglSupport !== null) return webglSupport;
  try {
    const canvas = document.createElement('canvas');
    webglSupport = Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    webglSupport = false;
  }
  return webglSupport;
}

/** Rough device tier: weaker devices get fewer particles and a lower pixel ratio. */
function detectQuality() {
  const small = window.matchMedia('(max-width: 767px)').matches;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const cores = navigator.hardwareConcurrency || 4;
  const memory = navigator.deviceMemory || 4;
  return small || coarse || cores <= 4 || memory <= 4 ? 'low' : 'high';
}

/** Any error inside the WebGL tree falls back to the CSS globe, never breaks the page. */
class SceneBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onError?.();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export function HeroVisual({ cleanTarget, scrollProgress }) {
  const containerRef = useRef(null);
  const labelRef = useRef(null);
  const pointer = useRef({ x: 0, y: 0 });
  const isClient = useIsClient();
  const reduced = usePrefersReducedMotion();
  const active = useInViewport(containerRef, { rootMargin: '0px' });
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  // Called every frame by the scene with the marker's screen position.
  const moveLabel = useCallback((x, y, opacity) => {
    const el = labelRef.current;
    if (!el) return;
    // Near the right edge the label flips to the left side of the marker.
    const flip = x > (el.parentElement?.clientWidth ?? 0) - 200;
    el.dataset.flip = flip ? 'true' : 'false';
    el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)${flip ? ' translateX(-100%)' : ''}`;
    el.style.opacity = opacity.toFixed(3);
  }, []);

  const env = useMemo(
    () => (isClient ? { webgl: hasWebGL(), quality: detectQuality() } : { webgl: false, quality: 'low' }),
    [isClient],
  );

  // Pointer parallax (fine pointers only; touch devices keep the scene steady).
  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return undefined;
    const onMove = (e) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  const showScene = env.webgl && !failed;

  return (
    <div
      ref={containerRef}
      className={styles.visual}
      data-ready={(ready && showScene) || undefined}
      role="img"
      aria-label="Трёхмерная Земля, на которой подсвечен Узбекистан. Вокруг планеты — частицы дымки, которые рассеиваются, когда воздух становится чище."
    >
      <div className={styles.fallback} data-clean={cleanTarget > 0.5 || undefined} aria-hidden="true">
        <div className={styles.fallbackGlow} />
        <div className={styles.fallbackSphere}>
          <span className={styles.fallbackDot} />
        </div>
      </div>
      {showScene && (
        <div className={styles.sceneLayer}>
          <SceneBoundary onError={() => setFailed(true)}>
            <HeroScene
              quality={env.quality}
              reduced={reduced}
              active={active}
              cleanTarget={cleanTarget}
              scrollProgress={scrollProgress}
              pointer={pointer}
              onMarkerMove={moveLabel}
              onReady={() => setReady(true)}
              onError={() => setFailed(true)}
            />
          </SceneBoundary>
          <div ref={labelRef} className={styles.label} aria-hidden="true">
            <span className={styles.labelLine} />
            <span className={styles.labelBody}>
              <span className={styles.labelName}>Узбекистан</span>
              <span className={styles.labelCoords}>41.3° N · 69.2° E</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
