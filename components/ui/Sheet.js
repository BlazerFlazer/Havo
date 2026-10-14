'use client';

import { useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useIsPresent } from 'motion/react';
import { X } from 'lucide-react';
import { useDialogBehavior } from '@/hooks/useDialogBehavior';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useIsClient } from '@/hooks/useIsClient';
import styles from './Sheet.module.css';

const EASE = [0.22, 1, 0.36, 1];

function SheetPanel({ onClose, title, eyebrow, children, footer }) {
  const panelRef = useRef(null);
  const titleId = useId();
  const isMobile = useMediaQuery('(max-width: 639px)');
  // Release focus trap and scroll lock as soon as the exit animation starts.
  const isPresent = useIsPresent();
  useDialogBehavior(panelRef, isPresent, onClose);

  const offscreen = isMobile ? { y: '100%' } : { x: '100%' };

  return (
    <div className={styles.root}>
      <motion.div
        className={styles.overlay}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        onClick={onClose}
        aria-hidden="true"
      />
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`${styles.panel} theme-dark`}
        initial={{ ...offscreen, opacity: 0.6 }}
        animate={{ x: 0, y: 0, opacity: 1 }}
        exit={{ ...offscreen, opacity: 0.6 }}
        transition={{ duration: 0.42, ease: EASE }}
      >
        <header className={styles.header}>
          <div>
            {eyebrow && <p className="t-label">{eyebrow}</p>}
            <h2 id={titleId} className={styles.title}>
              {title}
            </h2>
          </div>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Закрыть">
            <X size={20} aria-hidden="true" />
          </button>
        </header>
        <div className={styles.body}>{children}</div>
        {footer && <footer className={styles.footer}>{footer}</footer>}
      </motion.div>
    </div>
  );
}

/** Side drawer on desktop, bottom sheet on mobile. */
export function Sheet({ open, ...props }) {
  const isClient = useIsClient();
  if (!isClient) return null;
  return createPortal(<AnimatePresence>{open && <SheetPanel {...props} />}</AnimatePresence>, document.body);
}
