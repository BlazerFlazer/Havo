import { EMISSION_FACTORS } from '../../config/dataSources.js';

// Direct (tailpipe) emissions per passenger-kilometre. Illustrative: reference
// factors come from the US (car) and UK (bus) fleets — see config/dataSources.js.
export const TRANSPORT_ROWS = [
  { mode: 'Автомобиль, 1 человек', value: EMISSION_FACTORS.car.gPerKm, note: 'US EPA, средний автомобиль' },
  {
    mode: 'Автомобиль, 2 человека',
    value: Math.round(EMISSION_FACTORS.car.gPerKm / 2),
    note: 'та же машина, выбросы делятся на двоих',
  },
  {
    mode: 'Автобус, средняя загрузка',
    value: EMISSION_FACTORS.bus.gPerPassengerKm,
    note: 'DESNZ 2025, средний городской автобус',
  },
  { mode: 'Велосипед', value: 0, note: 'нет выхлопных газов' },
  { mode: 'Пешком', value: 0, note: 'нет выхлопных газов' },
];
