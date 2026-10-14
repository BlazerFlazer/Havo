'use client';

import { MotionConfig } from 'motion/react';
import { Toaster } from '@/components/ui/Toaster';

/** Client-side providers: honours prefers-reduced-motion for every motion component. */
export function Providers({ children }) {
  return (
    <MotionConfig reducedMotion="user">
      {children}
      <Toaster />
    </MotionConfig>
  );
}
