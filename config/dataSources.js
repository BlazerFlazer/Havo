// ─────────────────────────────────────────────────────────────────────────────
// HAVO — single place for every external data source, link and assumption.
//
// All URLs below were checked on 14 October 2026. If you add a source, verify
// that the link works and that it actually supports the statement it is used
// for. Do not add numbers you cannot trace to a source.
// ─────────────────────────────────────────────────────────────────────────────

// ── Live air quality ────────────────────────────────────────────────────────
// The dashboard shows live data ONLY when a provider token is configured on the
// server. Without it, the UI shows an honest "no live data" state.
export const AIR_QUALITY = {
  provider: 'waqi',
  // Server-side environment variable (never exposed to the browser).
  tokenEnvVar: 'WAQI_API_TOKEN',
  endpoint: 'https://api.waqi.info/feed',
  // Server cache for successful responses, in seconds.
  revalidateSeconds: 900,
  // Readings older than this are flagged as stale in the UI.
  staleAfterHours: 3,
  // If the nearest station is farther than this from the city centre, we do not
  // present it as that city's reading.
  maxStationDistanceKm: 40,
  requestTimeoutMs: 8000,
  attribution: {
    name: 'World Air Quality Index Project',
    url: 'https://waqi.info/',
    terms: 'https://aqicn.org/api/',
  },
};

// ── External monitoring resources (shown when live data is unavailable) ─────
export const MONITORING_LINKS = [
  {
    id: 'uzhydromet-monitoring',
    title: 'Мониторинг загрязнения окружающей среды',
    publisher: 'Агентство гидрометеорологической службы Узбекистана',
    url: 'https://monitoring.meteo.uz/ru/',
    note: 'Официальные данные наблюдений и карта станций. Обрати внимание на шкалу и единицы на сайте.',
  },
  {
    id: 'aqicn-tashkent',
    title: 'Ташкент на карте World Air Quality Index',
    publisher: 'World Air Quality Index Project',
    url: 'https://aqicn.org/city/tashkent/',
    note: 'Показывает индекс по шкале US EPA AQI, а не концентрации в мкг/м³.',
  },
  {
    id: 'iqair-uzbekistan',
    title: 'Качество воздуха в Узбекистане',
    publisher: 'IQAir',
    url: 'https://www.iqair.com/uzbekistan',
    note: 'Коммерческий агрегатор данных станций и датчиков. Использует шкалу US AQI.',
  },
];

// ── Bibliography for the «Источники и методология» section ─────────────────
export const SOURCES = [
  {
    id: 'who-aqg-2021',
    group: 'Здоровье и нормативы',
    title: 'WHO global air quality guidelines (2021)',
    publisher: 'Всемирная организация здравоохранения',
    url: 'https://www.who.int/publications/i/item/9789240034228',
    usedFor: 'Рекомендуемые уровни PM2.5, PM10, NO₂ и O₃.',
  },
  {
    id: 'who-aqg-qa',
    group: 'Здоровье и нормативы',
    title: 'Вопросы и ответы о рекомендациях ВОЗ по качеству воздуха',
    publisher: 'Всемирная организация здравоохранения',
    url: 'https://www.who.int/news-room/questions-and-answers/item/who-global-air-quality-guidelines',
    usedFor: 'Таблица рекомендуемых уровней 2021 года и периоды усреднения.',
  },
  {
    id: 'who-factsheet',
    group: 'Здоровье и нормативы',
    title: 'Ambient (outdoor) air pollution — fact sheet',
    publisher: 'Всемирная организация здравоохранения',
    url: 'https://www.who.int/news-room/fact-sheets/detail/ambient-(outdoor)-air-quality-and-health',
    usedFor: 'Влияние загрязнения атмосферного воздуха на здоровье.',
  },
  {
    id: 'wb-tashkent',
    group: 'Узбекистан',
    title: 'Air Quality Assessment for Tashkent and the Roadmap for Air Quality Management Improvement in Uzbekistan (2024)',
    publisher: 'Всемирный банк',
    url: 'https://www.worldbank.org/en/country/uzbekistan/publication/air-quality-assessment-for-tashkent',
    usedFor: 'Уровень PM2.5 в Ташкенте относительно рекомендации ВОЗ, сезонность и оценка вклада источников.',
  },
  {
    id: 'wb-central-asia',
    group: 'Узбекистан',
    title: 'Improving Air Quality in Central Asia (2025)',
    publisher: 'Всемирный банк',
    url: 'https://www.worldbank.org/en/region/eca/publication/air-quality-management-in-central-asia',
    usedFor: 'Пыльные бури и зимний пик загрязнения в городах региона.',
  },
  {
    id: 'wb-aral-dust',
    group: 'Узбекистан',
    title: 'Greening the Desert: landscape restoration and sand and dust storms in Uzbekistan (2024)',
    publisher: 'Всемирный банк',
    url: 'https://www.worldbank.org/en/news/feature/2024/12/04/greening-the-desert-the-role-of-landscape-restoration-in-uzbekistan-s-battle-against-sand-and-dust-storms',
    usedFor: 'Пыльные и солевые бури с осушенного дна Аральского моря.',
  },
  {
    id: 'uz-eco-committee',
    group: 'Узбекистан',
    title: 'Национальный комитет по экологии и изменению климата',
    publisher: 'Портал государственных органов gov.uz',
    url: 'https://gov.uz/ru/eco',
    usedFor: 'Официальная информация о состоянии окружающей среды и экологическом контроле.',
  },
  {
    id: 'uz-hydromet',
    group: 'Узбекистан',
    title: 'Агентство гидрометеорологической службы',
    publisher: 'Портал государственных органов gov.uz',
    url: 'https://gov.uz/ru/hydromet',
    usedFor: 'Официальная гидрометеорологическая служба страны.',
  },
  {
    id: 'uz-monitoring',
    group: 'Узбекистан',
    title: 'Мониторинг загрязнения окружающей природной среды',
    publisher: 'Агентство гидрометеорологической службы',
    url: 'https://monitoring.meteo.uz/ru/',
    usedFor: 'Официальные наблюдения за качеством воздуха. Использует собственную шкалу.',
  },
  {
    id: 'uz-stat-fuel',
    group: 'Узбекистан',
    title: 'Какой вид топлива чаще всего используется в Узбекистане? (2022)',
    publisher: 'Статистическое ведомство Республики Узбекистан',
    url: 'https://stat.uz/en/press-center/news-of-committee/22562-o-zbekistonda-qaysi-yonilg-i-turidan-ko-p-foydalaniladi-3',
    usedFor: 'Доля личных автомобилей на метане — ограничение калькулятора.',
  },
  {
    id: 'unep-air',
    group: 'Международные организации',
    title: 'Air quality',
    publisher: 'Программа ООН по окружающей среде (UNEP)',
    url: 'https://www.unep.org/en/what-we-do/air-quality',
    usedFor: 'Международный контекст и решения по качеству воздуха.',
  },
  {
    id: 'epa-pm',
    group: 'Методология и данные',
    title: 'Particulate Matter (PM) Basics',
    publisher: 'Агентство по охране окружающей среды США (US EPA)',
    url: 'https://www.epa.gov/pm-pollution/particulate-matter-pm-basics',
    usedFor: 'Размеры частиц в сравнении с волосом (50–70 мкм) и песком (90 мкм).',
  },
  {
    id: 'airnow-aqi',
    group: 'Методология и данные',
    title: 'AQI Basics',
    publisher: 'AirNow (US EPA)',
    url: 'https://www.airnow.gov/aqi/aqi-basics/',
    usedFor: 'Категории шкалы US EPA AQI.',
  },
  {
    id: 'eea-aqi',
    group: 'Методология и данные',
    title: 'European Air Quality Index',
    publisher: 'Европейское агентство по окружающей среде',
    url: 'https://airindex.eea.europa.eu/',
    usedFor: 'Пример другой системы индексов с другими границами категорий.',
  },
  {
    id: 'epa-vehicle',
    group: 'Методология и данные',
    title: 'Greenhouse Gas Emissions from a Typical Passenger Vehicle',
    publisher: 'US EPA',
    url: 'https://www.epa.gov/greenvehicles/greenhouse-gas-emissions-typical-passenger-vehicle',
    usedFor: 'Коэффициент выбросов CO₂ легкового автомобиля для калькулятора.',
  },
  {
    id: 'desnz-2025',
    group: 'Методология и данные',
    title: 'Greenhouse gas reporting: conversion factors 2025',
    publisher: 'Министерство энергетической безопасности Великобритании (DESNZ)',
    url: 'https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2025',
    usedFor: 'Коэффициент выбросов автобуса на пассажиро-километр.',
  },
  {
    id: 'openaq',
    group: 'Методология и данные',
    title: 'OpenAQ',
    publisher: 'OpenAQ (некоммерческая организация)',
    url: 'https://openaq.org/',
    usedFor: 'Открытые данные о качестве воздуха — для будущих проектов.',
  },
];

export function getSource(id) {
  return SOURCES.find((s) => s.id === id) ?? null;
}

// ── Verified facts about Tashkent (World Bank, 2024) ────────────────────────
// Quoted from the summary page of the World Bank assessment (source 'wb-tashkent').
// Shares are of PM2.5 pollution as stated in that summary; they do not add up to
// 100% because only the named sources are listed.
export const TASHKENT_ASSESSMENT = {
  sourceId: 'wb-tashkent',
  whoMultiple: 6, // "exceeds over six times the WHO's annual average guideline of 5 µg/m3"
  shares: [
    { id: 'dust', label: 'Пыль, переносимая ветром', value: 36, note: 'в том числе из-за пределов города; преобладает летом' },
    { id: 'heating', label: 'Отопление', value: 28, note: 'главный источник зимой' },
    { id: 'transport', label: 'Транспорт', value: 16, note: '' },
    { id: 'industry', label: 'Промышленность', value: 13, note: '' },
  ],
};

// ── Emission factors for the impact calculator ──────────────────────────────
// Direct (tailpipe) CO₂ / CO₂e per kilometre. These are reference values from
// other countries' fleets, used for an illustrative order-of-magnitude estimate.
export const EMISSION_FACTORS = {
  car: {
    gPerKm: 249,
    // EPA: "about 400 grams of CO2 per mile" → 400 / 1.609 ≈ 249 g/km.
    label: 'Типичный легковой автомобиль (US EPA)',
    detail: '≈ 400 г CO₂ на милю, или около 249 г на километр. Это средний автомобиль в США.',
    sourceId: 'epa-vehicle',
  },
  bus: {
    gPerPassengerKm: 104,
    // DESNZ 2025 methodology paper, "Average local bus": 103.85 g CO2e per passenger-km.
    label: 'Средний городской автобус (DESNZ, Великобритания, 2025)',
    detail: '≈ 104 г CO₂-экв. на пассажиро-километр при средней загрузке около 13 пассажиров.',
    sourceId: 'desnz-2025',
  },
  // Walking and cycling have no tailpipe emissions. Food, manufacturing and
  // infrastructure are outside the scope of this calculator.
  active: { gPerKm: 0 },
};
