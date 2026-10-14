'use client';

import { ShieldCheck, Package, Sparkles } from 'lucide-react';
import { ACTION_CATEGORIES, EFFECTS, getActionById } from '@/data/actions';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { AddToPlanButton } from '@/features/planner/AddToPlanButton';
import { actionToPlanItem } from '@/features/planner/planItems';
import { scrollToSection } from '@/lib/scroll';
import { closeAction, useOpenActionId } from './actionSheetStore';
import { ActionMeta, EffectLabel } from './ActionMeta';
import styles from './ActionSheet.module.css';

/** Detail drawer for one action. Mounted once per page. */
export function ActionSheet() {
  const openId = useOpenActionId();
  const action = openId ? getActionById(openId) : null;
  const category = action ? ACTION_CATEGORIES.find((c) => c.id === action.category) : null;

  const goToPlan = (e) => {
    e.preventDefault();
    closeAction();
    scrollToSection('progress', 60);
  };

  return (
    <Sheet
      open={Boolean(action)}
      onClose={closeAction}
      eyebrow={category?.long}
      title={action?.title ?? ''}
      footer={
        action && (
          <>
            <AddToPlanButton
              item={actionToPlanItem(action)}
              size="md"
              variant="primary"
              label="Добавить в мой план"
              onNavigate={goToPlan}
            />
            <Button variant="secondary" onClick={closeAction}>
              Закрыть
            </Button>
          </>
        )
      }
    >
      {action && (
        <div className={styles.content}>
          <div className={styles.metaRow}>
            <EffectLabel effect={action.effect} long />
            <ActionMeta action={action} showMode />
          </div>

          <p className={styles.description}>{action.description}</p>

          <section className={styles.benefit} aria-label="Возможная польза">
            <p className={styles.blockLabel}>
              <Sparkles size={15} aria-hidden="true" /> Честно о пользе
            </p>
            <p>{action.benefit}</p>
            <p className={styles.effectNote}>{EFFECTS[action.effect].description}</p>
          </section>

          <section aria-label="Шаги">
            <p className={styles.blockLabel}>Шаг за шагом</p>
            <ol className={styles.steps} role="list">
              {action.steps.map((s, i) => (
                <li key={i}>
                  <span className={styles.stepNum}>{i + 1}</span>
                  <p>{s}</p>
                </li>
              ))}
            </ol>
          </section>

          <div className={styles.twoCol}>
            <section aria-label="Что понадобится">
              <p className={styles.blockLabel}>
                <Package size={15} aria-hidden="true" /> Что понадобится
              </p>
              <ul className={styles.list} role="list">
                {action.materials.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </section>
            <section aria-label="Безопасность" className={styles.safety}>
              <p className={styles.blockLabel}>
                <ShieldCheck size={15} aria-hidden="true" /> Безопасность
              </p>
              <ul className={styles.list} role="list">
                {action.safety.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      )}
    </Sheet>
  );
}
