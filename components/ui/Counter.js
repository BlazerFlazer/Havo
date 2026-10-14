'use client';

import { useEffect, useRef } from 'react';
import { animate, useInView, useReducedMotion } from 'motion/react';
import { formatNumber } from '@/lib/format';

/** Number that counts up when it scrolls into view (instant with reduced motion). */
export function Counter({ value, decimals = 0, duration = 1.4, className, suffix = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduce = useReducedMotion();
  const shown = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const write = (v) => {
      shown.current = v;
      el.textContent = `${formatNumber(v, decimals)}${suffix}`;
    };
    if (!inView) return undefined;
    if (reduce) {
      write(value);
      return undefined;
    }
    const controls = animate(shown.current, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: write,
    });
    return () => controls.stop();
  }, [inView, value, decimals, duration, reduce, suffix]);

  return (
    <span ref={ref} className={className}>
      {formatNumber(value, decimals)}
      {suffix}
    </span>
  );
}
