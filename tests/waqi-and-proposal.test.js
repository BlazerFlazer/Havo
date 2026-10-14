import { test } from 'node:test';
import assert from 'node:assert/strict';
import { epaCategory, haversineKm, normalizeWaqi } from '../lib/airQuality/waqi.js';
import { containsContact, EMPTY_PROPOSAL, validateProposal } from '../features/initiatives/proposal.js';
import { INITIATIVE_CATEGORIES } from '../data/initiatives.js';

const TASHKENT = { id: 'tashkent', lat: 41.2995, lon: 69.2401 };
const OPTS = { maxStationDistanceKm: 40, staleAfterHours: 3 };

// Shape mirrors a real response of the WAQI feed endpoint.
function sample({ geo = [41.32, 69.25], iso = '2026-10-14T17:00:00+05:00', aqi = 87 } = {}) {
  return {
    status: 'ok',
    data: {
      aqi,
      idx: 1,
      attributions: [
        { url: 'https://monitoring.meteo.uz/', name: 'Uzhydromet' },
        { url: 'javascript:alert(1)', name: 'bad' },
        { url: 'https://waqi.info/', name: 'World Air Quality Index Project' },
      ],
      city: { geo, name: 'Tashkent', url: 'https://aqicn.org/city/tashkent', location: '' },
      dominentpol: 'pm25',
      iaqi: { pm25: { v: 87 }, pm10: { v: 41 }, t: { v: 18 } },
      time: { s: '2026-10-14 17:00:00', tz: '+05:00', v: 0, iso },
    },
  };
}

test('normalises a valid response', () => {
  const now = Date.parse('2026-10-14T13:00:00Z'); // 1 h after the reading
  const r = normalizeWaqi(sample(), TASHKENT, { ...OPTS, now });
  assert.equal(r.status, 'ok');
  assert.equal(r.aqi, 87);
  assert.equal(r.dominant, 'pm25');
  assert.deepEqual(r.indices, { pm25: 87, pm10: 41 });
  assert.equal(r.stale, false);
  assert.equal(r.attributions.length, 2, 'unsafe URL filtered out');
  assert.ok(r.station.distanceKm < 5);
});

test('flags stale readings', () => {
  const now = Date.parse('2026-10-14T20:00:00Z'); // 8 h later
  assert.equal(normalizeWaqi(sample(), TASHKENT, { ...OPTS, now }).stale, true);
});

test('refuses to present a distant station as the city', () => {
  const r = normalizeWaqi(sample({ geo: [39.65, 66.96] }), TASHKENT, OPTS); // Samarkand
  assert.equal(r.status, 'no-station');
});

test('handles error and empty responses', () => {
  assert.equal(normalizeWaqi({ status: 'error', data: 'Invalid key' }, TASHKENT, OPTS).reason, 'Invalid key');
  assert.equal(normalizeWaqi(null, TASHKENT, OPTS).status, 'error');
  const empty = sample({ aqi: '-' });
  empty.data.iaqi = {};
  assert.equal(normalizeWaqi(empty, TASHKENT, OPTS).status, 'no-data');
});

test('haversine distance Tashkent–Samarkand is about 270 km', () => {
  const d = haversineKm(41.2995, 69.2401, 39.6542, 66.9597);
  assert.ok(d > 250 && d < 290, String(d));
});

test('US EPA categories', () => {
  assert.equal(epaCategory(42).id, 'good');
  assert.equal(epaCategory(101).id, 'usg');
  assert.equal(epaCategory(350).id, 'hazardous');
  assert.equal(epaCategory(null), null);
});

const valid = {
  ...EMPTY_PROPOSAL,
  title: 'Пешие пятницы',
  category: 'transport',
  place: 'school',
  description: 'Каждую пятницу идём в школу пешком группой по безопасному маршруту.',
  participants: '4-8',
  consent: true,
};

test('a complete proposal is valid', () => {
  assert.deepEqual(validateProposal(valid, INITIATIVE_CATEGORIES), {});
});

test('an empty proposal reports every required field', () => {
  const errors = validateProposal(EMPTY_PROPOSAL, INITIATIVE_CATEGORIES);
  for (const f of ['title', 'category', 'place', 'description', 'participants', 'consent']) assert.ok(errors[f], f);
});

test('personal contacts are rejected', () => {
  assert.ok(containsContact('звони +998 90 123 45 67'));
  assert.ok(containsContact('пиши на test@example.com'));
  assert.ok(!containsContact('Неделя чистого воздуха 2026'));
  const errors = validateProposal({ ...valid, alias: 'me@mail.uz' }, INITIATIVE_CATEGORIES);
  assert.ok(errors.alias);
});
