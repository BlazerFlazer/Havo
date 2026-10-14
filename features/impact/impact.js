// Impact calculator — illustrative estimate of avoided CO₂ from replacing short
// car trips. Pure functions, unit tested.
//
// Formula:  ΔCO₂ [kg] = trips/week × km/trip × weeks × (EF_car − EF_alt) / 1000
//
// EF values are grams per (passenger-)kilometre, see config/dataSources.js.
// The bus is given as a RANGE because two accounting approaches are valid:
//   • marginal — the bus runs anyway, one more passenger adds ~0 g/km;
//   • average  — your share of the bus's emissions (≈104 g/passenger-km).
// This estimates greenhouse-gas emissions only. It says nothing about PM2.5
// concentrations in the city, which depend on many sources and the weather.

import { EMISSION_FACTORS } from '../../config/dataSources.js';

export const ALTERNATIVES = [
  {
    id: 'walk',
    label: 'Пешком',
    altLow: 0,
    altHigh: 0,
    speedKmh: 4.5,
    note: 'Ходьба не даёт выбросов выхлопных газов.',
  },
  {
    id: 'bike',
    label: 'Велосипед',
    altLow: 0,
    altHigh: 0,
    speedKmh: 14,
    note: 'Велосипед не даёт выбросов выхлопных газов.',
  },
  {
    id: 'bus',
    label: 'Автобус',
    altLow: 0,
    altHigh: EMISSION_FACTORS.bus.gPerPassengerKm,
    note: 'От 0 г/км (автобус едет в любом случае) до ≈104 г/пассажиро-км (твоя доля выбросов автобуса).',
  },
  {
    id: 'carpool',
    label: 'Вдвоём в одной машине',
    shareOfCar: 0.5,
    note: 'Двое едут в одной машине вместо двух: на каждого приходится половина выбросов.',
  },
];

export const CALC_LIMITS = {
  trips: { min: 1, max: 14, step: 1 },
  km: { min: 0.5, max: 10, step: 0.5 },
  weeks: { min: 1, max: 52, step: 1 },
  carFactor: { min: 80, max: 350, step: 1 },
};

export const DEFAULT_INPUTS = {
  tripsPerWeek: 4,
  km: 2,
  weeks: 12,
  alternative: 'walk',
  carFactor: EMISSION_FACTORS.car.gPerKm,
};

const clamp = (v, { min, max }) => Math.min(max, Math.max(min, Number.isFinite(v) ? v : min));

export function getAlternative(id) {
  return ALTERNATIVES.find((a) => a.id === id) ?? ALTERNATIVES[0];
}

/** Grams avoided per replaced kilometre, as a [low, high] range. */
export function savingPerKm(alternativeId, carFactor) {
  const alt = getAlternative(alternativeId);
  if (alt.shareOfCar !== undefined) {
    const s = carFactor * (1 - alt.shareOfCar);
    return [s, s];
  }
  return [Math.max(0, carFactor - alt.altHigh), Math.max(0, carFactor - alt.altLow)];
}

export function calculateImpact(rawInputs) {
  const inputs = { ...DEFAULT_INPUTS, ...rawInputs };
  const tripsPerWeek = clamp(inputs.tripsPerWeek, CALC_LIMITS.trips);
  const km = clamp(inputs.km, CALC_LIMITS.km);
  const weeks = clamp(inputs.weeks, CALC_LIMITS.weeks);
  const carFactor = clamp(inputs.carFactor, CALC_LIMITS.carFactor);
  const alt = getAlternative(inputs.alternative);

  const kmPerWeek = tripsPerWeek * km;
  const totalKm = kmPerWeek * weeks;
  const [gLow, gHigh] = savingPerKm(alt.id, carFactor);
  const kgLow = (totalKm * gLow) / 1000;
  const kgHigh = (totalKm * gHigh) / 1000;
  const activeHours = alt.speedKmh ? totalKm / alt.speedKmh : null;

  // Cumulative series for the chart: one column per week up to 12 weeks,
  // otherwise 12 evenly spaced checkpoints.
  const columns = Math.min(12, weeks);
  const series = Array.from({ length: columns }, (_, i) => {
    const week = weeks <= 12 ? i + 1 : Math.round((weeks * (i + 1)) / columns);
    const kmSoFar = kmPerWeek * week;
    return {
      week,
      km: kmSoFar,
      kgLow: (kmSoFar * gLow) / 1000,
      kgHigh: (kmSoFar * gHigh) / 1000,
    };
  });

  return {
    inputs: { tripsPerWeek, km, weeks, carFactor, alternative: alt.id },
    alternative: alt,
    kmPerWeek,
    totalKm,
    perKm: { low: gLow, high: gHigh },
    kg: { low: kgLow, high: kgHigh },
    isRange: Math.abs(kgHigh - kgLow) > 1e-9,
    activeHours,
    series,
  };
}

/** Rounds a kilogram value sensibly for display (2 significant figures). */
export function roundKg(kg) {
  if (!Number.isFinite(kg) || kg <= 0) return 0;
  if (kg < 1) return Math.round(kg * 10) / 10;
  const magnitude = 10 ** (Math.floor(Math.log10(kg)) - 1);
  return Math.round(kg / magnitude) * magnitude;
}
