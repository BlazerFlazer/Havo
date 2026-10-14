import { Reveal } from './Reveal';
import styles from './SubHead.module.css';

/** Secondary heading inside a section: index, title and an optional lead. */
export function SubHead({ index, title, lead, id, aside }) {
  return (
    <Reveal className={styles.sub}>
      <div className={styles.main}>
        {index && <span className={styles.index}>{index}</span>}
        <h3 id={id} className={`t-h3 ${styles.title}`}>
          {title}
        </h3>
      </div>
      {(lead || aside) && (
        <div className={styles.lead}>
          {lead && <p className="t-body">{lead}</p>}
          {aside}
        </div>
      )}
    </Reveal>
  );
}
