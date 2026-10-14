import { POLLUTANTS } from '@/data/pollution';
import { getSource } from '@/config/dataSources';
import { Reveal } from '@/components/ui/Reveal';
import styles from './Pollutants.module.css';

/** Four key pollutants with WHO 2021 guideline levels. */
export function Pollutants() {
  const who = getSource('who-aqg-qa');
  return (
    <div className={styles.wrap}>
      <ul className={styles.grid} role="list">
        {POLLUTANTS.map((p, i) => (
          <Reveal as="li" key={p.id} className={styles.card} delay={i * 0.08}>
            <p className={styles.symbol} aria-hidden="true">
              {p.symbol}
              <sub>{p.sub}</sub>
            </p>
            <h4 className={styles.name}>{p.name}</h4>
            <dl className={styles.facts}>
              <div>
                <dt>Что это</dt>
                <dd>{p.what}</dd>
              </div>
              <div>
                <dt>Откуда</dt>
                <dd>{p.sources}</dd>
              </div>
              <div>
                <dt>Почему важно</dt>
                <dd>{p.why}</dd>
              </div>
            </dl>
            <div className={styles.who}>
              <p className={styles.whoLabel}>Рекомендация ВОЗ, 2021</p>
              <ul role="list">
                {p.who.map((w) => (
                  <li key={w.period}>
                    <span>{w.period}</span>
                    <span className={`${styles.whoValue} t-num`}>
                      {w.value} <span className={styles.unit}>{p.unit}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        ))}
      </ul>
      <p className={styles.note}>
        Рекомендации ВОЗ — научно обоснованные ориентиры, а не законы: национальные нормативы стран могут от них
        отличаться. Значения за сутки и 8 часов относятся к кратковременному воздействию, годовые и сезонные — к
        длительному.{' '}
        <a href={who.url} target="_blank" rel="noopener noreferrer">
          Таблица ВОЗ
          <span className="sr-only"> (откроется в новой вкладке)</span>
        </a>
      </p>
    </div>
  );
}
