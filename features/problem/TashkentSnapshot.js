'use client';

import { motion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { getSource, TASHKENT_ASSESSMENT } from '@/config/dataSources';
import { Counter } from '@/components/ui/Counter';
import styles from './TashkentSnapshot.module.css';

const EASE = [0.22, 1, 0.36, 1];

/** Verified figures from the World Bank's 2024 assessment for Tashkent. */
export function TashkentSnapshot() {
  const source = getSource(TASHKENT_ASSESSMENT.sourceId);
  const max = Math.max(...TASHKENT_ASSESSMENT.shares.map((s) => s.value));

  return (
    <figure className={styles.wrap}>
      <div className={styles.headline}>
        <p className={styles.big}>
          <span className={styles.gt}>&gt;</span>
          <Counter value={TASHKENT_ASSESSMENT.whoMultiple} className="t-num" />
          <span className={styles.times}>×</span>
        </p>
        <p className={styles.caption}>
          Во столько раз среднегодовая концентрация PM2.5 в Ташкенте превышает рекомендацию ВОЗ — 5 мкг/м³. Пик
          загрязнения приходится на зиму.
        </p>
      </div>

      <div className={styles.chart}>
        <p className={styles.chartTitle} id="tashkent-shares-title">
          Оценка вклада источников в загрязнение PM2.5, Ташкент
        </p>
        <ul className={styles.bars} role="list" aria-labelledby="tashkent-shares-title">
          {TASHKENT_ASSESSMENT.shares.map((s, i) => (
            <li key={s.id} className={styles.bar}>
              <div className={styles.barHead}>
                <span className={styles.barLabel}>{s.label}</span>
                <span className={`${styles.barValue} t-num`}>≈ {s.value}%</span>
              </div>
              <div className={styles.track} aria-hidden="true">
                <motion.span
                  className={styles.fill}
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: s.value / max }}
                  viewport={{ once: true, amount: 0.6 }}
                  transition={{ duration: 1.1, delay: 0.1 + i * 0.1, ease: EASE }}
                />
              </div>
              {s.note && <span className={styles.barNote}>{s.note}</span>}
            </li>
          ))}
        </ul>
      </div>

      <figcaption className={styles.source}>
        <span>
          Источник: {source.publisher}, оценка качества воздуха в Ташкенте (2024). Доли не дают в сумме 100%: показаны
          только источники, названные в резюме отчёта. Для других городов картина может отличаться.
        </span>
        <a href={source.url} target="_blank" rel="noopener noreferrer" className={styles.link}>
          Открыть отчёт
          <ArrowUpRight size={15} aria-hidden="true" />
          <span className="sr-only"> (откроется в новой вкладке)</span>
        </a>
      </figcaption>
    </figure>
  );
}
