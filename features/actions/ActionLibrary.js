'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { ACTIONS, ACTION_CATEGORIES, EFFECTS } from '@/data/actions';
import { ChoiceGroup } from '@/components/ui/ChoiceGroup';
import { Button } from '@/components/ui/Button';
import { pluralize } from '@/lib/format';
import { AddToPlanButton } from '@/features/planner/AddToPlanButton';
import { actionToPlanItem } from '@/features/planner/planItems';
import { openAction } from './actionSheetStore';
import { ActionMeta, EffectLabel } from './ActionMeta';
import styles from './ActionLibrary.module.css';

const CATEGORY_OPTIONS = [
  { value: 'all', label: 'Все', count: ACTIONS.length },
  ...ACTION_CATEGORIES.map((c) => ({
    value: c.id,
    label: c.label,
    count: ACTIONS.filter((a) => a.category === c.id).length,
  })),
];

const EFFECT_OPTIONS = [
  { value: 'all', label: 'Любой эффект' },
  ...Object.entries(EFFECTS).map(([id, e]) => ({ value: id, label: e.label })),
];

function ActionCard({ action, index }) {
  const category = ACTION_CATEGORIES.find((c) => c.id === action.category);
  return (
    <motion.li
      layout="position"
      className={styles.card}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className={styles.cardTop}>
        <span className={styles.cardIndex}>
          {String(index + 1).padStart(2, '0')} · {category.label}
        </span>
        <EffectLabel effect={action.effect} />
      </div>
      <h4 className={styles.cardTitle}>
        <button type="button" className={styles.cardLink} onClick={() => openAction(action.id)}>
          {action.title}
        </button>
      </h4>
      <p className={styles.cardSummary}>{action.summary}</p>
      <ActionMeta action={action} />
      <div className={styles.cardActions}>
        <Button size="sm" variant="ghost" icon={ArrowUpRight} onClick={() => openAction(action.id)}>
          Подробнее
          <span className="sr-only">: {action.title}</span>
        </Button>
        <AddToPlanButton item={actionToPlanItem(action)} />
      </div>
    </motion.li>
  );
}

/** Full catalogue of actions with category and effect filters. */
export function ActionLibrary() {
  const [category, setCategory] = useState('all');
  const [effect, setEffect] = useState('all');

  const visible = ACTIONS.filter(
    (a) => (category === 'all' || a.category === category) && (effect === 'all' || a.effect === effect),
  );

  return (
    <div className={styles.library}>
      <div className={styles.filters}>
        <ChoiceGroup label="Где действовать" options={CATEGORY_OPTIONS} value={category} onChange={setCategory} size="sm" />
        <ChoiceGroup label="Какой эффект" options={EFFECT_OPTIONS} value={effect} onChange={setEffect} size="sm" />
      </div>

      <p className={styles.summary} aria-live="polite">
        Показано: {pluralize(visible.length, ['действие', 'действия', 'действий'])}
      </p>

      {visible.length === 0 ? (
        <div className={styles.empty}>
          <p>В этой комбинации фильтров пока нет действий. Попробуй другой эффект или категорию.</p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setCategory('all');
              setEffect('all');
            }}
          >
            Сбросить фильтры
          </Button>
        </div>
      ) : (
        <ul className={styles.grid} role="list">
          <AnimatePresence mode="popLayout" initial={false}>
            {visible.map((action) => (
              <ActionCard key={action.id} action={action} index={ACTIONS.indexOf(action)} />
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
