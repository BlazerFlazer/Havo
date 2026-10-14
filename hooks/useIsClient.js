'use client';

import { useSyncExternalStore } from 'react';

const noopSubscribe = () => () => {};

/** False during SSR and hydration, true afterwards. Avoids hydration mismatches. */
export function useIsClient() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}
