import { AQI_READING_CHECKLIST, US_EPA_AQI_CATEGORIES } from '@/data/pollution';
import { getSource } from '@/config/dataSources';
import styles from './AqiExplainer.module.css';

// European Air Quality Index bands for PM2.5 (µg/m³), as published by the EEA.
const EEA_PM25 = [
  { range: '0–5', label: 'Хорошо', color: '#50c3a6' },
  { range: '6–15', label: 'Удовлетворительно', color: '#58b6d6' },
  { range: '16–50', label: 'Умеренно', color: '#e3c84b' },
  { range: '51–90', label: 'Плохо', color: '#e5534b' },
  { range: '91–140', label: 'Очень плохо', color: '#9b3b52' },
  { range: '> 140', label: 'Крайне плохо', color: '#6f3a8f' },
];

function Scale({ title, unit, items, sourceId }) {
  const source = getSource(sourceId);
  return (
    <div className={styles.scale}>
      <p className={styles.scaleTitle}>{title}</p>
      <p className={styles.scaleUnit}>{unit}</p>
      <ol className={styles.ladder} role="list">
        {items.map((c) => (
          <li key={c.range}>
            <span className={styles.swatch} style={{ background: c.color }} aria-hidden="true" />
            <span className={`${styles.range} t-num`}>{c.range}</span>
            <span className={styles.catLabel}>{c.label}</span>
          </li>
        ))}
      </ol>
      <a className={styles.source} href={source.url} target="_blank" rel="noopener noreferrer">
        {source.publisher}
        <span className="sr-only"> (откроется в новой вкладке)</span>
      </a>
    </div>
  );
}

/** Shows two different index systems side by side, plus how to read any index. */
export function AqiExplainer() {
  const national = getSource('uz-monitoring');
  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <h3 className="t-h3">AQI — это шкала, а не единица измерения</h3>
        <p className="t-body">
          Индекс качества воздуха переводит концентрации загрязнителей в понятные категории. Но у разных стран и
          сервисов разные индексы и разные границы. Сравни две системы ниже: одно и то же число может означать
          разное.
        </p>
      </div>
      <div className={styles.scales}>
        <Scale
          title="Пример 1 · Шкала US EPA AQI"
          unit="Индекс от 0 до 500, без единиц"
          items={US_EPA_AQI_CATEGORIES}
          sourceId="airnow-aqi"
        />
        <Scale
          title="Пример 2 · Европейский индекс, PM2.5"
          unit="Концентрация в мкг/м³"
          items={EEA_PM25}
          sourceId="eea-aqi"
        />
      </div>
      <p className={styles.national}>
        Национальная служба мониторинга Узбекистана использует собственную шкалу — смотри легенду прямо на{' '}
        <a href={national.url} target="_blank" rel="noopener noreferrer">
          сайте мониторинга
          <span className="sr-only"> (откроется в новой вкладке)</span>
        </a>
        . Не переводи числа из одной системы в другую «на глаз».
      </p>
      <div className={styles.checklist}>
        <p className="t-label">Как читать любой индекс</p>
        <ol role="list">
          {AQI_READING_CHECKLIST.map((item, i) => (
            <li key={item.title}>
              <span className={styles.qNum}>{i + 1}</span>
              <div>
                <p className={styles.qTitle}>{item.title}</p>
                <p className={styles.qText}>{item.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
