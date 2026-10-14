'use client';

import { useId, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Plus } from 'lucide-react';
import { FACTORS, FACTOR_KINDS } from '@/data/pollution';
import { ChoiceGroup } from '@/components/ui/ChoiceGroup';
import styles from './FactorsList.module.css';

const FILTERS = [
  { value: 'all', label: 'Всё' },
  { value: 'source', label: 'Источники выбросов' },
  { value: 'condition', label: 'Условия' },
  { value: 'urban', label: 'Город' },
];

function FactorRow({ factor, index, open, onToggle }) {
  const baseId = useId();
  const panelId = `${baseId}-panel`;
  const buttonId = `${baseId}-button`;

  return (
    <li className={styles.row} data-open={open || undefined} data-kind={factor.kind}>
      <h3 className={styles.rowHeading}>
        <button
          type="button"
          id={buttonId}
          className={styles.trigger}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
        >
          <span className={styles.num}>{String(index + 1).padStart(2, '0')}</span>
          <span className={styles.titleBlock}>
            <span className={styles.title}>{factor.title}</span>
            <span className={styles.short}>{factor.short}</span>
          </span>
          <span className={styles.kind} data-kind={factor.kind}>
            {FACTOR_KINDS[factor.kind].short}
          </span>
          <span className={styles.icon} aria-hidden="true">
            <Plus size={20} />
          </span>
        </button>
      </h3>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={panelId}
            role="region"
            aria-labelledby={buttonId}
            className={styles.panel}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className={styles.panelInner}>
              <p className={styles.detail}>{factor.detail}</p>
              <div className={styles.columns}>
                <div>
                  <p className={styles.colLabel}>Что могут подростки</p>
                  <p>{factor.youth}</p>
                </div>
                <div>
                  <p className={styles.colLabel}>Что решается на уровне города и страны</p>
                  <p>{factor.systemic}</p>
                </div>
              </div>
              {factor.pollutants.length > 0 && (
                <p className={styles.pollutants}>
                  <span className={styles.colLabel}>Связанные загрязнители:</span>
                  {factor.pollutants.map((p) => (
                    <span key={p} className={styles.chip}>
                      {p}
                    </span>
                  ))}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

/** Editorial list of pollution sources and amplifying conditions. */
export function FactorsList() {
  const [filter, setFilter] = useState('all');
  const [openId, setOpenId] = useState(FACTORS[0].id);
  const visible = FACTORS.filter((f) => filter === 'all' || f.kind === filter);

  return (
    <div className={styles.wrap}>
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <span className={styles.legendMark} data-kind="source" aria-hidden="true" />
          <p>
            <strong>Источник выбросов</strong> — то, что выбрасывает загрязнение в воздух: двигатели, печи, заводы,
            костры, пыль.
          </p>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendMark} data-kind="condition" aria-hidden="true" />
          <p>
            <strong>Условие</strong> — то, что само ничего не выбрасывает, но мешает загрязнению рассеяться: безветрие,
            инверсии, жара и сухость.
          </p>
        </div>
      </div>

      <ChoiceGroup label="Показать" options={FILTERS} value={filter} onChange={setFilter} size="sm" />

      <ol className={styles.list} role="list">
        {visible.map((factor) => (
          <FactorRow
            key={factor.id}
            factor={factor}
            index={FACTORS.indexOf(factor)}
            open={openId === factor.id}
            onToggle={() => setOpenId((cur) => (cur === factor.id ? null : factor.id))}
          />
        ))}
      </ol>
    </div>
  );
}
