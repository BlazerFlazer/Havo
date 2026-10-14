'use client';

import { useEffect, useState } from 'react';

/**
 * Tracks whether an element is (roughly) on screen. Used to pause canvas and
 * WebGL animation loops when they are not visible.
 */
export function useInViewport(ref, { rootMargin = '120px 0px', threshold = 0 } = {}) {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      rootMargin,
      threshold,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, rootMargin, threshold]);

  return inView;
}
