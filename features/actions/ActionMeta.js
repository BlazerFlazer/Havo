import { Clock, Users, User, Wallet } from 'lucide-react';
import { COST_LABELS, DIFFICULTY_LABELS, EFFECTS, MODE_LABELS } from '@/data/actions';
import styles from './ActionMeta.module.css';

export function DifficultyBars({ level }) {
  return (
    <span className={styles.difficulty} title={`Сложность: ${DIFFICULTY_LABELS[level]}`}>
      <span className={styles.bars} aria-hidden="true">
        {[1, 2, 3].map((n) => (
          <span key={n} data-on={n <= level || undefined} />
        ))}
      </span>
      <span>{DIFFICULTY_LABELS[level]}</span>
    </span>
  );
}

export function EffectLabel({ effect, long = false }) {
  return (
    <span className={styles.effect}>
      <span className={styles.dot} style={{ background: `var(--fx-${effect})` }} aria-hidden="true" />
      {long ? EFFECTS[effect].label : EFFECTS[effect].short}
    </span>
  );
}

/** Compact facts row: difficulty · time · cost · mode. */
export function ActionMeta({ action, showMode = false }) {
  const ModeIcon = action.mode === 'group' ? Users : User;
  return (
    <ul className={styles.meta} role="list">
      <li>
        <DifficultyBars level={action.difficulty} />
      </li>
      <li>
        <Clock size={14} aria-hidden="true" />
        {action.timeLabel}
      </li>
      <li>
        <Wallet size={14} aria-hidden="true" />
        {COST_LABELS[action.cost]}
      </li>
      {showMode && (
        <li>
          <ModeIcon size={14} aria-hidden="true" />
          {MODE_LABELS[action.mode]}
        </li>
      )}
    </ul>
  );
}
