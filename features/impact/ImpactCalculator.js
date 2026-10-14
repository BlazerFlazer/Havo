'use client';

import { useId, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { ArrowUpRight, Info, Scale } from 'lucide-react';
import { ChoiceGroup } from '@/components/ui/ChoiceGroup';
import { EMISSION_FACTORS, getSource } from '@/config/dataSources';
import { formatNumber, plural, pluralize } from '@/lib/format';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { ALTERNATIVES, CALC_LIMITS, DEFAULT_INPUTS, calculateImpact, roundKg } from './impact';
import { IsoBars } from './IsoBars';
import { TRANSPORT_ROWS } from './transportRows';
import styles from './ImpactCalculator.module.css';

// Recharts is only loaded when the calculator is rendered on the client.
const TransportChart = dynamic(() => import('./TransportChart'), {
  ssr: false,
  loading: () => <div className={styles.chartLoading}>Загружаем график…</div>,
});

function RangeField({ label, value, display, limits, onChange }) {
  const id = useId();
  const pct = ((value - limits.min) / (limits.max - limits.min)) * 100;
  return (
    <div className="field">
      <label htmlFor={id} className={styles.rangeLabel}>
        <span>{label}</span>
        <output htmlFor={id} className={styles.rangeValue}>
          {display}
        </output>
      </label>
      <input
        id={id}
        type="range"
        className="range"
        min={limits.min}
        max={limits.max}
        step={limits.step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ '--pct': `${pct}%` }}
        aria-valuetext={display}
      />
    </div>
  );
}

function SourceLink({ id }) {
  const s = getSource(id);
  return (
    <a href={s.url} target="_blank" rel="noopener noreferrer" className={styles.sourceLink}>
      {s.publisher}
      <ArrowUpRight size={13} aria-hidden="true" />
      <span className="sr-only"> (откроется в новой вкладке)</span>
    </a>
  );
}

export function ImpactCalculator() {
  const [inputs, setInputs] = useState(DEFAULT_INPUTS);
  const [factorMode, setFactorMode] = useState('epa');
  const compact = useMediaQuery('(max-width: 599px)');
  const set = (patch) => setInputs((s) => ({ ...s, ...patch }));

  const carFactor = factorMode === 'epa' ? EMISSION_FACTORS.car.gPerKm : inputs.carFactor;
  const result = useMemo(() => calculateImpact({ ...inputs, carFactor }), [inputs, carFactor]);
  const { kg, perKm, totalKm, isRange, activeHours, alternative } = result;
  const weeksWord = plural(result.inputs.weeks, ['неделю', 'недели', 'недель']);

  return (
    <div className={styles.wrap}>
      <div className={styles.calc}>
        <div className={styles.inputs}>
          <p className="t-label">Входные данные</p>
          <RangeField
            label="Сколько поездок на машине в неделю ты заменишь"
            value={inputs.tripsPerWeek}
            display={pluralize(inputs.tripsPerWeek, ['поездка', 'поездки', 'поездок'])}
            limits={CALC_LIMITS.trips}
            onChange={(v) => set({ tripsPerWeek: v })}
          />
          <RangeField
            label="Длина одной поездки"
            value={inputs.km}
            display={`${formatNumber(inputs.km, 1)} км`}
            limits={CALC_LIMITS.km}
            onChange={(v) => set({ km: v })}
          />
          <ChoiceGroup
            label="Чем заменишь машину"
            size="sm"
            value={inputs.alternative}
            onChange={(v) => set({ alternative: v })}
            options={ALTERNATIVES.map((a) => ({ value: a.id, label: a.label }))}
          />
          <RangeField
            label="Как долго будешь так делать"
            value={inputs.weeks}
            display={pluralize(inputs.weeks, ['неделя', 'недели', 'недель'])}
            limits={CALC_LIMITS.weeks}
            onChange={(v) => set({ weeks: v })}
          />

          <details className={styles.advanced}>
            <summary>Коэффициент выбросов автомобиля</summary>
            <div className={styles.advancedBody}>
              <ChoiceGroup
                label="Какой коэффициент использовать"
                hideLegend
                size="sm"
                value={factorMode}
                onChange={setFactorMode}
                options={[
                  { value: 'epa', label: `Ориентир US EPA · ${EMISSION_FACTORS.car.gPerKm} г/км` },
                  { value: 'custom', label: 'Свой' },
                ]}
              />
              {factorMode === 'custom' && (
                <RangeField
                  label="Выбросы твоего автомобиля"
                  value={inputs.carFactor}
                  display={`${inputs.carFactor} г CO₂/км`}
                  limits={CALC_LIMITS.carFactor}
                  onChange={(v) => set({ carFactor: v })}
                />
              )}
              <p className={styles.hint}>
                Значение для конкретной машины можно найти в её документации. Небольшие машины и автомобили на метане
                обычно выбрасывают меньше CO₂ на километр, чем средний автомобиль в США.
              </p>
            </div>
          </details>
        </div>

        <div className={styles.output} aria-live="polite">
          <p className="t-label">Оценка · иллюстративный расчёт</p>
          <p className={styles.big}>
            <span className={styles.approx}>≈</span>
            <span className="t-num">
              {isRange
                ? `${formatNumber(roundKg(kg.low), 1)}–${formatNumber(roundKg(kg.high), 1)}`
                : formatNumber(roundKg(kg.high), 1)}
            </span>
            <span className={styles.unit}>кг CO₂</span>
          </p>
          <p className={styles.bigCaption}>
            предотвращённых выбросов углекислого газа за {result.inputs.weeks} {weeksWord}, если заменять поездки на
            машине: {alternative.label.toLowerCase()}.
          </p>

          <ul className={styles.stats} role="list">
            <li>
              <span className={`${styles.statValue} t-num`}>{formatNumber(totalKm, 1)} км</span>
              <span className={styles.statLabel}>поездок на машине заменено</span>
            </li>
            <li>
              <span className={`${styles.statValue} t-num`}>
                {isRange ? `${formatNumber(perKm.low)}–${formatNumber(perKm.high)}` : formatNumber(perKm.high)} г
              </span>
              <span className={styles.statLabel}>CO₂ на каждый заменённый километр</span>
            </li>
            {activeHours !== null && (
              <li>
                <span className={`${styles.statValue} t-num`}>≈ {formatNumber(activeHours, 0)} ч</span>
                <span className={styles.statLabel}>в движении — при средней скорости {alternative.speedKmh} км/ч</span>
              </li>
            )}
          </ul>

          <div className={styles.chart}>
            <IsoBars series={result.series} />
            <p className={styles.chartNote}>
              Накопленный эффект по неделям, кг CO₂.{isRange && ' Пунктир — верхняя граница оценки.'}
            </p>
          </div>
        </div>
      </div>

      <div className={styles.explain}>
        <div className={styles.formula}>
          <p className="t-label">Формула</p>
          <p className={styles.formulaLine}>
            ΔCO₂ = поездки/нед × км × недели × (EF<sub>авто</sub> − EF<sub>замена</sub>) ÷ 1000
          </p>
          <p className={styles.formulaLine}>
            = {result.inputs.tripsPerWeek} × {formatNumber(result.inputs.km, 1)} × {result.inputs.weeks} × (
            {carFactor} − {isRange ? `${alternative.altLow}…${alternative.altHigh}` : formatNumber(carFactor - perKm.high)}
            ) ÷ 1000 ≈{' '}
            {isRange
              ? `${formatNumber(kg.low, 1)}–${formatNumber(kg.high, 1)}`
              : formatNumber(kg.high, 1)}{' '}
            кг
          </p>
          <p className={styles.formulaNote}>EF — коэффициент выбросов, г CO₂ на километр (для автобуса — на пассажиро-километр).</p>
        </div>

        <div className={styles.assumptions}>
          <p className="t-label">Допущения и источники</p>
          <ul role="list">
            <li>
              Автомобиль: {EMISSION_FACTORS.car.detail} <SourceLink id={EMISSION_FACTORS.car.sourceId} />
            </li>
            <li>
              Автобус: {EMISSION_FACTORS.bus.detail} Нижняя граница 0 — если автобус едет по маршруту в любом случае.{' '}
              <SourceLink id={EMISSION_FACTORS.bus.sourceId} />
            </li>
            <li>Пешком и на велосипеде выхлопных газов нет. Производство велосипеда и еда в расчёт не входят.</li>
            <li>
              Коэффициенты взяты для автопарков США и Великобритании. В Узбекистане большинство личных машин ездит на
              метане или пропане, поэтому реальные значения могут отличаться. <SourceLink id="uz-stat-fuel" />
            </li>
            <li>Результат округлён: это оценка порядка величины, а не измерение.</li>
          </ul>
        </div>

        <div className={styles.callouts}>
          <div className={styles.callout} data-tone="warn">
            <Info size={18} aria-hidden="true" />
            <div>
              <p className={styles.calloutTitle}>CO₂ — это не PM2.5</p>
              <p>
                Калькулятор оценивает парниковый газ, влияющий на климат. Он не показывает, насколько изменится
                концентрация PM2.5 на твоей улице: она зависит от множества источников и погоды. Меньше поездок — меньше
                и местного выхлопа, но посчитать это в мкг/м³ таким способом нельзя.
              </p>
            </div>
          </div>
          <div className={styles.callout}>
            <Scale size={18} aria-hidden="true" />
            <div>
              <p className={styles.calloutTitle}>Полезно — но недостаточно</p>
              <p>
                Личная привычка даёт реальный, измеримый эффект и показывает пример другим. Но крупные сокращения
                выбросов возможны, только когда меняются транспортная система, энергетика, отопление и промышленность.
                Поэтому важны и твои шаги, и решения школ, городов и государства.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.compare}>
        <div className={styles.compareHead}>
          <h4 className={styles.compareTitle}>Сравнение способов передвижения</h4>
          <p className={styles.compareNote}>
            Иллюстративное сравнение: прямые выбросы CO₂ при движении на одного человека. Метро не показано — его
            выбросы зависят от того, как вырабатывается электричество, а проверенного коэффициента для Узбекистана у нас
            нет.
          </p>
        </div>
        <TransportChart compact={compact} />
        <div className="sr-only">
        <table>
          <caption>Прямые выбросы CO₂ на пассажиро-километр, граммы</caption>
          <thead>
            <tr>
              <th scope="col">Способ</th>
              <th scope="col">г CO₂ на пассажиро-км</th>
            </tr>
          </thead>
          <tbody>
            {TRANSPORT_ROWS.map((r) => (
              <tr key={r.mode}>
                <th scope="row">{r.mode}</th>
                <td>{r.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
