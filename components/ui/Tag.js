import styles from './Tag.module.css';

/** Small non-interactive label. `effect` adds a coloured marker dot. */
export function Tag({ children, tone = 'neutral', effect, icon: Icon, className = '' }) {
  return (
    <span className={`${styles.tag} ${styles[tone] ?? ''} ${className}`}>
      {effect && <span className={styles.dot} style={{ background: `var(--fx-${effect})` }} aria-hidden="true" />}
      {Icon && <Icon size={13} strokeWidth={2.2} aria-hidden="true" />}
      {children}
    </span>
  );
}
