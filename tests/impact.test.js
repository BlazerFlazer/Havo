import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateImpact, roundKg, savingPerKm } from '../features/impact/impact.js';
import { EMISSION_FACTORS } from '../config/dataSources.js';

const close = (a, b, eps = 1e-9) => Math.abs(a - b) < eps;

test('walking: trips × km × weeks × car factor', () => {
  const r = calculateImpact({ tripsPerWeek: 4, km: 2, weeks: 12, alternative: 'walk', carFactor: 249 });
  assert.equal(r.totalKm, 96);
  assert.ok(close(r.kg.low, 23.904));
  assert.ok(close(r.kg.high, 23.904));
  assert.equal(r.isRange, false);
  assert.ok(close(r.activeHours, 96 / 4.5));
});

test('bus is a range between average and marginal accounting', () => {
  const [low, high] = savingPerKm('bus', 249);
  assert.equal(low, 249 - EMISSION_FACTORS.bus.gPerPassengerKm);
  assert.equal(high, 249);
  const r = calculateImpact({ tripsPerWeek: 2, km: 5, weeks: 10, alternative: 'bus', carFactor: 249 });
  assert.equal(r.isRange, true);
  assert.ok(r.kg.low < r.kg.high);
});

test('bus never yields negative savings for very efficient cars', () => {
  const [low] = savingPerKm('bus', 80);
  assert.equal(low, 0);
});

test('carpool halves the per-person emissions', () => {
  const [low, high] = savingPerKm('carpool', 200);
  assert.equal(low, 100);
  assert.equal(high, 100);
});

test('inputs are clamped to the allowed ranges', () => {
  const r = calculateImpact({ tripsPerWeek: 999, km: -3, weeks: 0, alternative: 'walk', carFactor: 249 });
  assert.equal(r.inputs.tripsPerWeek, 14);
  assert.equal(r.inputs.km, 0.5);
  assert.equal(r.inputs.weeks, 1);
});

test('series is cumulative and ends at the total', () => {
  const r = calculateImpact({ tripsPerWeek: 3, km: 1.5, weeks: 30, alternative: 'bike', carFactor: 249 });
  assert.equal(r.series.length, 12);
  for (let i = 1; i < r.series.length; i++) assert.ok(r.series[i].kgHigh >= r.series[i - 1].kgHigh);
  assert.ok(close(r.series.at(-1).kgHigh, r.kg.high));
});

test('roundKg keeps two significant figures', () => {
  assert.equal(roundKg(23.904), 24);
  assert.equal(roundKg(149.4), 150);
  assert.equal(roundKg(0.44), 0.4);
  assert.equal(roundKg(0), 0);
});
