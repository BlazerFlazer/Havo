'use client';

// Minimal single-slot toast: a new message replaces the previous one, so the
// user is never flooded with notifications.

import { useSyncExternalStore } from 'react';

let current = null;
let timer = null;
const listeners = new Set();

function emit() {
  for (const l of listeners) l();
}

export function showToast(message, { tone = 'success', duration = 3200 } = {}) {
  if (timer) clearTimeout(timer);
  current = { id: Date.now(), message, tone };
  emit();
  timer = setTimeout(() => {
    current = null;
    emit();
  }, duration);
}

export function dismissToast() {
  if (timer) clearTimeout(timer);
  current = null;
  emit();
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useToast() {
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => null,
  );
}
