import { Reveal } from './Reveal';
import styles from './SectionIntro.module.css';

/**
 * Section heading block: numbered eyebrow, large title and an optional lead.
 * `layout="split"` puts the lead in a second column on wide screens.
 */
export function SectionIntro({ index, eyebrow, title, lead, layout = 'stack', id, children, className = '' }) {
  return (
    <header className={`${styles.intro} ${styles[layout]} ${className}`}>
      <Reveal className={styles.head}>
        <p className={styles.eyebrow}>
          {index && <span className={styles.index}>{index}</span>}
          <span>{eyebrow}</span>
        </p>
        <h2 id={id} className={`t-h2 ${styles.title}`}>
          {title}
        </h2>
      </Reveal>
      {(lead || children) && (
        <Reveal className={styles.side} delay={0.1}>
          {lead && <p className="t-lead">{lead}</p>}
          {children}
        </Reveal>
      )}
    </header>
  );
}
