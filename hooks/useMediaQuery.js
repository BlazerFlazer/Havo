'use client';

import { useCallback, useSyncExternalStore } from 'react';

/** Subscribes to a CSS media query. Returns `serverValue` during SSR/hydration. */
export function useMediaQuery(query, serverValue = false) {
  const subscribe = useCallback(
    (callback) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', callback);
      return () => mql.removeEventListener('change', callback);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => serverValue,
  );
}

export function usePrefersReducedMotion() {
  return useMediaQuery('(prefers-reduced-motion: reduce)', false);
}
