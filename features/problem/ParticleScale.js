'use client';

import { useState } from 'react';
import { getSource } from '@/config/dataSources';
import styles from './ParticleScale.module.css';

// Sizes from US EPA's particulate matter diagram (micrometres).
const ITEMS = [
  { id: 'sand', label: 'Песчинка мелкого пляжного песка', size: 90, display: '≈ 90 мкм' },
  { id: 'hair', label: 'Человеческий волос (толщина)', size: 70, display: '50–70 мкм' },
  { id: 'pm10', label: 'Частица PM10', size: 10, display: 'до 10 мкм' },
  { id: 'pm25', label: 'Частица PM2.5', size: 2.5, display: 'до 2,5 мкм' },
];

const SCALE = 2.2; // px per micrometre in the SVG viewBox

/** Particle sizes drawn to scale. */
export function ParticleScale() {
  const [active, setActive] = useState('pm25');
  const source = getSource('epa-pm');
  const placed = [];
  let x = 0;
  for (const item of ITEMS) {
    const d = item.size * SCALE;
    const slot = Math.max(d, 18);
    placed.push({ ...item, d, cx: x + slot / 2 });
    x += slot + 34;
  }
  const width = x - 34;
  const height = 90 * SCALE + 4;

  return (
    <figure className={styles.wrap}>
      <div className={styles.text}>
        <p className="t-label">Масштаб</p>
        <p className={styles.title}>Насколько малы эти частицы</p>
        <p className={styles.desc}>
          Частица PM2.5 примерно в 30 раз тоньше человеческого волоса. Поэтому мы её не видим — и поэтому она
          проникает так глубоко.
        </p>
        <ul className={styles.legend} role="list">
          {placed.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className={styles.legendBtn}
                aria-pressed={active === item.id}
                onClick={() => setActive(item.id)}
                onMouseEnter={() => setActive(item.id)}
                onFocus={() => setActive(item.id)}
              >
                <span>{item.label}</span>
                <span className={styles.size}>{item.display}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className={styles.svgWrap}>
        <svg
          viewBox={`-4 -4 ${width + 8} ${height + 8}`}
          className={styles.svg}
          role="img"
          aria-label="Сравнение размеров в масштабе: песчинка около 90 мкм, волос 50–70 мкм, PM10 до 10 мкм, PM2.5 до 2,5 мкм."
        >
          {placed.map((item) => (
            <g key={item.id} className={styles.item} data-active={active === item.id || undefined}>
              <circle
                cx={item.cx}
                cy={height - item.d / 2}
                r={item.d / 2}
                className={item.id === 'pm25' || item.id === 'pm10' ? styles.particle : styles.object}
              />
              {item.d < 30 && (
                <circle cx={item.cx} cy={height - item.d / 2} r={item.d / 2 + 8} className={styles.halo} />
              )}
            </g>
          ))}
        </svg>
      </div>
      <figcaption className={styles.caption}>
        Размеры по схеме{' '}
        <a href={source.url} target="_blank" rel="noopener noreferrer">
          US EPA «Particulate Matter Basics»
          <span className="sr-only"> (откроется в новой вкладке)</span>
        </a>
        . Круги нарисованы в одном масштабе.
      </figcaption>
    </figure>
  );
}
