'use client';

import { useId, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, Clock, Plus, Users } from 'lucide-react';
import { INITIATIVES, INITIATIVE_CATEGORIES } from '@/data/initiatives';
import { DifficultyBars } from '@/features/actions/ActionMeta';
import { AddToPlanButton } from '@/features/planner/AddToPlanButton';
import { initiativeToPlanItem } from '@/features/planner/planItems';
import { havoActions, useHavoState } from '@/features/progress/store';
import styles from './InitiativeList.module.css';

function Checklist({ initiative }) {
  const { checklists } = useHavoState();
  const checked = checklists[initiative.id] ?? [];
  const done = checked.length;

  return (
    <fieldset className={styles.checklist}>
      <legend className={styles.colLabel}>
        Чек-лист безопасности · {done}/{initiative.checklist.length}
      </legend>
      {initiative.checklist.map((item, i) => {
        const on = checked.includes(i);
        return (
          <label key={item} className={styles.check} data-on={on || undefined}>
            <input
              type="checkbox"
              checked={on}
              onChange={() => havoActions.toggleChecklist(initiative.id, i)}
              className={styles.checkInput}
            />
            <span className={styles.box} aria-hidden="true">
              {on && <Check size={14} strokeWidth={3} />}
            </span>
            <span>{item}</span>
          </label>
        );
      })}
      <p className={styles.checkNote}>Отметки сохраняются в этом браузере.</p>
    </fieldset>
  );
}

function InitiativeRow({ initiative, index, open, onToggle }) {
  const id = useId();
  return (
    <li className={styles.row} data-open={open || undefined}>
      <h3 className={styles.rowHeading}>
        <button
          type="button"
          className={styles.trigger}
          aria-expanded={open}
          aria-controls={`${id}-panel`}
          id={`${id}-btn`}
          onClick={onToggle}
        >
          <span className={styles.num} aria-hidden="true">
            {String(index + 1).padStart(2, '0')}
          </span>
          <span className={styles.head}>
            <span className={styles.cat}>{INITIATIVE_CATEGORIES[initiative.category]}</span>
            <span className={styles.name}>{initiative.name}</span>
            <span className={styles.tagline}>{initiative.tagline}</span>
          </span>
          <span className={styles.meta}>
            <DifficultyBars level={initiative.difficulty} />
          </span>
          <span className={styles.icon} aria-hidden="true">
            <Plus size={20} />
          </span>
        </button>
      </h3>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={`${id}-panel`}
            role="region"
            aria-labelledby={`${id}-btn`}
            className={styles.panel}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className={styles.panelInner}>
              <p className={styles.description}>{initiative.description}</p>
              <ul className={styles.facts} role="list">
                <li>
                  <Clock size={15} aria-hidden="true" /> {initiative.duration}
                </li>
                <li>
                  <Users size={15} aria-hidden="true" /> {initiative.participants}
                </li>
              </ul>
              <div className={styles.grid}>
                <div>
                  <p className={styles.colLabel}>План</p>
                  <ol className={styles.steps} role="list">
                    {initiative.steps.map((s, i) => (
                      <li key={s}>
                        <span className={styles.stepNum}>{i + 1}</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ol>
                </div>
                <div className={styles.stack}>
                  <div>
                    <p className={styles.colLabel}>Роли</p>
                    <ul className={styles.roles} role="list">
                      {initiative.roles.map((r) => (
                        <li key={r.title}>
                          <strong>{r.title}</strong> — {r.text}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className={styles.colLabel}>Материалы</p>
                    <ul className={styles.materials} role="list">
                      {initiative.materials.map((m) => (
                        <li key={m}>{m}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className={styles.stack}>
                  <Checklist initiative={initiative} />
                  <div className={styles.outcome}>
                    <p className={styles.colLabel}>Реалистичный результат</p>
                    <p>{initiative.outcome}</p>
                  </div>
                  <AddToPlanButton item={initiativeToPlanItem(initiative)} size="md" variant="primary" label="Добавить в мой план" />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

export function InitiativeList() {
  const [openId, setOpenId] = useState(INITIATIVES[0].id);
  return (
    <ol className={styles.list} role="list">
      {INITIATIVES.map((initiative, i) => (
        <InitiativeRow
          key={initiative.id}
          initiative={initiative}
          index={i}
          open={openId === initiative.id}
          onToggle={() => setOpenId((cur) => (cur === initiative.id ? null : initiative.id))}
        />
      ))}
    </ol>
  );
}
