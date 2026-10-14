// Normalises a response from the World Air Quality Index (WAQI) JSON API
// (https://aqicn.org/json-api/doc/) into the shape used by the dashboard.
//
// IMPORTANT: WAQI `iaqi.*.v` values for pollutants are AQI sub-indices on the
// US EPA scale, NOT concentrations in µg/m³. The UI labels them accordingly.

const POLLUTANT_KEYS = ['pm25', 'pm10', 'no2', 'o3'];

export function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);

function safeUrl(value) {
  if (typeof value !== 'string') return null;
  try {
    const u = new URL(value);
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.toString() : null;
  } catch {
    return null;
  }
}

/**
 * @param {object} json  Raw API response
 * @param {{id:string, lat:number, lon:number}} city
 * @param {{ maxStationDistanceKm:number, staleAfterHours:number, now?:number }} options
 */
export function normalizeWaqi(json, city, { maxStationDistanceKm, staleAfterHours, now = Date.now() }) {
  if (!json || json.status !== 'ok' || typeof json.data !== 'object' || json.data === null) {
    const reason = typeof json?.data === 'string' ? json.data : 'invalid-response';
    return { status: 'error', reason };
  }

  const data = json.data;
  const geo = Array.isArray(data.city?.geo) ? data.city.geo.map(Number) : null;
  const station = {
    name: typeof data.city?.name === 'string' ? data.city.name.slice(0, 160) : 'Станция без названия',
    url: safeUrl(data.city?.url),
    distanceKm: geo && isNum(geo[0]) && isNum(geo[1]) ? haversineKm(city.lat, city.lon, geo[0], geo[1]) : null,
  };

  if (station.distanceKm === null) return { status: 'error', reason: 'missing-station-location' };
  if (station.distanceKm > maxStationDistanceKm) {
    return { status: 'no-station', station: { ...station, distanceKm: Math.round(station.distanceKm) } };
  }

  const observedMs = Date.parse(data.time?.iso ?? '');
  if (Number.isNaN(observedMs)) return { status: 'error', reason: 'missing-timestamp' };

  const indices = {};
  for (const key of POLLUTANT_KEYS) {
    const v = data.iaqi?.[key]?.v;
    if (isNum(v)) indices[key] = Math.round(v);
  }
  const aqi = isNum(data.aqi) ? Math.round(data.aqi) : null;

  if (aqi === null && Object.keys(indices).length === 0) {
    return { status: 'no-data', station: { ...station, distanceKm: Math.round(station.distanceKm * 10) / 10 } };
  }

  const attributions = (Array.isArray(data.attributions) ? data.attributions : [])
    .map((a) => ({ name: typeof a?.name === 'string' ? a.name.slice(0, 120) : '', url: safeUrl(a?.url) }))
    .filter((a) => a.name && a.url)
    .slice(0, 6);

  return {
    status: 'ok',
    provider: 'waqi',
    scale: 'US EPA AQI',
    city: city.id,
    station: { ...station, distanceKm: Math.round(station.distanceKm * 10) / 10 },
    aqi,
    dominant: POLLUTANT_KEYS.includes(data.dominentpol) ? data.dominentpol : null,
    indices,
    observedAt: new Date(observedMs).toISOString(),
    stale: now - observedMs > staleAfterHours * 3600 * 1000,
    attributions,
  };
}

/** US EPA AQI category for an index value (category names in Russian). */
export function epaCategory(aqi) {
  if (!isNum(aqi)) return null;
  if (aqi <= 50) return { id: 'good', label: 'Хорошо', color: '#3fb950' };
  if (aqi <= 100) return { id: 'moderate', label: 'Умеренно', color: '#e3c84b' };
  if (aqi <= 150) return { id: 'usg', label: 'Вредно для чувствительных групп', color: '#f0883e' };
  if (aqi <= 200) return { id: 'unhealthy', label: 'Вредно', color: '#e5534b' };
  if (aqi <= 300) return { id: 'very-unhealthy', label: 'Очень вредно', color: '#a371f7' };
  return { id: 'hazardous', label: 'Опасно', color: '#8b2942' };
}
