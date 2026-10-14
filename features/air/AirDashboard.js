'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, ArrowUpRight, Clock, MapPin, PlugZap, RefreshCw, WifiOff } from 'lucide-react';
import { CITIES } from '@/data/cities';
import { AIR_QUALITY, MONITORING_LINKS } from '@/config/dataSources';
import { epaCategory } from '@/lib/airQuality/waqi';
import { formatDateTime, timeAgo } from '@/lib/format';
import { ChoiceGroup } from '@/components/ui/ChoiceGroup';
import { Button } from '@/components/ui/Button';
import styles from './AirDashboard.module.css';

const POLLUTANT_LABELS = { pm25: 'PM2.5', pm10: 'PM10', no2: 'NO₂', o3: 'O₃' };

async function fetchAirQuality(cityId, signal) {
  try {
    const res = await fetch(`/api/air-quality?city=${encodeURIComponent(cityId)}`, { signal, cache: 'no-store' });
    const data = await res.json().catch(() => null);
    if (!data || typeof data.status !== 'string') return { status: 'error', reason: 'invalid' };
    return data;
  } catch (e) {
    if (e?.name === 'AbortError') return null;
    return { status: 'error', reason: 'network' };
  }
}

function ExternalLinks() {
  return (
    <ul className={styles.links} role="list">
      {MONITORING_LINKS.map((l) => (
        <li key={l.id}>
          <a href={l.url} target="_blank" rel="noopener noreferrer" className={styles.link}>
            <span className={styles.linkTitle}>
              {l.title}
              <ArrowUpRight size={16} aria-hidden="true" />
            </span>
            <span className={styles.linkMeta}>{l.publisher}</span>
            <span className={styles.linkNote}>{l.note}</span>
            <span className="sr-only"> (откроется в новой вкладке)</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

function LiveReading({ data, city }) {
  const category = epaCategory(data.aqi);
  return (
    <div className={styles.live}>
      {data.stale && (
        <p className={styles.banner} data-tone="warn">
          <Clock size={16} aria-hidden="true" />
          Данные устарели: последнее обновление {timeAgo(data.observedAt)}. Это не «текущее» состояние воздуха.
        </p>
      )}
      <div className={styles.liveTop}>
        <div>
          <p className="t-label">Индекс US EPA AQI · {city.name}</p>
          <p className={styles.aqi}>
            <span className="t-num">{data.aqi ?? '—'}</span>
            {category && (
              <span className={styles.category} style={{ '--cat': category.color }}>
                {category.label}
              </span>
            )}
          </p>
        </div>
        <dl className={styles.liveMeta}>
          <div>
            <dt>
              <MapPin size={14} aria-hidden="true" /> Станция
            </dt>
            <dd>
              {data.station.url ? (
                <a href={data.station.url} target="_blank" rel="noopener noreferrer">
                  {data.station.name}
                </a>
              ) : (
                data.station.name
              )}{' '}
              · {data.station.distanceKm} км от центра
            </dd>
          </div>
          <div>
            <dt>
              <Clock size={14} aria-hidden="true" /> Время измерения
            </dt>
            <dd>
              {formatDateTime(data.observedAt)} ({timeAgo(data.observedAt)})
            </dd>
          </div>
        </dl>
      </div>
      {Object.keys(data.indices).length > 0 && (
        <ul className={styles.indices} role="list">
          {Object.entries(data.indices).map(([key, value]) => (
            <li key={key} data-dominant={data.dominant === key || undefined}>
              <span className={styles.indexName}>{POLLUTANT_LABELS[key]}</span>
              <span className={`${styles.indexValue} t-num`}>{value}</span>
              <span className={styles.indexUnit}>индекс, не мкг/м³</span>
            </li>
          ))}
        </ul>
      )}
      <p className={styles.attribution}>
        Данные:{' '}
        <a href={AIR_QUALITY.attribution.url} target="_blank" rel="noopener noreferrer">
          {AIR_QUALITY.attribution.name}
        </a>
        {data.attributions.length > 0 && (
          <>
            {' '}
            и источники станции:{' '}
            {data.attributions.map((a, i) => (
              <span key={a.url}>
                {i > 0 && ', '}
                <a href={a.url} target="_blank" rel="noopener noreferrer">
                  {a.name}
                </a>
              </span>
            ))}
          </>
        )}
        . Данные публикуются без предварительной проверки и могут уточняться.
      </p>
    </div>
  );
}

function StatusPanel({ state, city, onRetry }) {
  if (state.status === 'loading') {
    return (
      <div className={styles.skeleton} aria-label="Загрузка данных">
        <span />
        <span />
        <span />
      </div>
    );
  }

  if (state.status === 'ok') return <LiveReading data={state} city={city} />;

  if (state.status === 'unconfigured') {
    return (
      <div className={styles.message}>
        <p className={styles.badge}>
          <PlugZap size={15} aria-hidden="true" /> Демонстрационный режим
        </p>
        <p className={styles.messageTitle}>Живые данные не подключены</p>
        <p className={styles.messageText}>
          На этой копии сайта не настроен источник измерений, поэтому текущих значений для города {city.name} здесь нет.
          Мы специально не показываем «примерные» цифры — они легко могут ввести в заблуждение. Узнать текущее
          состояние воздуха можно на проверенных сайтах ниже.
        </p>
      </div>
    );
  }

  if (state.status === 'no-station') {
    return (
      <div className={styles.message}>
        <p className={styles.badge} data-tone="warn">
          <MapPin size={15} aria-hidden="true" /> Нет станции рядом
        </p>
        <p className={styles.messageTitle}>Ближайшая станция слишком далеко</p>
        <p className={styles.messageText}>
          Ближайшая доступная станция находится примерно в {state.station.distanceKm} км от центра города {city.name}. Мы
          не выдаём её показания за данные этого города.
        </p>
      </div>
    );
  }

  if (state.status === 'no-data') {
    return (
      <div className={styles.message}>
        <p className={styles.badge} data-tone="warn">
          <AlertTriangle size={15} aria-hidden="true" /> Нет показаний
        </p>
        <p className={styles.messageTitle}>Станция сейчас не передаёт данные</p>
        <p className={styles.messageText}>Попробуй позже или посмотри данные на сайтах ниже.</p>
      </div>
    );
  }

  return (
    <div className={styles.message}>
      <p className={styles.badge} data-tone="danger">
        <WifiOff size={15} aria-hidden="true" /> Ошибка
      </p>
      <p className={styles.messageTitle}>Не удалось загрузить данные</p>
      <p className={styles.messageText}>
        Источник данных не ответил или вернул некорректный ответ. Остальные разделы сайта работают как обычно.
      </p>
      <Button variant="secondary" size="sm" icon={RefreshCw} iconPosition="start" onClick={onRetry}>
        Попробовать снова
      </Button>
    </div>
  );
}

export function AirDashboard() {
  const [cityId, setCityId] = useState('tashkent');
  const [state, setState] = useState({ status: 'loading' });
  const controllerRef = useRef(null);
  const city = CITIES.find((c) => c.id === cityId);

  const load = useCallback((id) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    return fetchAirQuality(id, controller.signal).then((data) => {
      if (data && !controller.signal.aborted) setState(data);
    });
  }, []);

  // Initial request; later requests are triggered by user actions.
  useEffect(() => {
    load('tashkent');
    return () => controllerRef.current?.abort();
  }, [load]);

  const selectCity = (id) => {
    setCityId(id);
    setState({ status: 'loading' });
    load(id);
  };

  const retry = () => {
    setState({ status: 'loading' });
    load(cityId);
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.board}>
        <div className={styles.boardHead}>
          <ChoiceGroup
            label="Город"
            size="sm"
            value={cityId}
            onChange={selectCity}
            options={CITIES.map((c) => ({ value: c.id, label: c.name }))}
          />
        </div>
        <div className={styles.status} aria-live="polite">
          <StatusPanel state={state} city={city} onRetry={retry} />
        </div>
        <ExternalLinks />
      </div>

      <div className={styles.guide}>
        <p className="t-label">Как читать данные о частицах</p>
        <ol className={styles.guideList} role="list">
          <li>
            <p className={styles.guideTitle}>Концентрация или индекс?</p>
            <p>
              Концентрация измеряется в микрограммах на кубометр (мкг/м³). Индекс AQI — это пересчёт в баллы по
              определённой шкале. Не путай их.
            </p>
          </li>
          <li>
            <p className={styles.guideTitle}>За какой период?</p>
            <p>
              Часовые значения скачут. Рекомендации ВОЗ относятся к средним за сутки (PM2.5 — 15 мкг/м³, PM10 — 45
              мкг/м³) и за год (5 и 15 мкг/м³).
            </p>
          </li>
          <li>
            <p className={styles.guideTitle}>Какой прибор?</p>
            <p>
              Официальные станции и недорогие датчики измеряют по-разному. Показания датчиков полезны, но могут
              заметно отличаться от станций.
            </p>
          </li>
          <li>
            <p className={styles.guideTitle}>Если воздух плохой</p>
            <p>
              Перенеси интенсивные тренировки на улице, проветривай, когда показатели ниже, следи за официальными
              рекомендациями. Людям с астмой и болезнями сердца стоит следовать плану, согласованному с врачом.
            </p>
          </li>
        </ol>
      </div>
    </div>
  );
}
