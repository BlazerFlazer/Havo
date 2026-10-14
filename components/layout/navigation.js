export const NAV_ITEMS = [
  { id: 'home', label: 'Главная' },
  { id: 'problem', label: 'Проблема' },
  { id: 'actions', label: 'Действия' },
  { id: 'tools', label: 'Инструменты' },
  { id: 'initiatives', label: 'Инициативы' },
  { id: 'progress', label: 'Мой вклад' },
];

// Sections that are tracked for the active-link indicator.
// 'levels' belongs visually to «Проблема», so it maps to it.
export const SECTION_TO_NAV = {
  home: 'home',
  manifest: 'home',
  problem: 'problem',
  levels: 'problem',
  actions: 'actions',
  tools: 'tools',
  initiatives: 'initiatives',
  progress: 'progress',
};
