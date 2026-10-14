// Simplified, symbolic particle model of a valley city. It illustrates how
// emissions and weather combine — it is NOT a scientific dispersion model and
// its "level" is in arbitrary model units.

export const WIND_SPEEDS = [0.04, 0.55, 1.5];
const MAX_PARTICLES = 900;
const ZONE_CAPACITY = 82;

function seeded(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function buildLayout(w, h) {
  const rand = seeded(42);
  const groundY = h * 0.84;
  const lidY = h * 0.44;
  const buildings = [];
  let x = w * 0.26;
  while (x < w * 0.74) {
    const bw = 14 + rand() * 26;
    buildings.push({ x, w: bw, h: 18 + rand() * (h * 0.13) });
    x += bw + 3 + rand() * 6;
  }
  const chimneys = [0.31, 0.47, 0.63].map((fx, i) => ({ x: w * fx, y: groundY - 26 - i * 4 }));
  return { w, h, groundY, lidY, zoneTop: groundY - h * 0.15, buildings, chimneys };
}

export function createSim(layout) {
  const rand = seeded(7);
  return {
    layout,
    particles: [],
    cars: Array.from({ length: 6 }, (_, i) => ({
      x: (layout.w / 6) * i + rand() * 40,
      speed: 0.7 + rand() * 0.7,
      dir: i % 2 ? 1 : -1,
    })),
    level: 0,
    rng: seeded(99),
  };
}

function emit(sim, x, y, vy, kind) {
  const r = sim.rng;
  sim.particles.push({
    x: x + (r() - 0.5) * 4,
    y,
    vx: (r() - 0.5) * 0.3,
    vy: vy - r() * 0.25,
    size: kind === 'smoke' ? 2 + r() * 2.6 : 1.4 + r() * 1.8,
    alpha: kind === 'smoke' ? 0.42 : 0.32,
    kind,
  });
}

/** Advances the model by one frame (~1/60 s). */
export function step(sim, params) {
  const { inversion, wind, rain, traffic, heating, animateCars = true } = params;
  const L = sim.layout;
  const r = sim.rng;
  const windSpeed = WIND_SPEEDS[wind] ?? 0;
  const roadY = L.groundY - 3;

  // Sources
  sim.cars.forEach((car, i) => {
    if (i >= traffic * 2) return;
    if (animateCars) {
      car.x += car.speed * car.dir;
      if (car.x > L.w + 20) car.x = -20;
      if (car.x < -20) car.x = L.w + 20;
    }
    if (r() < 0.085) emit(sim, car.x - car.dir * 8, roadY - 2, -0.25, 'exhaust');
  });
  L.chimneys.forEach((ch, i) => {
    if (i < heating && r() < 0.2) emit(sim, ch.x, ch.y - 10, -0.55, 'smoke');
  });

  // Motion
  const next = [];
  for (const p of sim.particles) {
    // Under an inversion the air near the ground is stable: plumes barely rise.
    p.vy -= inversion ? 0.0012 : 0.007;
    p.vx += (windSpeed - p.vx) * 0.02;
    p.vx += (r() - 0.5) * 0.06;
    p.vy += (r() - 0.5) * 0.05;
    p.vy *= 0.985;
    p.x += p.vx;
    p.y += p.vy;

    if (inversion && p.y < L.lidY) {
      // The warm layer acts as a lid: particles bounce back down.
      p.y = L.lidY + r() * 3;
      p.vy = Math.abs(p.vy) * 0.35 + 0.04;
    }
    if (p.y > L.groundY - 2) {
      p.y = L.groundY - 2;
      p.vy = -Math.abs(p.vy) * 0.3;
    }

    // Slow deposition; wind mixes and dilutes; free-rising plumes thin out with height.
    p.alpha -= 0.0005 + windSpeed * 0.0011;
    if (!inversion && p.y < L.h * 0.35) p.alpha -= 0.004;
    if (rain && r() < 0.014) continue; // washed out
    if (p.alpha <= 0.02 || p.y < -10 || p.x < -10 || p.x > L.w + 10) continue;
    next.push(p);
  }
  sim.particles = next.length > MAX_PARTICLES ? next.slice(next.length - MAX_PARTICLES) : next;

  // "Concentration" in the breathing zone (sum of particle opacities), smoothed.
  sim.level += (zoneLevel(sim) - sim.level) * 0.04;
}

function zoneLevel(sim) {
  let sum = 0;
  for (const p of sim.particles) if (p.y > sim.layout.zoneTop) sum += p.alpha;
  // Normalised by layout width so the scale does not depend on screen size.
  return Math.min(100, (sum / (ZONE_CAPACITY * (sim.layout.w / 800))) * 100);
}

/** Runs the model forward without drawing (used for reduced motion). */
export function settle(sim, params, frames = 1600) {
  for (let i = 0; i < frames; i++) step(sim, { ...params, animateCars: false });
  sim.level = zoneLevel(sim);
}

export function levelBand(level) {
  if (level < 30) return { id: 'low', label: 'Низкий' };
  if (level < 60) return { id: 'mid', label: 'Заметный' };
  return { id: 'high', label: 'Высокий' };
}

export function explain({ inversion, wind, rain, traffic, heating }) {
  if (traffic === 0 && heating === 0) {
    return 'Источников нет — и копиться нечему. Погода влияет на концентрацию, но сама загрязнение не создаёт.';
  }
  if (inversion && wind === 0) {
    return 'Инверсия и безветрие: тёплый слой сверху не даёт дыму подняться, и он копится там, где люди дышат. Выбросы те же — а воздух у земли заметно грязнее.';
  }
  if (inversion) {
    return 'Ветер частично выносит загрязнение из долины, но инверсия всё равно удерживает его низко, у земли.';
  }
  if (rain) {
    return 'Осадки вымывают часть частиц из воздуха. Но как только дождь закончится, при тех же выбросах загрязнение начнёт накапливаться снова.';
  }
  if (wind === 2) {
    return 'Сильный ветер быстро уносит выбросы, и у земли становится чище. Но загрязнение не исчезает — оно переносится в другие места.';
  }
  return 'Обычно воздух с высотой становится холоднее, поэтому тёплые выбросы поднимаются и рассеиваются.';
}
