import { ArrowUpRight } from 'lucide-react';
import { SOURCES } from '@/config/dataSources';
import styles from './SourcesMethodology.module.css';

const PRINCIPLES = [
  'Числа на сайте — только из проверенных источников, и рядом всегда указано, откуда они.',
  'Где проверенных данных нет, мы объясняем явление качественно и прямо об этом пишем.',
  'Расчёты калькулятора помечены как иллюстративные: в них видны формула, допущения и неопределённость.',
  'Живые данные о воздухе показываются, только если подключён реальный источник. Выдуманных показаний здесь нет.',
  'Ссылки проверены 14 октября 2026 года. Если ссылка перестала работать, сообщи учителю или автору проекта.',
];

/** Bibliography grouped by topic + our data principles. */
export function SourcesMethodology() {
  const groups = SOURCES.reduce((acc, s) => {
    (acc[s.group] ??= []).push(s);
    return acc;
  }, {});

  return (
    <div id="sources" className={styles.wrap}>
      <div className={styles.method}>
        <h3 className="t-h3">Источники и методология</h3>
        <ol className={styles.principles} role="list">
          {PRINCIPLES.map((p, i) => (
            <li key={i}>
              <span className={styles.pNum}>{String(i + 1).padStart(2, '0')}</span>
              <p>{p}</p>
            </li>
          ))}
        </ol>
      </div>
      <div className={styles.groups}>
        {Object.entries(groups).map(([group, items]) => (
          <section key={group} className={styles.group} aria-label={group}>
            <p className={styles.groupTitle}>{group}</p>
            <ul role="list">
              {items.map((s) => (
                <li key={s.id}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className={styles.link}>
                    <span className={styles.linkTitle}>{s.title}</span>
                    <span className={styles.linkMeta}>
                      {s.publisher} · {s.usedFor}
                    </span>
                    <ArrowUpRight className={styles.arrow} size={18} aria-hidden="true" />
                    <span className="sr-only"> (откроется в новой вкладке)</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
