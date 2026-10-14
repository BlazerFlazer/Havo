'use client';

import { useEffect, useRef, useState } from 'react';
import { animate, useReducedMotion } from 'motion/react';
import { formatNumber } from '@/lib/format';
import styles from './IsoBars.module.css';

const W = 640;
const H = 300;
const BASE_Y = 250;
const DX = 16; // isometric depth offset
const DY = -10;

/** Animates an array of numbers towards a new target array. */
function useTweenedSeries(target) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(target);
  const fromRef = useRef(target);

  useEffect(() => {
    const from = fromRef.current;
    if (reduce) {
      fromRef.current = target;
      const raf = requestAnimationFrame(() => setShown(target));
      return () => cancelAnimationFrame(raf);
    }
    const controls = animate(0, 1, {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (t) => {
        const next = target.map((v, i) => {
          const a = from[i] ?? { kgLow: 0, kgHigh: 0 };
          return {
            ...v,
            kgLow: a.kgLow + (v.kgLow - a.kgLow) * t,
            kgHigh: a.kgHigh + (v.kgHigh - a.kgHigh) * t,
          };
        });
        fromRef.current = next;
        setShown(next);
      },
    });
    return () => controls.stop();
  }, [target, reduce]);

  return shown;
}

function column(x, w, base, h) {
  const top = base - h;
  return {
    front: `${x},${base} ${x + w},${base} ${x + w},${top} ${x},${top}`,
    side: `${x + w},${base} ${x + w + DX},${base + DY} ${x + w + DX},${top + DY} ${x + w},${top}`,
    top: `${x},${top} ${x + DX},${top + DY} ${x + w + DX},${top + DY} ${x + w},${top}`,
  };
}

/**
 * Isometric columns showing cumulative avoided CO₂ over time.
 * Solid part = lower estimate, translucent cap = upper estimate.
 */
export function IsoBars({ series }) {
  const data = useTweenedSeries(series);
  const max = Math.max(1e-6, ...series.map((s) => s.kgHigh));
  const n = data.length;
  const gap = n > 8 ? 10 : 18;
  const colW = Math.min(46, (W - 40 - gap * (n - 1) - DX) / n);
  const total = n * colW + (n - 1) * gap;
  const startX = (W - total - DX) / 2;
  const scale = (BASE_Y - 40) / max;
  const labelEvery = n > 8 ? 2 : 1;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg} aria-hidden="true">
      <defs>
        <linearGradient id="iso-front" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c9f78a" />
          <stop offset="100%" stopColor="#6fbf73" />
        </linearGradient>
      </defs>
      <line x1={20} x2={W - 20} y1={BASE_Y} y2={BASE_Y} className={styles.axis} />
      {data.map((d, i) => {
        const x = startX + i * (colW + gap);
        const hLow = Math.max(0, d.kgLow * scale);
        const hHigh = Math.max(hLow, d.kgHigh * scale);
        const solid = column(x, colW, BASE_Y, hLow);
        const ghost = hHigh - hLow > 0.5 ? column(x, colW, BASE_Y - hLow, hHigh - hLow) : null;
        const isLast = i === n - 1;
        return (
          <g key={d.week}>
            <polygon points={solid.side} className={styles.side} />
            <polygon points={solid.front} fill="url(#iso-front)" />
            <polygon points={solid.top} className={styles.top} />
            {ghost && (
              <g className={styles.ghost}>
                <polygon points={ghost.side} />
                <polygon points={ghost.front} />
                <polygon points={ghost.top} />
              </g>
            )}
            {(i % labelEvery === 0 || isLast) && (
              <text x={x + colW / 2} y={BASE_Y + 22} className={styles.label} textAnchor="middle">
                {d.week}
              </text>
            )}
            {isLast && (
              <text x={x + colW / 2 + DX / 2} y={BASE_Y - hHigh + DY - 12} className={styles.value} textAnchor="end">
                {ghost ? `${formatNumber(d.kgLow, 1)}–${formatNumber(d.kgHigh, 1)}` : formatNumber(d.kgHigh, 1)} кг
              </text>
            )}
          </g>
        );
      })}
      <text x={20} y={H - 6} className={styles.caption}>
        недели →
      </text>
    </svg>
  );
}
