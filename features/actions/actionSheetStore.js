'use client';

// Which action's detail drawer is open. Shared by the finder, the library and
// the planner so that a single <ActionSheet /> serves the whole page.

import { useSyncExternalStore } from 'react';

let openId = null;
const listeners = new Set();

export function openAction(id) {
  openId = id;
  listeners.forEach((l) => l());
}

export function closeAction() {
  openId = null;
  listeners.forEach((l) => l());
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useOpenActionId() {
  return useSyncExternalStore(
    subscribe,
    () => openId,
    () => null,
  );
}
