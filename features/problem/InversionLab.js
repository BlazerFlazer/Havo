'use client';

import { useEffect, useRef, useState } from 'react';
import { CloudRain, Layers, Snowflake, Sun, Wind } from 'lucide-react';
import { ChoiceGroup } from '@/components/ui/ChoiceGroup';
import { useInViewport } from '@/hooks/useInViewport';
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery';
import { buildLayout, createSim, explain, levelBand, settle, step } from './inversionSim';
import styles from './InversionLab.module.css';

const LEVEL_WORDS = ['нет', 'мало', 'средне', 'много'];

const PRESETS = [
  {
    id: 'winter',
    label: 'Зимнее утро в долине',
    icon: Snowflake,
    params: { inversion: true, wind: 0, rain: false, traffic: 3, heating: 3 },
  },
  { id: 'windy', label: 'Ветреный день', icon: Wind, params: { inversion: false, wind: 2, rain: false, traffic: 2, heating: 1 } },
  { id: 'rain', label: 'Дождь', icon: CloudRain, params: { inversion: false, wind: 1, rain: true, traffic: 2, heating: 1 } },
  { id: 'normal', label: 'Обычный день', icon: Sun, params: { inversion: false, wind: 1, rain: false, traffic: 2, heating: 1 } },
];

const DEFAULT_PARAMS = PRESETS[3].params;

function drawScene(ctx, sim, params, t) {
  const L = sim.layout;
  const { w, h } = L;
  ctx.clearRect(0, 0, w, h);

  // Sky
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#0a1a14');
  sky.addColorStop(1, '#123024');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // Inversion layer
  if (params.inversion) {
    const band = ctx.createLinearGradient(0, L.lidY - 34, 0, L.lidY + 10);
    band.addColorStop(0, 'rgba(242,180,90,0)');
    band.addColorStop(0.6, 'rgba(242,180,90,0.22)');
    band.addColorStop(1, 'rgba(242,180,90,0.05)');
    ctx.fillStyle = band;
    ctx.fillRect(0, L.lidY - 34, w, 44);
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = 'rgba(242,180,90,0.75)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, L.lidY);
    ctx.lineTo(w, L.lidY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(242,180,90,0.95)';
    ctx.font = '500 11px "JetBrains Mono", monospace';
    ctx.fillText('ТЁПЛЫЙ СЛОЙ — «КРЫШКА»', 14, L.lidY - 10);
  }

  // Mountains
  ctx.fillStyle = '#183a2c';
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.lineTo(0, h * 0.3);
  ctx.lineTo(w * 0.08, h * 0.36);
  ctx.lineTo(w * 0.15, h * 0.52);
  ctx.lineTo(w * 0.24, L.groundY);
  ctx.lineTo(0, h);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(w, h);
  ctx.lineTo(w, h * 0.26);
  ctx.lineTo(w * 0.9, h * 0.38);
  ctx.lineTo(w * 0.84, h * 0.5);
  ctx.lineTo(w * 0.76, L.groundY);
  ctx.lineTo(w, h);
  ctx.fill();

  // City
  ctx.fillStyle = '#0d241b';
  for (const b of L.buildings) ctx.fillRect(b.x, L.groundY - b.h, b.w, b.h);
  // Houses with chimneys (heating sources)
  L.chimneys.forEach((ch, i) => {
    const active = i < params.heating;
    ctx.fillStyle = '#20453a';
    ctx.fillRect(ch.x - 16, ch.y, 34, L.groundY - ch.y);
    ctx.fillStyle = active ? '#f2b45a' : '#2c5546';
    ctx.fillRect(ch.x - 3, ch.y - 10, 7, 10);
  });

  // Particles
  for (const p of sim.particles) {
    const a = Math.min(0.6, p.alpha);
    ctx.fillStyle = p.kind === 'smoke' ? `rgba(196,182,160,${a})` : `rgba(214,206,186,${a})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }

  // Breathing zone marker
  ctx.setLineDash([2, 5]);
  ctx.strokeStyle = 'rgba(184,243,107,0.5)';
  ctx.beginPath();
  ctx.moveTo(0, L.zoneTop);
  ctx.lineTo(w, L.zoneTop);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(184,243,107,0.85)';
  ctx.font = '500 11px "JetBrains Mono", monospace';
  ctx.fillText('ЗОНА ДЫХАНИЯ', w - 112, L.zoneTop - 8);

  // Ground and road
  ctx.fillStyle = '#081510';
  ctx.fillRect(0, L.groundY, w, h - L.groundY);
  ctx.fillStyle = '#2b4a3c';
  ctx.fillRect(0, L.groundY, w, 2);
  sim.cars.forEach((car, i) => {
    if (i >= params.traffic * 2) return;
    ctx.fillStyle = i % 2 ? '#d9e6d4' : '#9fd8e8';
    ctx.fillRect(car.x - 9, L.groundY - 9, 18, 7);
  });

  // Rain
  if (params.rain) {
    ctx.strokeStyle = 'rgba(159,216,232,0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < 70; i++) {
      const x = ((i * 97 + t * 0.25) % (w + 40)) - 20;
      const y = (i * 53 + t * 0.9) % L.groundY;
      ctx.moveTo(x, y);
      ctx.lineTo(x - 3, y + 10);
    }
    ctx.stroke();
  }
}

function Toggle({ pressed, onChange, children, icon: Icon }) {
  return (
    <button type="button" className={styles.switch} aria-pressed={pressed} onClick={() => onChange(!pressed)}>
      <Icon size={17} aria-hidden="true" />
      <span>{children}</span>
      <span className={styles.switchTrack} aria-hidden="true">
        <span className={styles.switchThumb} />
      </span>
    </button>
  );
}

function LevelSlider({ label, value, onChange, id }) {
  return (
    <div className="field">
      <label htmlFor={id} className={styles.sliderLabel}>
        <span>{label}</span>
        <span className={styles.sliderValue}>{LEVEL_WORDS[value]}</span>
      </label>
      <input
        id={id}
        type="range"
        min={0}
        max={3}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="range"
        style={{ '--pct': `${(value / 3) * 100}%` }}
        aria-valuetext={LEVEL_WORDS[value]}
      />
    </div>
  );
}

export function InversionLab() {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const simRef = useRef(null);
  const [params, setParams] = useState(DEFAULT_PARAMS);
  const paramsRef = useRef(params);
  const [level, setLevel] = useState(0);
  const visible = useInViewport(wrapRef);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  const update = (patch) => setParams((p) => ({ ...p, ...patch }));

  // Animation loop (or a single settled frame for reduced motion).
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !visible) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;
    let raf = 0;
    let lastReport = 0;

    const setup = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const layout = buildLayout(rect.width, rect.height);
      const previous = simRef.current;
      simRef.current = createSim(layout);
      if (previous) simRef.current.level = previous.level;
    };

    const render = (t) => {
      const sim = simRef.current;
      if (reduced) {
        settle(sim, paramsRef.current);
        drawScene(ctx, sim, paramsRef.current, 0);
        setLevel(Math.round(sim.level));
        return;
      }
      step(sim, paramsRef.current);
      drawScene(ctx, sim, paramsRef.current, t);
      if (t - lastReport > 250) {
        lastReport = t;
        setLevel(Math.round(sim.level));
      }
      raf = requestAnimationFrame(render);
    };

    setup();
    const ro = new ResizeObserver(() => {
      setup();
      if (reduced) render(0);
    });
    ro.observe(canvas);
    raf = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [visible, reduced]);

  // Reduced motion: recompute the settled state whenever the controls change.
  useEffect(() => {
    if (!reduced || !visible) return;
    const canvas = canvasRef.current;
    const sim = simRef.current;
    if (!canvas || !sim) return;
    const ctx = canvas.getContext('2d');
    sim.particles = [];
    settle(sim, params);
    drawScene(ctx, sim, params, 0);
    const raf = requestAnimationFrame(() => setLevel(Math.round(sim.level)));
    return () => cancelAnimationFrame(raf);
  }, [params, reduced, visible]);

  const band = levelBand(level);
  const activePreset = PRESETS.find((p) => Object.entries(p.params).every(([k, v]) => params[k] === v));
  const summary = `Схема долины. Инверсия: ${params.inversion ? 'есть' : 'нет'}. Ветер: ${
    ['штиль', 'слабый', 'сильный'][params.wind]
  }. Осадки: ${params.rain ? 'да' : 'нет'}. Транспорт: ${LEVEL_WORDS[params.traffic]}. Отопление: ${LEVEL_WORDS[params.heating]}.`;

  return (
    <div ref={wrapRef} className={`${styles.lab} theme-dark`}>
      <div className={styles.stage}>
        <div className={styles.stageTop}>
          <p className="t-label">Лаборатория · упрощённая модель</p>
          <p className={styles.modelNote}>Схема, а не научный расчёт</p>
        </div>
        <canvas ref={canvasRef} className={styles.canvas} role="img" aria-label={summary} />
        <div className={styles.meter}>
          <div className={styles.meterHead}>
            <span className={styles.meterLabel}>Условный уровень загрязнения в зоне дыхания</span>
            <span className={styles.meterValue} data-band={band.id}>
              {band.label} · <span className="t-num">{level}</span>
            </span>
          </div>
          <div className={styles.meterTrack} aria-hidden="true">
            <span className={styles.meterFill} data-band={band.id} style={{ transform: `scaleX(${level / 100})` }} />
          </div>
          <p className={styles.meterNote}>Условные единицы модели от 0 до 100 — это не мкг/м³.</p>
        </div>
      </div>

      <div className={styles.controls}>
        <div>
          <p className={styles.controlsTitle}>Попробуй сценарии</p>
          <div className={styles.presets}>
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                className={styles.preset}
                aria-pressed={activePreset?.id === p.id}
                onClick={() => setParams(p.params)}
              >
                <p.icon size={16} aria-hidden="true" />
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.group}>
          <p className={styles.controlsTitle}>Погода</p>
          <Toggle pressed={params.inversion} onChange={(v) => update({ inversion: v })} icon={Layers}>
            Температурная инверсия
          </Toggle>
          <Toggle pressed={params.rain} onChange={(v) => update({ rain: v })} icon={CloudRain}>
            Осадки
          </Toggle>
          <ChoiceGroup
            label="Ветер"
            size="sm"
            value={params.wind}
            onChange={(v) => update({ wind: v })}
            options={[
              { value: 0, label: 'Штиль' },
              { value: 1, label: 'Слабый' },
              { value: 2, label: 'Сильный' },
            ]}
          />
        </div>

        <div className={styles.group}>
          <p className={styles.controlsTitle}>Источники</p>
          <LevelSlider id="lab-traffic" label="Транспорт" value={params.traffic} onChange={(v) => update({ traffic: v })} />
          <LevelSlider
            id="lab-heating"
            label="Отопление и сжигание"
            value={params.heating}
            onChange={(v) => update({ heating: v })}
          />
        </div>

        <p className={styles.explain} aria-live="polite">
          {explain(params)}
        </p>
      </div>
    </div>
  );
}
