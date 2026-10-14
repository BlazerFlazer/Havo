'use client';

import { useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useIsPresent } from 'motion/react';
import { useDialogBehavior } from '@/hooks/useDialogBehavior';
import { useIsClient } from '@/hooks/useIsClient';
import { Button } from './Button';
import styles from './ConfirmDialog.module.css';

function DialogPanel({ title, description, confirmLabel, cancelLabel, onConfirm, onCancel, tone }) {
  const panelRef = useRef(null);
  const titleId = useId();
  const descId = useId();
  const isPresent = useIsPresent();
  useDialogBehavior(panelRef, isPresent, onCancel);

  return (
    <div className={styles.root}>
      <motion.div
        className={styles.overlay}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onCancel}
        aria-hidden="true"
      />
      <motion.div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        tabIndex={-1}
        className={`${styles.panel} theme-dark`}
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.98 }}
        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      >
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        <p id={descId} className={styles.text}>
          {description}
        </p>
        <div className={styles.actions}>
          <Button variant="secondary" onClick={onCancel} data-autofocus>
            {cancelLabel}
          </Button>
          <Button variant={tone === 'danger' ? 'dangerSolid' : 'primary'} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

/** Confirmation dialog for destructive actions. Cancel is focused by default. */
export function ConfirmDialog({ open, cancelLabel = 'Отмена', tone = 'danger', ...props }) {
  const isClient = useIsClient();
  if (!isClient) return null;
  return createPortal(
    <AnimatePresence>{open && <DialogPanel cancelLabel={cancelLabel} tone={tone} {...props} />}</AnimatePresence>,
    document.body,
  );
}
