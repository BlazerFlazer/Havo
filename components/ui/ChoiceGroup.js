'use client';

import { useId } from 'react';
import styles from './ChoiceGroup.module.css';

/**
 * Accessible single-choice group built on native radio inputs
 * (arrow-key navigation and form semantics come for free).
 */
export function ChoiceGroup({ label, hint, options, value, onChange, size = 'md', hideLegend = false, className = '' }) {
  const name = useId();
  return (
    <fieldset className={`${styles.group} ${className}`}>
      <legend className={hideLegend ? 'sr-only' : styles.legend}>{label}</legend>
      {hint && <p className={styles.hint}>{hint}</p>}
      <div className={`${styles.options} ${styles[size] ?? ''}`}>
        {options.map((opt) => {
          const checked = opt.value === value;
          const Icon = opt.icon;
          return (
            <label key={String(opt.value)} className={`${styles.option} ${checked ? styles.checked : ''}`}>
              <input
                type="radio"
                className={styles.input}
                name={name}
                value={String(opt.value)}
                checked={checked}
                onChange={() => onChange(opt.value)}
              />
              {Icon && <Icon size={16} strokeWidth={2} aria-hidden="true" />}
              <span>{opt.label}</span>
              {typeof opt.count === 'number' && <span className={styles.count}>{opt.count}</span>}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
