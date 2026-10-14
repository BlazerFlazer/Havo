'use client';

import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, Info, TriangleAlert, X } from 'lucide-react';
import { dismissToast, useToast } from '@/features/feedback/toast';
import styles from './Toaster.module.css';

const ICONS = { success: CheckCircle2, info: Info, error: TriangleAlert };

/** Renders the single active toast. The live region is always mounted. */
export function Toaster() {
  const toast = useToast();
  const Icon = toast ? (ICONS[toast.tone] ?? Info) : null;
  return (
    <div className={styles.region} role="status" aria-live="polite">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            className={`${styles.toast} ${styles[toast.tone] ?? ''}`}
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          >
            <Icon size={18} aria-hidden="true" className={styles.icon} />
            <span>{toast.message}</span>
            <button type="button" className={styles.close} onClick={dismissToast} aria-label="Закрыть уведомление">
              <X size={16} aria-hidden="true" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
