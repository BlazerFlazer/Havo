'use client';

// Cinematic hero globe (React Three Fiber). Loaded lazily by HeroVisual and
// never rendered on the server. All text and controls live outside the canvas.

import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import {
  AdditiveBlending,
  BackSide,
  BufferAttribute,
  BufferGeometry,
  MathUtils,
  NormalBlending,
  Quaternion,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
  Color,
} from 'three';
import { atmosphereShader, cloudShader, dustShader, earthShader, hazeShader } from './shaders';
import { createEarthMaskTexture, latLonToVector, TASHKENT } from './earthMask';
import styles from './HeroScene.module.css';

const SUN_DIR = new Vector3(-0.85, 0.45, 0.65).normalize();
const ATMOSPHERE_SCALE = 1.14;
// How far (radians) Uzbekistan sits left of the visible centre of the disc,
// i.e. towards the headline.
const MARKER_OFFSET = 0.28;
const TILT = 0.5; // tilt the northern hemisphere towards the camera
const CAMERA_Z = 6;

const QUALITY = {
  high: { segments: 128, cloudSegments: 96, haze: 2600, dust: 1100, octaves: 5, mask: 2048, dpr: [1, 1.75] },
  low: { segments: 72, cloudSegments: 56, haze: 900, dust: 380, octaves: 3, mask: 1024, dpr: [1, 1.25] },
};

// Deterministic PRNG so particle layouts are stable between renders.
function mulberry32(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomUnitVector(rand) {
  const u = rand() * 2 - 1;
  const theta = rand() * Math.PI * 2;
  const s = Math.sqrt(1 - u * u);
  return [s * Math.cos(theta), u, s * Math.sin(theta)];
}

function createHazeGeometry(count) {
  const rand = mulberry32(7);
  const positions = new Float32Array(count * 3);
  const randoms = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const [x, y, z] = randomUnitVector(rand);
    const r = 1.025 + Math.pow(rand(), 1.7) * 0.5;
    positions.set([x * r, y * r, z * r], i * 3);
    randoms.set([rand(), rand(), rand()], i * 3);
  }
  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(positions, 3));
  geo.setAttribute('aRand', new BufferAttribute(randoms, 3));
  return geo;
}

function createDustGeometry(count) {
  const rand = mulberry32(21);
  const positions = new Float32Array(count * 3);
  const randoms = new Float32Array(count * 2);
  for (let i = 0; i < count; i++) {
    const [x, y, z] = randomUnitVector(rand);
    const r = 4 + rand() * 7;
    // Keep the field behind the planet and well in front of the near plane.
    positions.set([x * r, y * r * 0.7, z * r * 0.6 - 5], i * 3);
    randoms.set([rand(), rand()], i * 2);
  }
  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(positions, 3));
  geo.setAttribute('aRand', new BufferAttribute(randoms, 2));
  return geo;
}

/** Position, scale and offset of the globe for the current canvas aspect ratio. */
function useLayout() {
  const viewport = useThree((s) => s.viewport);
  const size = useThree((s) => s.size);
  const aspect = size.width / Math.max(1, size.height);
  if (aspect >= 1.15) {
    return { x: viewport.width * 0.2, y: -viewport.height * 0.02, r: Math.min(viewport.height * 0.33, viewport.width * 0.21) };
  }
  if (aspect >= 0.8) {
    return { x: viewport.width * 0.2, y: viewport.height * 0.14, r: viewport.height * 0.27 };
  }
  if (size.width >= 600) {
    // Portrait tablets: a smaller globe in the upper right, above the headline.
    return { x: viewport.width * 0.16, y: viewport.height * 0.2, r: viewport.width * 0.36 };
  }
  return { x: viewport.width * 0.24, y: viewport.height * 0.25, r: viewport.width * 0.5 };
}

const tmpMarker = new Vector3();
const tmpCenter = new Vector3();
const tmpToCamera = new Vector3();

function Globe({ quality, reduced, cleanTarget, scrollProgress, pointer, onMarkerMove }) {
  const q = QUALITY[quality];
  const layout = useLayout();
  const invalidate = useThree((s) => s.invalidate);
  const pixelRatio = useThree((s) => s.viewport.dpr);
  const size = useThree((s) => s.size);

  const rootRef = useRef(null);
  const spinRef = useRef(null);
  const tiltRef = useRef(null);
  const cloudsRef = useRef(null);
  const pulseRef = useRef(null);
  const markerRef = useRef(null);
  const earthRef = useRef(null);
  const atmosphereRef = useRef(null);
  const hazeRef = useRef(null);
  const dustRef = useRef(null);
  const state = useRef({ clean: reduced ? cleanTarget : 0, intro: reduced ? 1 : 0 });

  const markerPos = useMemo(() => new Vector3(...latLonToVector(TASHKENT.lat, TASHKENT.lon, 1.004)), []);
  const markerQuat = useMemo(
    () => new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), markerPos.clone().normalize()),
    [markerPos],
  );
  // Spin that brings Uzbekistan to the visible centre of the disc. The camera
  // looks at the origin while the globe sits off-centre, so we compensate for
  // the viewing angle, then nudge the marker towards the headline.
  const baseSpin = useMemo(
    () => -Math.atan2(markerPos.x, markerPos.z) - Math.atan2(layout.x, CAMERA_Z) - MARKER_OFFSET,
    [markerPos, layout.x],
  );

  const resources = useMemo(() => {
    const mask = createEarthMaskTexture(q.mask);
    const defines = { OCTAVES: q.octaves };
    const earth = new ShaderMaterial({
      ...earthShader,
      defines,
      uniforms: {
        uMask: { value: mask },
        uMaskReady: { value: mask ? 1 : 0 },
        uTime: { value: 0 },
        uClean: { value: 0 },
        uSunDir: { value: SUN_DIR },
      },
    });
    const clouds = new ShaderMaterial({
      ...cloudShader,
      defines,
      transparent: true,
      depthWrite: false,
      uniforms: { uTime: { value: 0 }, uClean: { value: 0 }, uSunDir: { value: SUN_DIR } },
    });
    const atmosphere = new ShaderMaterial({
      ...atmosphereShader,
      side: BackSide,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      uniforms: {
        uClean: { value: 0 },
        uEdge: { value: Math.sqrt(1 - 1 / (ATMOSPHERE_SCALE * ATMOSPHERE_SCALE)) },
        uSunDir: { value: SUN_DIR },
      },
    });
    const haze = new ShaderMaterial({
      ...hazeShader,
      transparent: true,
      depthWrite: false,
      blending: NormalBlending,
      uniforms: {
        uTime: { value: 0 },
        uClean: { value: 0 },
        uSize: { value: quality === 'high' ? 3.2 : 3.8 },
        uPixelRatio: { value: 1 },
        uHazeColor: { value: new Color(0.78, 0.58, 0.34) },
        uCleanColor: { value: new Color(0.74, 0.96, 0.5) },
      },
    });
    const dust = new ShaderMaterial({
      ...dustShader,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uSize: { value: 2.4 },
        uPixelRatio: { value: 1 },
        uColor: { value: new Color(0.82, 0.95, 0.86) },
      },
    });
    return {
      mask,
      earth,
      clouds,
      atmosphere,
      haze,
      dust,
      sphere: new SphereGeometry(1, q.segments, q.segments / 2),
      cloudSphere: new SphereGeometry(1, q.cloudSegments, q.cloudSegments / 2),
      shell: new SphereGeometry(1, 64, 32),
      hazeGeo: createHazeGeometry(q.haze),
      dustGeo: createDustGeometry(q.dust),
    };
  }, [q, quality]);

  // Free GPU memory when the scene unmounts or the quality tier changes.
  useEffect(
    () => () => {
      Object.values(resources).forEach((r) => r?.dispose?.());
    },
    [resources],
  );

  // In reduced-motion mode the loop is on demand: re-render when inputs change.
  useEffect(() => {
    if (reduced) invalidate();
  }, [reduced, cleanTarget, layout, invalidate]);

  useFrame(({ clock, camera }, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const t = clock.elapsedTime;
    const s = state.current;
    const scroll = scrollProgress?.get?.() ?? 0;
    const p = pointer.current;

    const target = Math.max(cleanTarget, MathUtils.clamp((scroll - 0.12) * 1.8, 0, 1));
    if (reduced) {
      s.clean = target;
      s.intro = 1;
    } else {
      s.clean = MathUtils.damp(s.clean, target, 1.3, delta);
      s.intro = Math.min(1, s.intro + delta / 2.6);
    }
    const intro = 1 - Math.pow(1 - s.intro, 3);

    // Uniforms are updated through the scene objects (refs), not React state.
    const earth = earthRef.current?.material;
    const clouds = cloudsRef.current?.material;
    const atmosphere = atmosphereRef.current?.material;
    const haze = hazeRef.current?.material;
    const dust = dustRef.current?.material;
    if (earth) {
      earth.uniforms.uTime.value = t;
      earth.uniforms.uClean.value = s.clean;
    }
    if (clouds) {
      clouds.uniforms.uTime.value = t;
      clouds.uniforms.uClean.value = s.clean;
    }
    if (atmosphere) atmosphere.uniforms.uClean.value = s.clean;
    if (haze) {
      haze.uniforms.uTime.value = reduced ? 0 : t;
      haze.uniforms.uClean.value = s.clean;
      haze.uniforms.uPixelRatio.value = pixelRatio;
    }
    if (dust) {
      dust.uniforms.uTime.value = reduced ? 0 : t;
      dust.uniforms.uPixelRatio.value = pixelRatio;
    }

    const sway = reduced ? 0 : Math.sin(t * 0.09) * 0.3;
    if (spinRef.current) {
      const goal = baseSpin + sway + (reduced ? 0 : p.x * 0.12) + (1 - intro) * 0.9;
      spinRef.current.rotation.y = reduced ? goal : MathUtils.damp(spinRef.current.rotation.y, goal, 3, delta);
    }
    if (tiltRef.current) {
      tiltRef.current.rotation.x = TILT + (reduced ? 0 : p.y * 0.06);
    }
    if (cloudsRef.current && !reduced) cloudsRef.current.rotation.y += delta * 0.012;

    if (rootRef.current) {
      rootRef.current.position.set(layout.x, layout.y - scroll * 0.7, 0);
      rootRef.current.scale.setScalar(layout.r * (0.9 + 0.1 * intro));
    }

    if (pulseRef.current) {
      const k = reduced ? 0.4 : (t * 0.6) % 1;
      pulseRef.current.scale.setScalar(1 + k * 2.2);
      pulseRef.current.material.opacity = 0.75 * (1 - k);
    }

    if (!reduced) {
      camera.position.x = MathUtils.damp(camera.position.x, p.x * 0.25, 2, delta);
      camera.position.y = MathUtils.damp(camera.position.y, -p.y * 0.16, 2, delta);
    }
    camera.position.z = CAMERA_Z + scroll * 0.6;
    camera.lookAt(0, 0, 0);

    // Project the marker to screen space so the DOM label (kept outside the
    // canvas for accessibility and crisp text) can follow it.
    if (onMarkerMove && markerRef.current && rootRef.current) {
      markerRef.current.getWorldPosition(tmpMarker);
      rootRef.current.getWorldPosition(tmpCenter);
      tmpToCamera.copy(camera.position).sub(tmpMarker).normalize();
      const facing = tmpCenter.subVectors(tmpMarker, tmpCenter).normalize().dot(tmpToCamera);
      tmpMarker.project(camera);
      onMarkerMove(
        (tmpMarker.x * 0.5 + 0.5) * size.width,
        (-tmpMarker.y * 0.5 + 0.5) * size.height,
        MathUtils.clamp((facing - 0.15) * 4, 0, 1) * intro,
      );
    }
  });

  return (
    <>
      <points ref={dustRef} geometry={resources.dustGeo} material={resources.dust} frustumCulled={false} />
      <group ref={rootRef} position={[layout.x, layout.y, 0]} scale={layout.r}>
        <mesh ref={atmosphereRef} geometry={resources.shell} material={resources.atmosphere} scale={ATMOSPHERE_SCALE} />
        <group ref={tiltRef} rotation-x={TILT}>
          <group ref={spinRef} rotation-y={baseSpin + 0.9}>
            <mesh ref={earthRef} geometry={resources.sphere} material={resources.earth} />
            <mesh ref={cloudsRef} geometry={resources.cloudSphere} material={resources.clouds} scale={1.014} />
            <group ref={markerRef} position={markerPos} quaternion={markerQuat}>
              <mesh>
                <circleGeometry args={[0.012, 24]} />
                <meshBasicMaterial color="#e9ffd0" toneMapped={false} />
              </mesh>
              <mesh ref={pulseRef}>
                <ringGeometry args={[0.018, 0.024, 48]} />
                <meshBasicMaterial color="#e9ffd0" toneMapped={false} transparent depthWrite={false} />
              </mesh>
            </group>
          </group>
          <points ref={hazeRef} geometry={resources.hazeGeo} material={resources.haze} frustumCulled={false} />
        </group>
      </group>
    </>
  );
}

export default function HeroScene({
  quality: initialQuality,
  reduced,
  active,
  cleanTarget,
  scrollProgress,
  pointer,
  onMarkerMove,
  onReady,
  onError,
}) {
  const [quality, setQuality] = useState(initialQuality);
  const [dpr, setDpr] = useState(QUALITY[initialQuality].dpr);
  const frameloop = reduced ? 'demand' : active ? 'always' : 'never';

  return (
    <Canvas
      className={styles.canvas}
      frameloop={frameloop}
      dpr={dpr}
      camera={{ position: [0, 0, CAMERA_Z], fov: 35, near: 0.1, far: 60 }}
      gl={{ antialias: quality === 'high', alpha: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
        gl.domElement.addEventListener('webglcontextlost', (e) => {
          e.preventDefault();
          onError?.();
        });
        // Give the first frames a moment to compile shaders before fading in.
        requestAnimationFrame(() => requestAnimationFrame(() => onReady?.()));
      }}
      aria-hidden="true"
    >
      <PerformanceMonitor
        onDecline={() => {
          setDpr([1, 1]);
          setQuality('low');
        }}
        flipflops={2}
      />
      <Globe
        key={quality}
        quality={quality}
        reduced={reduced}
        cleanTarget={cleanTarget}
        scrollProgress={scrollProgress}
        pointer={pointer}
        onMarkerMove={onMarkerMove}
      />
    </Canvas>
  );
}
