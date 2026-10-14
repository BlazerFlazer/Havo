'use client';

// Active tab in the «Инструменты» section, so other sections can deep-link
// to a specific tool (e.g. "Пройти квиз" from the progress dashboard).

import { useSyncExternalStore } from 'react';
import { scrollToSection } from '@/lib/scroll';

export const TOOL_TABS = [
  { id: 'impact', label: 'Калькулятор влияния' },
  { id: 'air', label: 'Качество воздуха' },
  { id: 'quiz', label: 'Квиз' },
];

let active = 'impact';
const listeners = new Set();

export function setToolTab(id) {
  active = id;
  listeners.forEach((l) => l());
}

export function openTool(id) {
  setToolTab(id);
  scrollToSection('tools', 30);
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useToolTab() {
  return useSyncExternalStore(
    subscribe,
    () => active,
    () => 'impact',
  );
}
