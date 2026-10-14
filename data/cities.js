// Cities available in the air-quality dashboard. Coordinates are city centres
// (WGS84) and are used to find the nearest monitoring station.

export const CITIES = [
  { id: 'tashkent', name: 'Ташкент', lat: 41.2995, lon: 69.2401 },
  { id: 'samarkand', name: 'Самарканд', lat: 39.6542, lon: 66.9597 },
  { id: 'bukhara', name: 'Бухара', lat: 39.7747, lon: 64.4286 },
  { id: 'andijan', name: 'Андижан', lat: 40.7821, lon: 72.3442 },
  { id: 'namangan', name: 'Наманган', lat: 40.9983, lon: 71.6726 },
  { id: 'nukus', name: 'Нукус', lat: 42.4531, lon: 59.6103 },
];

export function getCityById(id) {
  return CITIES.find((c) => c.id === id) ?? null;
}
